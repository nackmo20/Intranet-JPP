import { spawnSync } from 'node:child_process';
const result = spawnSync('python3', ['scripts/build-studio.py'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
