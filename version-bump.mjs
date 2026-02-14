import { readFileSync, writeFileSync } from 'fs';

const targetVersion = process.env.npm_package_version;

// 读取manifest.json
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
manifest.version = targetVersion;
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t'));

// 读取或创建versions.json
let versions = {};
try {
	versions = JSON.parse(readFileSync('versions.json', 'utf8'));
} catch {}

versions[targetVersion] = manifest.minAppVersion;
writeFileSync('versions.json', JSON.stringify(versions, null, '\t'));

console.log(`版本已更新至: ${targetVersion}`);