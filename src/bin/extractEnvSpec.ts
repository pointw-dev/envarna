import * as path from 'path';
import { pathToFileURL } from 'url';
import {
  Project,
  Expression,
  ts,
} from 'ts-morph';

import { getFieldSchemas } from '../lib/decorators.js';
import { BaseSettings } from '../lib';
import { PROJECT_ROOT } from '../lib/paths.js';

export type EnvSpec = Record<
    string,
    {
      _description?: string | null;
      _hasAlias?: boolean;
    } & Record<
    string,
    {
      default: string | null;
      fieldName: string;
      secret: boolean;
      devOnly: boolean;
      optional: boolean;
      type: string;
      description: string | null;
      pattern: string | null;
      alias?: string; // <-- Add this line
    }
>
>;

function toEnvVar(className: string, propName: string): string {
  return `${className.replace(/Settings$/, '').toUpperCase()}_${propName.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}`;
}

function findBaseCallName(expr: Expression): string | null {
  let current = expr;

  while (current.getKindName() === 'CallExpression') {
    const call = current.asKindOrThrow(ts.SyntaxKind.CallExpression);
    const inner = call.getExpression();

    if (inner.getKindName() === 'PropertyAccessExpression') {
      const access = inner.asKindOrThrow(ts.SyntaxKind.PropertyAccessExpression);
      const name = access.getName();
      const base = access.getExpression().getText();
      if (base === 'v') return name;
      current = access.getExpression();
    } else {
      break;
    }
  }

  return null;
}

