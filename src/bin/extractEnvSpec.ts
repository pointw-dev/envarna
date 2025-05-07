import * as path from 'path';
import { pathToFileURL } from 'url';
import {
  Project,
  Expression,
  ts,
  CallExpression,
  PropertyAccessExpression,
} from 'ts-morph';

import { getFieldSchemas, isSecret } from '../lib/decorators.js';
import { BaseSettings } from '../lib';
import { z, ZodTypeAny } from 'zod';
import { PROJECT_ROOT, SETTINGS_DIR } from '../lib/paths.js';

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

function unwrapSchema(schema: ZodTypeAny): ZodTypeAny {
  const def = schema._def;
  if (def.typeName === 'ZodEffects') return unwrapSchema(def.schema);
  if (def.typeName === 'ZodOptional') return unwrapSchema(def.innerType);
  if (def.typeName === 'ZodNullable') return unwrapSchema(def.innerType);
  if (def.typeName === 'ZodDefault') return unwrapSchema(def.innerType);
  return schema;
}

function inferZodType(schema: ZodTypeAny): { type: string; pattern: string | null } {
  const unwrapped = unwrapSchema(schema);
  const def = unwrapped._def;

  const modifiers: string[] = [];
  let baseType = 'unknown';
  let pattern: string | null = null;

  switch (def.typeName) {
    case 'ZodString':
      baseType = 'string';
      if (def.checks) {
        for (const check of def.checks) {
          if (check.kind === 'min') modifiers.push(`>= ${check.value}`);
          if (check.kind === 'max') modifiers.push(`<= ${check.value}`);
          if (check.kind === 'regex') {
            modifiers.push('[pattern]');
            pattern = check.regex.toString();
          }
          if (check.kind === 'email') modifiers.push('email');
          if (check.kind === 'url') modifiers.push('url');
        }
      }
      break;

    case 'ZodNumber':
      baseType = 'number';
      if (def.checks) {
        for (const check of def.checks) {
          if (check.kind === 'min') modifiers.push(`>= ${check.value}`);
          if (check.kind === 'max') modifiers.push(`<= ${check.value}`);
          if (check.kind === 'gt') modifiers.push(`> ${check.value}`);
          if (check.kind === 'lt') modifiers.push(`< ${check.value}`);
        }
      }
      break;

    case 'ZodBoolean':
      baseType = 'boolean';
      break;

    case 'ZodDate':
      baseType = 'date';
      break;

    case 'ZodEnum':
      baseType = `enum(${(def as any).values.join(',')})`;
      break;

    case 'ZodArray':
      baseType = 'array';
      break;

    default:
      baseType = 'unknown';
  }

  return {
    type: [baseType, ...modifiers].join(' ').trim(),
    pattern,
  };
}

export async function extractEnvSpec(settingsDir = SETTINGS_DIR): Promise<EnvSpec> {
  const project = new Project({
    tsConfigFilePath: path.resolve(PROJECT_ROOT, 'tsconfig.json'),
  });

  project.addSourceFilesAtPaths(path.join(settingsDir, '**/*.ts'));

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
      } catch (err) {
        console.warn(`[envarna] Failed to import .ts file ${tsPath}:`, err);
        instance = Object.create(null);
      }

      const runtimeSchemas = instance.constructor ? getFieldSchemas(instance.constructor) : {};

      for (const prop of cls.getProperties()) {
        const name = prop.getName();
        const initializer = prop.getInitializer();
        const defaultValue = initializer
            ? initializer.getText().replace(/^['"`](.*)['"`]$/, '$1')
            : null;

        const envVar = toEnvVar(className, name);
        const decorators = prop.getDecorators();
        const isSecret = decorators.some(d => d.getName() === 'secret');
        const fieldComment = prop.getJsDocs()[0]?.getComment();
        const description = fieldComment != null ? String(fieldComment) : null;

        let baseType = 'unknown';
        const chainModifiers: string[] = [];
        let fullPattern: string | null = null;

        for (const decorator of decorators) {
          const callExpr = decorator.getCallExpression();
          if (!callExpr) continue;

          const chain = getDecoratorCallChain(callExpr);
          const callText = callExpr.getText();

// base types
          if (chain.includes('string')) baseType = 'string';
          if (chain.includes('number')) baseType = 'number';
          if (chain.includes('boolean')) baseType = 'boolean';
          if (chain.includes('array')) baseType = 'array';
          if (chain.includes('date')) baseType = 'date';

          const exprText = callExpr.getArguments()[0]?.getText() ?? '';

          if (exprText.includes('v.string(')) baseType = 'string';
          if (exprText.includes('v.number(')) baseType = 'number';
          if (exprText.includes('v.boolean(')) baseType = 'boolean';
          if (exprText.includes('v.date(')) baseType = 'date';
          if (exprText.includes('v.array(')) baseType = 'array';
          if (exprText.includes('v.object(')) baseType = 'object';

// refinements
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

          if (callText.includes('.regex(')) chainModifiers.push('[pattern]');
          const regexMatch = callText.match(/\.regex\((\/.*?\/[gimsuy]*)\)/);
          if (regexMatch) fullPattern = regexMatch[1];

          if (callText.includes('.email()')) chainModifiers.push('email');
          if (callText.includes('.url()')) chainModifiers.push('url');
          if (callText.includes('.nonempty()')) chainModifiers.push('nonempty');
          if (callText.includes('.optional()')) chainModifiers.push('[optional]');
          if (callText.includes('.nullable()')) chainModifiers.push('nullable');


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

        let type = [baseType, ...chainModifiers].join(' ').trim();
        let pattern = fullPattern;

        if (runtimeSchemas[name]) {
          const { type: rtType, pattern: rtPattern } = inferZodType(runtimeSchemas[name]);
          if (rtType !== 'unknown') {
            type = rtType;
            pattern = pattern ?? rtPattern;
          }
        }

        group[envVar] = {
          default: defaultValue,
          originalName: name,
          secret: isSecret,
          type,
          description,
          pattern,
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
