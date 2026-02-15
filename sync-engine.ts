import { App, TFile, TFolder, normalizePath } from 'obsidian';
import { OpenClawAPIClient, MemoryFile } from './api-client';

export interface OpenClawMemorySyncSettings {
  apiUrl: string;
  apiPort: number;
  syncInterval: number;
  autoSync: boolean;
  conflictStrategy: 'timestamp' | 'local' | 'remote' | 'ask';
  excludePatterns: string[];
  enableWebSocket: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  targetFolder: string;
}

export enum SyncState {
  IDLE = 'idle',
  SYNCING = 'syncing',
  CONFLICT = 'conflict',
  ERROR = 'error',
  PAUSED = 'paused'
}

export interface SyncError {
  message: string;
  file?: string;
  timestamp: Date;
  retryable: boolean;
}

export interface SyncStatus {
  state: SyncState;
  progress: number;
  currentFile: string;
  filesSynced: number;
  totalFiles: number;
  lastSync: Date | null;
  errors: SyncError[];
}

export interface FileDiff {
  added: string[];
  modified: string[];
  deleted: string[];
  conflicts: string[];
}

export class SyncEngine {
  private status: SyncStatus = {
    state: SyncState.IDLE,
    progress: 0,
    currentFile: '',
    filesSynced: 0,
    totalFiles: 0,
    lastSync: null,
    errors: []
  };

  private statusChangeHandlers: ((status: SyncStatus) => void)[] = [];
  private isPaused = false;
  private syncQueue: string[] = [];
  private fileCache: Map<string, { content: string; modified: Date }> = new Map();

  constructor(
    private app: App,
    private apiClient: OpenClawAPIClient,
    private settings: OpenClawMemorySyncSettings
  ) {
    // 监听WebSocket事件
    if (this.settings.enableWebSocket) {
      this.apiClient.on('file_changed', (data: any) => {
        this.handleRemoteChange(data);
      });
    }
  }

  async sync(): Promise<void> {
    if (this.status.state === SyncState.SYNCING) {
      throw new Error('同步正在进行中');
    }

    if (this.isPaused) {
      throw new Error('同步已暂停');
    }

    try {
      this.updateStatus({
        state: SyncState.SYNCING,
        progress: 0,
        currentFile: '正在准备同步...',
        filesSynced: 0,
        totalFiles: 0,
        errors: []
      });

      // 1. 获取远程文件列表
      const remoteFiles = await this.apiClient.getFiles();

      // 2. 获取本地文件列表
      const localFiles = await this.getLocalFiles();

      // 3. 计算差异
      const diff = this.calculateDiff(remoteFiles, localFiles);

      // 4. 应用差异
      await this.applyDiff(diff);

      // 5. 更新状态
      this.updateStatus({
        state: SyncState.IDLE,
        progress: 100,
        currentFile: '',
        filesSynced: diff.added.length + diff.modified.length + diff.deleted.length,
        totalFiles: remoteFiles.length + localFiles.length,
        lastSync: new Date(),
        errors: []
      });
    } catch (error) {
      this.updateStatus({
        state: SyncState.ERROR,
        errors: [
          {
            message: error.message,
            timestamp: new Date(),
            retryable: true
          }
        ]
      });
      throw error;
    }
  }

  async getLocalFiles(): Promise<MemoryFile[]> {
    const targetFolder = this.settings.targetFolder;
    const folder = this.app.vault.getAbstractFileByPath(targetFolder);

    if (!folder || !(folder instanceof TFolder)) {
      return [];
    }

    const files: MemoryFile[] = [];

    // 递归遍历文件夹
    const walkFolder = (folder: TFolder) => {
      for (const child of folder.children) {
        if (child instanceof TFile && child.extension === 'md') {
          // 检查是否在排除模式中
          if (this.isExcluded(child.path)) {
            continue;
          }

          files.push({
            name: child.name,
            path: child.path,
            size: child.stat.size,
            created: new Date(child.stat.ctime),
            modified: new Date(child.stat.mtime),
            lines: this.app.vault
              .read(child)
              .then(content => content.split('\n').length)
              .catch(() => 0),
            preview: ''
          });
        } else if (child instanceof TFolder) {
          walkFolder(child);
        }
      }
    };

    walkFolder(folder);

    // 等待所有行数计算完成
    for (const file of files) {
      file.lines = await file.lines;
    }

    return files;
  }

