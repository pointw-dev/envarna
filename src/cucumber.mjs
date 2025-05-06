export default [
  './features/**/*.feature',
  '--import', 'ts-node/esm',
  '--import', './tests/**/*.ts'
];
