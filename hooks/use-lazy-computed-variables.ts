import { useState } from "react"
import { Block, Page, Variables, ComputedValues } from "@/lib/types"
import { evaluateComputedValues } from "@/lib/conditions/computed-variables"

/**
 * Manages computed variables with lazy evaluation
 *
 * Block-level computed variables share a single global namespace: a compute
 * defined in any block is visible everywhere, and computes can reference each
 * other across blocks (resolved via topological sort).
 *
 * Page-level computed variables remain scoped to their page, seeded with the
 * global block-level set.
 */
export function useLazyComputedValues(questionnaire: Block[], variables: Variables) {
  const [computedCache, setComputedCache] = useState<{
    [scopeId: string]: ComputedValues
  }>({})

  const getPageScopeId = (page: Page): string => {
    let blockIndex = -1
    let pageIndex = -1
    questionnaire.forEach((block, bIndex) => {
      const pIndex = block.pages.indexOf(page)
      if (pIndex !== -1) {
        blockIndex = bIndex
        pageIndex = pIndex
      }
    })
    return `page_${blockIndex}_${pageIndex}`
  }

  /**
   * Evaluate all block-level computed variables across the entire survey as
   * one global set. Names share a flat namespace; ordering follows topological
   * sort of dependencies.
   */
  const getGlobalComputedValues = (): ComputedValues => {
    if (computedCache._global) {
      return computedCache._global
    }

    const allBlockComputed = questionnaire.flatMap(block => block.computedVariables)
    if (allBlockComputed.length === 0) {
      return {}
    }

    const syntheticPage: Page = {
      id: 0,
      title: "",
      sections: [],
      computedVariables: allBlockComputed,
    }
    const result = evaluateComputedValues(syntheticPage, variables, {})

    setComputedCache(prev => ({ ...prev, _global: result }))
    return result
  }

  /**
   * Get computed variables visible on a specific page: global block-level set
   * plus that page's own computeds (page-level overrides global on name clash).
   */
  const getPageComputedValues = (page: Page): ComputedValues => {
    const globalVars = getGlobalComputedValues()

    if (page.computedVariables.length === 0) {
      return globalVars
    }

    const scopeId = getPageScopeId(page)
    if (computedCache[scopeId]) {
      return { ...globalVars, ...computedCache[scopeId] }
    }

    const allVars = evaluateComputedValues(page, variables, globalVars)
    const pageOnlyVars: ComputedValues = {}
    page.computedVariables.forEach(cv => {
      if (cv.name in allVars) {
        pageOnlyVars[cv.name] = allVars[cv.name]
      }
    })

    setComputedCache(prev => ({ ...prev, [scopeId]: pageOnlyVars }))
    return { ...globalVars, ...pageOnlyVars }
  }

  const invalidateCache = () => {
    setComputedCache({})
  }

  return {
    getGlobalComputedValues,
    getPageComputedValues,
    invalidateCache,
  }
}
