import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  Project,
  Expression,
  ts,
  CallExpression,
  PropertyAccessExpression,
} from 'ts-morph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __startdir = path.resolve(__dirname, '..', '..', '..', '..');

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
    string,
    Record<
        string,
        {
          default: string | null;
          required: boolean;
          originalName: string;
          secret: boolean;
          type: string;
        }
    >
>;

function toEnvVar(className: string, propName: string): string {
  return `${className.replace(/Settings$/, '').toUpperCase()}_${propName.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}`;
}

function getDecoratorCallChain(expr: Expression): string[] {
  const chain: string[] = [];
  let current: Expression | undefined = expr;

  while (current && current.getKindName() === 'CallExpression') {
    const call = current.asKindOrThrow(ts.SyntaxKind.CallExpression) as CallExpression;
    const callee = call.getExpression();

    if (callee.getKindName() === 'PropertyAccessExpression') {
      const propAccess = callee.asKindOrThrow(ts.SyntaxKind.PropertyAccessExpression) as PropertyAccessExpression;
      chain.unshift(propAccess.getName());
      current = propAccess.getExpression();
    } else if (callee.getKindName() === 'Identifier') {
      chain.unshift(callee.getText());
      break;
    } else {
      break;
    }
  }

  return chain;
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
        const hasQuestionToken = prop.hasQuestionToken();
        const initializer = prop.getInitializer();
        const defaultValue = initializer
            ? initializer.getText().replace(/^['"`](.*)['"`]$/, '$1')
            : null;

        const envVar = toEnvVar(className, name);

        const decorators = prop.getDecorators();
        const isSecret = decorators.some(d => d.getName() === 'secret');

        let usesDefault = false;
        let explicitlyOptional = false;
        let type = 'unknown';

        for (const decorator of decorators) {
          const callExpr = decorator.getCallExpression();
          if (!callExpr) continue;

          const chain = getDecoratorCallChain(callExpr);

          if (chain.includes('string')) type = 'string';
          if (chain.includes('number')) type = 'number';
          if (chain.includes('boolean')) type = 'boolean';
          if (chain.includes('array')) type = 'array';
          if (chain.includes('date')) type = 'date';
          if (chain.includes('url')) type = 'url';
          if (chain.includes('email')) type = 'email';
          if (chain.includes('int')) type = type === 'number' ? 'int' : type;

          const callText = callExpr.getText();

          const gtMatch = callText.match(/\.gt\((\d+)\)/);
          if (gtMatch) type += ` > ${gtMatch[1]}`;

          const minMatch = callText.match(/\.min\((\d+)\)/);
          if (minMatch) type += ` >= ${minMatch[1]}`;

          const maxMatch = callText.match(/\.max\((\d+)\)/);
          if (maxMatch) type += ` <= ${maxMatch[1]}`;

          if (/\.regex\(/.test(callText)) type += ` (pattern)`;

          const enumMatch = callText.match(/\.enum\((\[[^\]]+\])\)/);
          if (enumMatch) type = `enum ${enumMatch[1]}`;

          if (chain.includes('default')) usesDefault = true;
          if (chain.includes('optional')) explicitlyOptional = true;
        }

        const hasDefault = defaultValue !== null || usesDefault;
        const required = !hasQuestionToken && !explicitlyOptional && !hasDefault;

        group[envVar] = {
          default: defaultValue,
          required,
          originalName: name,
          secret: isSecret,
          type,
        };
      }

      result[prefix] = group;
    }
  }

  return result;
}
