// Holds the shared initialized settings
import { BaseSettings } from './BaseSettings'

export type SyncOrAsync<T> = T | Promise<T>
export type SettingsLoaders = Record<string, () => SyncOrAsync<BaseSettings>>

const registry: Record<string, BaseSettings> = {}
let isInitialized = false
const waiters: Array<() => void> = []

export async function initializeLoaders(loaders: SettingsLoaders): Promise<void> {
  const entries = await Promise.all(
    Object.entries(loaders).map(async ([key, loader]) => {
      const value = await loader()
      return [key, value] as const
    })
  )

  for (const [key, value] of entries) {
    registry[key] = value
  }
  isInitialized = true
  // Notify any waiters
  while (waiters.length > 0) {
    try { (waiters.shift()!)() } catch {}
  }
}

export function getInitializedSetting(key: string): BaseSettings | undefined {
  return registry[key]
}

export function getInitializedKeys(): string[] {
  return Object.keys(registry)
}

export function settingsInitialized(): boolean {
  return isInitialized
}

export function waitForInitialization(): Promise<void> {
  if (isInitialized) return Promise.resolve()
  return new Promise<void>((resolve) => {
    waiters.push(resolve)
  })
}

// Test-only: resets the registry and initialization flag
export function __resetInitializationForTest(): void {
  for (const key of Object.keys(registry)) {
    delete registry[key]
  }
  isInitialized = false
  while (waiters.length > 0) {
    waiters.shift()
  }
}
