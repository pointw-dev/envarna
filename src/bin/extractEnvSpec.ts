import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Project } from 'ts-morph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __startdir = path.resolve(__dirname, '..', '..', '..', '..')


function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error('package.json not found in any parent directory.');
}

export const PROJECT_ROOT = findProjectRoot(__startdir);
export const SETTINGS_DIR = path.resolve(PROJECT_ROOT, 'src/settings');

export type EnvSpec = Record<
  string, // section name (e.g., "MONGO")
  Record<
    string, // env var (e.g., "MONGO_DB_NAME")
    {
      default: string | null;
      optional: boolean;
      originalName: string;
    }
  >
>;

function toEnvVar(className: string, propName: string): string {
  return `${className.replace(/Settings$/, '').toUpperCase()}_${propName.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}`;
}

export function extractEnvSpec(settingsDir = SETTINGS_DIR): EnvSpec {
  const project = new Project({
    tsConfigFilePath: path.resolve(PROJECT_ROOT, 'tsconfig.json'),
  });

  project.addSourceFilesAtPaths(path.join(settingsDir, '**/*.ts'));

  const result: EnvSpec = {};

  for (const file of project.getSourceFiles()) {
    for (const cls of file.getClasses()) {
      const heritage = cls.getHeritageClauses();
      const extendsBaseSettings = heritage.some(h =>
        h.getText().includes('BaseSettings')
      );
      if (!extendsBaseSettings) continue;

      const className = cls.getName()!;
      const prefix = className.replace(/Settings$/, '').toUpperCase();

      const group: EnvSpec[string] = {};

      for (const prop of cls.getProperties()) {
        const name = prop.getName();
        const hasExclamation = prop.getText().includes('!:');
        const initializer = prop.getInitializer();
        const defaultValue = initializer
          ? initializer.getText().replace(/^["'`](.*)["'`]$/, '$1')
          : null;
        const envVar = toEnvVar(className, name);

        group[envVar] = {
          default: defaultValue,
          optional: !hasExclamation,
          originalName: name,
        };
      }

      result[prefix] = group;
    }
  }

  return result;
}
