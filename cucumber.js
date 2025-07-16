module.exports = {
  default: [
    '--require-module', 'ts-node/register',
    '--require', 'tests/**/*.ts',
    '--format', 'progress'
  ]
};