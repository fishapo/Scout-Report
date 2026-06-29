const { spawnSync } = require('child_process');

const checks = [
  ['node', ['--test', 'server/**/*.test.js']],
  ['node', ['--check', 'server/app.js']],
  ['node', ['--check', 'server/auth.js']],
  ['node', ['--check', 'server/store.js']],
  ['node', ['--check', 'server/index.js']],
];

for (const [command, args] of checks) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
