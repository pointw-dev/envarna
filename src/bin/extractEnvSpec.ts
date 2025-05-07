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
    {
      _description?: string | null;
    } & Record<
    string,
    {
      default: string | null;
      originalName: string;
      secret: boolean;
      type: string;
      description: string | null;
      pattern: string | null;
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
      const classComment = cls.getJsDocs()[0]?.getComment() ?? null;
      const prefix = className.replace(/Settings$/, '').toUpperCase();

      const group: EnvSpec[string] = {};

      for (const prop of cls.getProperties()) {
        const name = prop.getName();
        const initializer = prop.getInitializer();
        const defaultValue = initializer
            ? initializer.getText().replace(/^['"`](.*)['"`]$/, '$1')
            : null;

        const envVar = toEnvVar(className, name);

        const decorators = prop.getDecorators();
        const isSecret = decorators.some(d => d.getName() === 'secret');

// [top unchanged...]

        let baseType = 'unknown';
        const modifiers: string[] = [];
        let fullPattern: string | null = null;

        for (const decorator of decorators) {
          const callExpr = decorator.getCallExpression();
          if (!callExpr) continue;

          const chain = getDecoratorCallChain(callExpr);
          const callText = callExpr.getText();

          if (chain.includes('string')) baseType = 'string';
          if (chain.includes('number')) baseType = 'number';
          if (chain.includes('boolean')) baseType = 'boolean';
          if (chain.includes('array')) baseType = 'array';
          if (chain.includes('date')) baseType = 'date';
          if (chain.includes('url')) baseType = 'url';
          if (chain.includes('email')) baseType = 'email';
          if (chain.includes('int')) baseType = 'int';

          const gtMatch = callText.match(/\.gt\((\d+)\)/);
          if (gtMatch) modifiers.push(`> ${gtMatch[1]}`);

          const gteMatch = callText.match(/\.gte\((\d+)\)/);
          if (gteMatch) modifiers.push(`>= ${gteMatch[1]}`);

          const lteMatch = callText.match(/\.lte\((\d+)\)/);
          if (lteMatch) modifiers.push(`<= ${lteMatch[1]}`);

          const minMatch = callText.match(/\.min\((\d+)\)/);
          if (minMatch) modifiers.push(`>= ${minMatch[1]}`);

          const maxMatch = callText.match(/\.max\((\d+)\)/);
          if (maxMatch) modifiers.push(`<= ${maxMatch[1]}`);

          const lengthMatch = callText.match(/\.length\((\d+)\)/);
          if (lengthMatch) modifiers.push(`length=${lengthMatch[1]}`);

          if (callText.includes('.nonempty()')) modifiers.push('nonempty');
          if (callText.includes('.nullable()')) modifiers.push('nullable');
          if (callText.includes('.regex(')) modifiers.push('[pattern]');

          const regexMatch = callText.match(/\.regex\((\/.*?\/[gimsuy]*)\)/);
          if (regexMatch) {
            if (!modifiers.includes('[pattern]')) {
              modifiers.push('[pattern]');
            }
            if (!fullPattern) {
              fullPattern = regexMatch[1];
            }
          }

          if (chain.includes('optional')) modifiers.push('[optional]');

          const enumMatch = callText.match(/\.enum\((\[[^\]]+\])\)/);
          if (enumMatch) {
            try {
              const raw = JSON.parse(enumMatch[1].replace(/'/g, '"'));
              if (Array.isArray(raw)) {
                baseType = `enum(${raw.join(',')})`;
              }
            } catch {
              baseType = 'enum(...)';
            }
          }
        }

        const type = [baseType, ...modifiers].join(' ').trim();
        const fieldComment = prop.getJsDocs()[0]?.getComment();
        const description = fieldComment != null ? String(fieldComment) : null;

        group[envVar] = {
          default: defaultValue,
          originalName: name,
          secret: isSecret,
          type,
          description,
          pattern: fullPattern,
        };
      }

      if (classComment) {
        (group as any)._description = classComment;
      }
      result[prefix] = group;
    }
  }

  return result;
}