export async function extractEnvSpec(scanDir = PROJECT_ROOT): Promise<EnvSpec> {
  const project = new Project({
    tsConfigFilePath: path.resolve(PROJECT_ROOT, 'tsconfig.json'),
  });

  project.addSourceFilesAtPaths([
    path.join(scanDir, '**/*.ts'),
    `!${path.join(scanDir, 'node_modules')}/**/*`,
    `!${path.join(scanDir, 'dist')}/**/*`,
    `!${path.join(scanDir, 'coverage')}/**/*`, // optional
  ]);

  const result: EnvSpec = {};

  for (const file of project.getSourceFiles()) {
    const tsPath = file.getFilePath();

    for (const cls of file.getClasses()) {
      const heritage = cls.getHeritageClauses();
      const extendsBaseSettings = heritage.some(h => h.getText().includes('BaseSettings'));
      if (!extendsBaseSettings) continue;

      const className = cls.getName()!;
      const classComment = cls.getJsDocs()[0]?.getComment() ?? null;
      const prefix = className.replace(/Settings$/, '').toUpperCase();

      const group: EnvSpec[string] = {};

      let instance: BaseSettings;
      try {
        const fileUrl = pathToFileURL(tsPath).href;
        const mod = await import(fileUrl);
        const Ctor = mod[className] ?? mod.default;

        if (!Ctor || typeof Ctor !== 'function') {
          console.warn(`[envarna] Could not resolve constructor for ${className} in ${tsPath}`);
          continue;
        }

        instance = new Ctor();
      } catch (err: any) {
        if (err?.code !== 'ERR_UNKNOWN_FILE_EXTENSION') {
          // console.warn(`[envarna] Failed to import ${tsPath}:`, err);
        }
        instance = Object.create(null);
      }

      const runtimeSchemas = instance.constructor ? getFieldSchemas(instance.constructor) : {};
      // aliasMap no longer needed for static analysis

      let anyHasAlias = false;

      for (const prop of cls.getProperties()) {
        const name = prop.getName();
        const initializer = prop.getInitializer();
        const defaultValue = initializer
            ? initializer.getText().replace(/^['"`](.*)['"`]$/, '$1')
            : null;

        const envar = toEnvVar(className, name);
        const decorators = prop.getDecorators();
        const isSecret = decorators.some(d => d.getName() === 'secret');
        const isDevOnly = decorators.some(d => d.getName() === 'devOnly');
        const fieldComment = prop.getJsDocs()[0]?.getComment();
        const description = fieldComment != null ? String(fieldComment) : null;

        let baseType = 'unknown';
        const chainModifiers: string[] = [];
        let fullPattern: string | null = null;
        let isOptional = false;

        for (const decorator of decorators) {
          const callExpr = decorator.getCallExpression();
          if (!callExpr) continue;

          const expr = callExpr.getExpression();
          if (expr.getKindName() === 'PropertyAccessExpression') {
            const access = expr.asKindOrThrow(ts.SyntaxKind.PropertyAccessExpression);
            const method = access.getName();
            const receiver = access.getExpression().getText();

            if (receiver === 'setting') {
              if (method === 'string') baseType = 'string';
              else if (method === 'number') baseType = 'number';
              else if (method === 'boolean') baseType = 'boolean';
              else if (method === 'date') baseType = 'date';
              else if (method === 'array') baseType = 'array';
              else if (method === 'object') baseType = 'object';
            }
          }

          // ✅ Handle @setting(v.enum([...])) and v.array() cases
          const firstArg = callExpr.getArguments()[0];
          if (firstArg?.getKindName() === 'CallExpression') {
            const detected = findBaseCallName(firstArg as Expression);
            if (detected === 'enum') {
              baseType = 'enum(...)'; // default placeholder, replaced below
            } else if (detected) {
              baseType = detected;
            }
          }

          const callText = callExpr.getText();

          const minMatch = callText.match(/\.min\((\d+)\)/);
          if (minMatch) chainModifiers.push(`>= ${minMatch[1]}`);

          const maxMatch = callText.match(/\.max\((\d+)\)/);
          if (maxMatch) chainModifiers.push(`<= ${maxMatch[1]}`);

          const gtMatch = callText.match(/\.gt\((\d+)\)/);
          if (gtMatch) chainModifiers.push(`> ${gtMatch[1]}`);

          const gteMatch = callText.match(/\.gte\((\d+)\)/);
          if (gteMatch) chainModifiers.push(`>= ${gteMatch[1]}`);

          const ltMatch = callText.match(/\.lt\((\d+)\)/);
          if (ltMatch) chainModifiers.push(`< ${ltMatch[1]}`);

          const lteMatch = callText.match(/\.lte\((\d+)\)/);
          if (lteMatch) chainModifiers.push(`<= ${lteMatch[1]}`);

          const lengthMatch = callText.match(/\.length\((\d+)\)/);
          if (lengthMatch) chainModifiers.push(`length=${lengthMatch[1]}`);

          if (callText.includes('.regex(')) {
            const regexMatch = callText.match(/\.regex\((\/.*?\/[gimsuy]*)\)/);
            if (regexMatch) fullPattern = regexMatch[1];
          }

          if (callText.includes('.email()')) chainModifiers.push('email');
          if (callText.includes('.url()')) chainModifiers.push('url');
          if (callText.includes('.nonempty()')) chainModifiers.push('nonempty');
          if (callText.includes('.optional()')) isOptional = true;
          if (callText.includes('.nullable()')) chainModifiers.push('nullable');

          // ✅ If we detected enum(...) above, parse its actual values
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


        const type = [baseType, ...chainModifiers].join(' ').trim();
        const pattern = fullPattern;

        let alias: string | null = null;

        for (const decorator of decorators) {
          if (decorator.getName() === 'alias') {
            const callExpr = decorator.getCallExpression();
            if (callExpr) {
              const args = callExpr.getArguments();
              if (args.length > 0) {
                alias = args[0].getText().replace(/^['"`](.*)['"`]$/, '$1');
              }
            }
          }
        }
        if (alias) anyHasAlias = true;

        group[envar] = {
          default: defaultValue,
          fieldName: name,
          secret: isSecret,
          devOnly: isDevOnly,
          optional: isOptional,
          type,
          description,
          pattern,
          ...(alias ? {alias} : {})
        };
      }

      if (classComment) {
        (group as any)._description = classComment;
      }
      if (anyHasAlias) {
        (group as any)._hasAlias = true;
      }

      result[prefix] = group;
    }
  }

  return result;
}
