import { useState } from "react"
import { Block, Page, Variables, ComputedVariables } from "@/lib/types"
import { evaluateComputedVariables } from "@/lib/conditions/computed-variables"

/**
 * Manages computed variables with lazy evaluation
 * Variables are only calculated when their scope (block/page) is entered
 */
export function useLazyComputedVariables(questionnaire: Block[], variables: Variables) {
  // Store computed variables by scope identifier
  const [computedCache, setComputedCache] = useState<{
    [scopeId: string]: ComputedVariables
  }>({})

  /**
   * Generate a unique scope identifier for a block or page
   */
  const getScopeId = (scope: Block | Page, type: 'block' | 'page'): string => {
    if (type === 'block') {
      const block = scope as Block
      return `block_${block.name || 'default'}`
    } else {
      const page = scope as Page
      // Find block index and page index for unique identification
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
  }

  /**
   * Compute variables for a specific scope (block or page)
   */
  const computeForScope = (
    scope: Block | Page,
    type: 'block' | 'page',
    existingComputedVars: ComputedVariables = {}
  ): ComputedVariables => {
    const scopeId = getScopeId(scope, type)

    // Check if already computed
    if (computedCache[scopeId]) {
      return computedCache[scopeId]
    }

    let computedVars: ComputedVariables = {}

    if (type === 'block') {
      const block = scope as Block
      if (block.computedVariables.length > 0) {
        // Create a mock page to evaluate block-level computed variables
        const mockPage: Page = {
          title: "",
          sections: [],
          computedVariables: block.computedVariables
        }
        computedVars = evaluateComputedVariables(mockPage, variables, existingComputedVars)
      }
    } else {
      const page = scope as Page
      if (page.computedVariables.length > 0) {
        computedVars = evaluateComputedVariables(page, variables, existingComputedVars)
      }
    }

    // Cache the result
    setComputedCache(prev => ({
      ...prev,
      [scopeId]: computedVars
    }))

    return computedVars
  }

  /**
   * Get computed variables for a specific block (compute if not cached)
   */
  const getBlockComputedVariables = (block: Block): ComputedVariables => {
    return computeForScope(block, 'block')
  }

  /**
   * Get computed variables for a specific page (compute if not cached)
   * Includes block-level computed variables as dependencies
   */
  const getPageComputedVariables = (page: Page): ComputedVariables => {
    // Find the block containing this page
    const containingBlock = questionnaire.find(block => block.pages.includes(page))

    // Get block-level computed variables first
    const blockComputedVars = containingBlock ? getBlockComputedVariables(containingBlock) : {}

    // Then get page-level computed variables
    const pageComputedVars = computeForScope(page, 'page', blockComputedVars)

    // Return combined variables (page-level takes precedence)
    return { ...blockComputedVars, ...pageComputedVars }
  }

  /**
   * Invalidate cache when variables change
   */
  const invalidateCache = () => {
    setComputedCache({})
  }

  /**
   * Invalidate cache for a specific scope (when user re-enters that scope)
   */
  const invalidateScopeCache = (scope: Block | Page, type: 'block' | 'page') => {
    const scopeId = getScopeId(scope, type)
    setComputedCache(prev => {
      const newCache = { ...prev }
      delete newCache[scopeId]
      return newCache
    })
  }

  return {
    getBlockComputedVariables,
    getPageComputedVariables,
    invalidateCache,
    invalidateScopeCache
  }
}