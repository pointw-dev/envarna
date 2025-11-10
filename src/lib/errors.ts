import type { ZodError, ZodIssue } from 'zod'

export class EnvarnaError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    // Avoid relying on ES2022 Error options in compiled output; set name and cause manually.
    super(message)
    this.name = 'EnvarnaError'
    if (options?.cause !== undefined) {
      // Define non-enumerable cause to avoid duplication in logs/JSON while preserving chaining.
      Object.defineProperty(this, 'cause', {
        value: options.cause,
        enumerable: false,
        configurable: true,
      })
    }
  }
}

export type EnvarnaIssue = {
  path: (string | number)[]
  message: string
  code?: string
  meta?: Record<string, unknown>
}

export class EnvarnaValidationError extends EnvarnaError {
  readonly issues: EnvarnaIssue[]

  constructor(message: string, issues: EnvarnaIssue[], options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'EnvarnaValidationError'
    this.issues = issues
  }

  static fromZod(
    error: ZodError,
    opts?: {
      messageFormatter?: (issues: EnvarnaIssue[]) => string
      formatIssue?: (issue: ZodIssue) => Partial<Pick<EnvarnaIssue, 'message' | 'code' | 'meta'>>
    }
  ): EnvarnaValidationError {
    const zIssues: ZodIssue[] = ((error as any).issues ?? (error as any).errors) as ZodIssue[]
    const issues: EnvarnaIssue[] = zIssues.map((issue) => {
      const base: EnvarnaIssue = {
        path: issue.path,
        message: issue.message,
      }
      // Attach code if present
      if ((issue as any).code) base.code = (issue as any).code
      // Optional, portable metadata from common Zod issue fields
      const meta: Record<string, unknown> = {}
      for (const key of ['expected', 'received', 'minimum', 'maximum', 'inclusive', 'validation', 'type']) {
        if ((issue as any)[key] !== undefined) meta[key] = (issue as any)[key]
      }
      if (Object.keys(meta).length > 0) base.meta = meta
      // Allow caller to override/augment per-issue fields
      if (opts?.formatIssue) {
        const patch = opts.formatIssue(issue)
        if (patch.message !== undefined) base.message = patch.message
        if (patch.code !== undefined) base.code = patch.code
        if (patch.meta !== undefined) base.meta = patch.meta
      }
      return base
    })
    const message = (opts?.messageFormatter?.(issues))
      ?? (issues.map((i) => `${i.path.join('.')} - ${i.message}`).join('\n') || 'Validation failed')
    return new EnvarnaValidationError(message, issues, { cause: error })
  }

  toJSON(): { name: string; message: string; issues: EnvarnaIssue[] } {
    return { name: this.name, message: this.message, issues: this.issues }
  }
}

export function isValidationError(err: unknown): err is EnvarnaValidationError {
  return err instanceof EnvarnaValidationError
}
