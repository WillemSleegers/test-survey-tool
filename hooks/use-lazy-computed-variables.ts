import { useState, useCallback, useMemo } from "react"
import { Block, Page, Responses, ComputedVariables } from "@/lib/types"
import { evaluateComputedVariables } from "@/lib/conditions/computed-variables"

/**
 * Manages computed variables with lazy evaluation
 * Variables are only calculated when their scope (block/page) is entered
 */
export function useLazyComputedVariables(questionnaire: Block[], responses: Responses) {
  // Store computed variables by scope identifier
  const [computedCache, setComputedCache] = useState<{
    [scopeId: string]: ComputedVariables
  }>({})

  /**
   * Generate a unique scope identifier for a block or page
   */
  const getScopeId = useCallback((scope: Block | Page, type: 'block' | 'page'): string => {
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
  }, [questionnaire])

  /**
   * Compute variables for a specific scope (block or page)
   */
  const computeForScope = useCallback((
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
          content: "",
          questions: [],
          sections: [],
          computedVariables: block.computedVariables
        }
        computedVars = evaluateComputedVariables(mockPage, responses, existingComputedVars)
      }
    } else {
      const page = scope as Page
      if (page.computedVariables.length > 0) {
        computedVars = evaluateComputedVariables(page, responses, existingComputedVars)
      }
    }
    
    // Cache the result
    setComputedCache(prev => ({
      ...prev,
      [scopeId]: computedVars
    }))
    
    return computedVars
  }, [computedCache, getScopeId, responses])

  /**
   * Get computed variables for a specific block (compute if not cached)
   */
  const getBlockComputedVariables = useCallback((block: Block): ComputedVariables => {
    return computeForScope(block, 'block')
  }, [computeForScope])

  /**
   * Get computed variables for a specific page (compute if not cached)
   * Includes block-level computed variables as dependencies
   */
  const getPageComputedVariables = useCallback((page: Page): ComputedVariables => {
    // Find the block containing this page
    const containingBlock = questionnaire.find(block => block.pages.includes(page))
    
    // Get block-level computed variables first
    const blockComputedVars = containingBlock ? getBlockComputedVariables(containingBlock) : {}
    
    // Then get page-level computed variables
    const pageComputedVars = computeForScope(page, 'page', blockComputedVars)
    
    // Return combined variables (page-level takes precedence)
    return { ...blockComputedVars, ...pageComputedVars }
  }, [computeForScope, getBlockComputedVariables, questionnaire])

  /**
   * Invalidate cache when responses change
   */
  const invalidateCache = useCallback(() => {
    setComputedCache({})
  }, [])

  /**
   * Invalidate cache for a specific scope (when user re-enters that scope)
   */
  const invalidateScopeCache = useCallback((scope: Block | Page, type: 'block' | 'page') => {
    const scopeId = getScopeId(scope, type)
    setComputedCache(prev => {
      const newCache = { ...prev }
      delete newCache[scopeId]
      return newCache
    })
  }, [getScopeId])

  return {
    getBlockComputedVariables,
    getPageComputedVariables,
    invalidateCache,
    invalidateScopeCache,
    // For debugging: expose current cache state
    computedCache
  }
}