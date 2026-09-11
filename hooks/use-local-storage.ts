"use client"

import { useSyncExternalStore } from "react"

/**
 * SSR-safe reads of localStorage.
 *
 * Reading in an effect and calling setState would make every hydrating
 * component render twice; useSyncExternalStore lets React render the server
 * fallback and swap in the stored value as part of hydration instead.
 */

const listeners = new Set<() => void>()

const notify = (): void => {
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

/** Write a value and notify every hook reading that key */
export const writeStoredValue = (key: string, value: string): void => {
  localStorage.setItem(key, value)
  notify()
}

/** Remove a value and notify every hook reading that key */
export const removeStoredValue = (key: string): void => {
  localStorage.removeItem(key)
  notify()
}

/**
 * Read a raw string from localStorage, re-rendering when it changes.
 * Returns null while server-rendering and when the key is unset.
 */
export function useStoredValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null
  )
}

/** Read a localStorage flag written as "true"/"false" */
export function useStoredFlag(key: string, fallback: boolean): boolean {
  const stored = useStoredValue(key)
  return stored === null ? fallback : stored === "true"
}
