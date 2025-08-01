import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"

/**
 * Utility function for combining Tailwind CSS classes
 * Merges class names and resolves conflicts using tailwind-merge
 * 
 * @param inputs - Class values to merge
 * @returns Combined class string with conflicts resolved
 * 
 * @example
 * cn("px-2 py-1", "px-4") // "py-1 px-4" (px-4 wins over px-2)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