  private calculateDiff(remoteFiles: MemoryFile[], localFiles: MemoryFile[]): FileDiff {
    const diff: FileDiff = {
      added: [],
      modified: [],
      deleted: [],
      conflicts: []
    };

    const remoteMap = new Map(remoteFiles.map(f => [f.name, f]));
    const localMap = new Map(localFiles.map(f => [f.name, f]));

    // 检查远程有但本地没有的文件（需要添加）
    for (const [filename] of remoteMap) {
      if (!localMap.has(filename)) {
        diff.added.push(filename);
      }
    }

    // 检查本地有但远程没有的文件（需要删除或上传）
    for (const [filename] of localMap) {
      if (!remoteMap.has(filename)) {
        // 根据设置决定是删除还是上传
        if (this.settings.conflictStrategy === 'local') {
          diff.added.push(filename); // 实际上传本地文件
        } else {
          diff.deleted.push(filename);
        }
      }
    }

    // 检查都有但修改时间不同的文件
    for (const [filename, remoteFile] of remoteMap) {
      const localFile = localMap.get(filename);
      if (localFile) {
        const remoteTime = remoteFile.modified.getTime();
        const localTime = localFile.modified.getTime();

        if (Math.abs(remoteTime - localTime) > 1000) {
          // 1秒容差
          diff.modified.push(filename);

          // 检查是否为冲突（双方都修改了）
          const cached = this.fileCache.get(filename);
          if (
            cached &&
            Math.abs(cached.modified.getTime() - remoteTime) > 1000 &&
            Math.abs(cached.modified.getTime() - localTime) > 1000
          ) {
            diff.conflicts.push(filename);
          }
        }
      }
    }

    return diff;
  }

  private async applyDiff(diff: FileDiff): Promise<void> {
    const totalOperations = diff.added.length + diff.modified.length + diff.deleted.length;
    let completedOperations = 0;

    // 处理添加的文件
    for (const filename of diff.added) {
      this.updateStatus({
        currentFile: `正在下载: ${filename}`,
        progress: (completedOperations / totalOperations) * 100
      });

      try {
        const fileContent = await this.apiClient.getFile(filename);
        await this.saveLocalFile(filename, fileContent.content);
        completedOperations++;
      } catch (error) {
        this.addError(`下载文件失败: ${filename}`, error, true);
      }
    }

    // 处理修改的文件
    for (const filename of diff.modified) {
      this.updateStatus({
        currentFile: `正在同步: ${filename}`,
        progress: (completedOperations / totalOperations) * 100
      });

      try {
        // 根据冲突解决策略处理
        if (diff.conflicts.includes(filename)) {
          await this.resolveConflict(filename);
        } else {
          // 获取最新的版本
          const fileContent = await this.apiClient.getFile(filename);
          await this.saveLocalFile(filename, fileContent.content);
        }
        completedOperations++;
      } catch (error) {
        this.addError(`同步文件失败: ${filename}`, error, true);
      }
    }

    // 处理删除的文件
    for (const filename of diff.deleted) {
      this.updateStatus({
        currentFile: `正在删除: ${filename}`,
        progress: (completedOperations / totalOperations) * 100
      });

      try {
        await this.deleteLocalFile(filename);
        completedOperations++;
      } catch (error) {
        this.addError(`删除文件失败: ${filename}`, error, false);
      }
    }
  }

  private async resolveConflict(filename: string): Promise<void> {
    switch (this.settings.conflictStrategy) {
      case 'timestamp':
        await this.resolveByTimestamp(filename);
        break;
      case 'local':
        await this.uploadLocalFile(filename);
        break;
      case 'remote':
        await this.downloadRemoteFile(filename);
        break;
      case 'ask':
        // 在实际实现中，这里应该弹出对话框让用户选择
        // 暂时使用时间戳策略
        await this.resolveByTimestamp(filename);
        break;
    }
  }

  private async resolveByTimestamp(filename: string): Promise<void> {
    try {
      const remoteFile = await this.apiClient.getFile(filename);
      const localPath = this.getLocalPath(filename);
      const localFile = this.app.vault.getAbstractFileByPath(localPath);

      if (localFile instanceof TFile) {
        const remoteTime = remoteFile.stats.modified.getTime();
        const localTime = localFile.stat.mtime;

        if (remoteTime > localTime) {
          // 远程版本更新，下载远程版本
          await this.saveLocalFile(filename, remoteFile.content);
        } else {
          // 本地版本更新，上传本地版本
          const localContent = await this.app.vault.read(localFile);
          await this.apiClient.saveFile(filename, localContent);
        }
      }
    } catch (error) {
      throw new Error(`冲突解决失败: ${error.message}`);
    }
  }

