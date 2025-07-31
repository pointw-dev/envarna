// Holds the shared initialized settings
import { BaseSettings } from './BaseSettings'

export type SyncOrAsync<T> = T | Promise<T>
export type SettingsLoaders = Record<string, () => SyncOrAsync<BaseSettings>>

const registry: Record<string, BaseSettings> = {}
let isInitialized = false

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
