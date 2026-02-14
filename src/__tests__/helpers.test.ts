import { FileSystemHelper, StringHelper, DateTimeHelper, CollectionHelper, ErrorHelper } from '../utils/helpers';

describe('FileSystemHelper', () => {
  test('getFileExtension should return correct extension', () => {
    expect(FileSystemHelper.getFileExtension('test.md')).toBe('md');
    expect(FileSystemHelper.getFileExtension('test.txt')).toBe('txt');
    expect(FileSystemHelper.getFileExtension('test')).toBe('');
    expect(FileSystemHelper.getFileExtension('test.min.js')).toBe('js');
  });

  test('formatFileSize should format correctly', () => {
    expect(FileSystemHelper.formatFileSize(0)).toBe('0 B');
    expect(FileSystemHelper.formatFileSize(1024)).toBe('1.00 KB');
    expect(FileSystemHelper.formatFileSize(1024 * 1024)).toBe('1.00 MB');
    expect(FileSystemHelper.formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
  });

  test('isFileExcluded should match patterns', () => {
    const patterns = ['*.tmp', '.*', 'node_modules/'];
    
    expect(FileSystemHelper.isFileExcluded('test.tmp', patterns)).toBe(true);
    expect(FileSystemHelper.isFileExcluded('.gitignore', patterns)).toBe(true);
    expect(FileSystemHelper.isFileExcluded('node_modules/package.json', patterns)).toBe(true);
    expect(FileSystemHelper.isFileExcluded('test.md', patterns)).toBe(false);
  });
});

describe('StringHelper', () => {
  test('truncate should truncate long strings', () => {
    expect(StringHelper.truncate('Hello World', 5)).toBe('He...');
    expect(StringHelper.truncate('Hello', 10)).toBe('Hello');
    expect(StringHelper.truncate('Hello World', 8, '***')).toBe('Hello ***');
  });

  test('sanitizeFilename should remove illegal characters', () => {
    expect(StringHelper.sanitizeFilename('test<file>.txt')).toBe('test_file_.txt');
    expect(StringHelper.sanitizeFilename('file:name.txt')).toBe('file_name.txt');
    expect(StringHelper.sanitizeFilename('normal-file.txt')).toBe('normal-file.txt');
  });

  test('highlightSearch should highlight matches', () => {
    expect(StringHelper.highlightSearch('Hello World', 'World')).toBe('Hello <mark>World</mark>');
    expect(StringHelper.highlightSearch('Hello World', 'hello')).toBe('Hello <mark>Hello</mark>');
    expect(StringHelper.highlightSearch('Hello World', '')).toBe('Hello World');
  });
});

describe('DateTimeHelper', () => {
  test('formatDateTime should format correctly', () => {
    const date = new Date('2023-01-01T12:30:45');
    expect(DateTimeHelper.formatDateTime(date, 'yyyy-MM-dd')).toBe('2023-01-01');
    expect(DateTimeHelper.formatDateTime(date, 'HH:mm:ss')).toBe('12:30:45');
  });

  test('getTimeDifference should calculate correctly', () => {
    const start = new Date('2023-01-01T00:00:00');
    const end = new Date('2023-01-02T01:30:45');
    
    const diff = DateTimeHelper.getTimeDifference(start, end);
    expect(diff.days).toBe(1);
    expect(diff.hours).toBe(1);
    expect(diff.minutes).toBe(30);
    expect(diff.seconds).toBe(45);
  });
});

describe('CollectionHelper', () => {
  test('unique should remove duplicates', () => {
    expect(CollectionHelper.unique([1, 2, 2, 3])).toEqual([1, 2, 3]);
    
    const objects = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 1, name: 'C' }
    ];
    
    expect(CollectionHelper.unique(objects, 'id')).toHaveLength(2);
  });

  test('groupBy should group correctly', () => {
    const items = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
      { category: 'A', value: 3 }
    ];
    
    const groups = CollectionHelper.groupBy(items, 'category');
    expect(groups.A).toHaveLength(2);
    expect(groups.B).toHaveLength(1);
  });
});

describe('ErrorHelper', () => {
  test('getUserFriendlyError should return friendly messages', () => {
    expect(ErrorHelper.getUserFriendlyError('NetworkError')).toBe('网络连接失败，请检查网络设置');
    expect(ErrorHelper.getUserFriendlyError('timeout')).toBe('请求超时，请稍后重试');
    expect(ErrorHelper.getUserFriendlyError('permission denied')).toBe('权限不足，请检查访问权限');
    expect(ErrorHelper.getUserFriendlyError('Some error')).toBe('Some error');
  });
});