  private async downloadRemoteFile(filename: string): Promise<void> {
    const fileContent = await this.apiClient.getFile(filename);
    await this.saveLocalFile(filename, fileContent.content);
  }

  private async uploadLocalFile(filename: string): Promise<void> {
    const localPath = this.getLocalPath(filename);
    const localFile = this.app.vault.getAbstractFileByPath(localPath);

    if (localFile instanceof TFile) {
      const content = await this.app.vault.read(localFile);
      await this.apiClient.saveFile(filename, content);
    }
  }

  private async saveLocalFile(filename: string, content: string): Promise<void> {
    const filePath = this.getLocalPath(filename);
    const normalizedPath = normalizePath(filePath);

    // 确保目录存在
    const dirPath = normalizedPath.split('/').slice(0, -1).join('/');
    if (dirPath) {
      await this.app.vault.createFolder(dirPath).catch(() => {
        // 文件夹可能已存在，忽略错误
      });
    }

    const existingFile = this.app.vault.getAbstractFileByPath(normalizedPath);

    if (existingFile instanceof TFile) {
      await this.app.vault.modify(existingFile, content);
    } else {
      await this.app.vault.create(normalizedPath, content);
    }

    // 更新缓存
    this.fileCache.set(filename, {
      content,
      modified: new Date()
    });
  }

  private async deleteLocalFile(filename: string): Promise<void> {
    const filePath = this.getLocalPath(filename);
    const file = this.app.vault.getAbstractFileByPath(filePath);

    if (file instanceof TFile) {
      await this.app.vault.delete(file);
    }

    // 从缓存中移除
    this.fileCache.delete(filename);
  }

  private getLocalPath(filename: string): string {
    return normalizePath(`${this.settings.targetFolder}/${filename}`);
  }

  private isExcluded(filePath: string): boolean {
    for (const pattern of this.settings.excludePatterns) {
      if (pattern.startsWith('*.')) {
        // 通配符扩展名匹配
        const ext = pattern.substring(1);
        if (filePath.endsWith(ext)) {
          return true;
        }
      } else if (pattern.startsWith('.')) {
        // 隐藏文件匹配
        const parts = filePath.split('/');
        if (parts.some(part => part.startsWith('.'))) {
          return true;
        }
      } else if (pattern.endsWith('/')) {
        // 目录匹配
        if (filePath.includes(pattern)) {
          return true;
        }
      } else {
        // 精确匹配
        if (filePath === pattern) {
          return true;
        }
      }
    }
    return false;
  }

  private async handleRemoteChange(data: any): Promise<void> {
    if (this.status.state !== SyncState.IDLE || this.isPaused) {
      return;
    }

    const { event, filename } = data;

    try {
      switch (event) {
        case 'added':
        case 'changed': {
          const fileContent = await this.apiClient.getFile(filename);
          await this.saveLocalFile(filename, fileContent.content);
          break;
        }

        case 'deleted': {
          await this.deleteLocalFile(filename);
          break;
        }
      }
    } catch (error) {
      console.error(`处理远程变更失败 (${event}: ${filename}):`, error);
    }
  }

  // 状态管理
  private updateStatus(updates: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...updates };
    this.notifyStatusChange();
  }

  private addError(message: string, error: any, retryable: boolean): void {
    this.status.errors.push({
      message: `${message}: ${error.message}`,
      timestamp: new Date(),
      retryable
    });
    this.notifyStatusChange();
  }

  private notifyStatusChange(): void {
    this.statusChangeHandlers.forEach(handler => {
      try {
        handler({ ...this.status });
      } catch (error) {
        console.error('状态变更处理器错误:', error);
      }
    });
  }

  // 公共方法
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  onStatusChange(handler: (status: SyncStatus) => void): void {
    this.statusChangeHandlers.push(handler);
  }

  offStatusChange(handler: (status: SyncStatus) => void): void {
    const index = this.statusChangeHandlers.indexOf(handler);
    if (index > -1) {
      this.statusChangeHandlers.splice(index, 1);
    }
  }

  pause(): void {
    this.isPaused = true;
    if (this.status.state === SyncState.SYNCING) {
      this.updateStatus({ state: SyncState.PAUSED });
    }
  }

  resume(): void {
    this.isPaused = false;
    if (this.status.state === SyncState.PAUSED) {
      this.updateStatus({ state: SyncState.IDLE });
    }
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  cleanup(): void {
    this.statusChangeHandlers = [];
    this.fileCache.clear();
    this.syncQueue = [];
  }
}
