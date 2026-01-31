"use client"

import { createContext, useContext } from "react"

const InstanceIdContext = createContext<string>("")

export const InstanceIdProvider = InstanceIdContext.Provider

export function useInstanceId(): string {
  const id = useContext(InstanceIdContext)
  return id ? `${id}-` : ""
}
