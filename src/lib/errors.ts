import type { ZodError, ZodIssue } from 'zod'

export class EnvarnaError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'EnvarnaError'
    if (options?.cause !== undefined) {
      ;(this as any).cause = options.cause
    }
  }
}

export type EnvarnaIssue = {
  path: (string | number)[]
  message: string
  code?: string
}

export class EnvarnaValidationError extends EnvarnaError {
  readonly issues: EnvarnaIssue[]

  constructor(message: string, issues: EnvarnaIssue[], options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'EnvarnaValidationError'
    this.issues = issues
  }

  static fromZod(error: ZodError, opts?: { messagePrefix?: string }): EnvarnaValidationError {
    const issues: EnvarnaIssue[] = (error.errors as ZodIssue[]).map((issue) => ({
      path: issue.path,
      message: `${opts?.messagePrefix ?? ''}${opts?.messagePrefix ? ' ' : ''}${issue.message}`.trim(),
      code: (issue as any).code,
    }))
    const message = issues.map((i) => `${i.path.join('.')} - ${i.message}`).join('\n') || 'Validation failed'
    return new EnvarnaValidationError(message, issues, { cause: error })
  }
}

export function isValidationError(err: unknown): err is EnvarnaValidationError {
  return err instanceof EnvarnaValidationError
}

