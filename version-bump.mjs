import { readFileSync, writeFileSync } from 'fs';

const targetVersion = process.env.npm_package_version;

// 读取manifest.json
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const versions = JSON.parse(readFileSync('versions.json', 'utf8'));

// 更新manifest版本
manifest.version = targetVersion;

// 添加新版本到versions.json
versions[targetVersion] = manifest.minAppVersion;

// 写入文件
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t'));
writeFileSync('versions.json', JSON.stringify(versions, null, '\t'));

console.log(`Updated version to ${targetVersion}`);