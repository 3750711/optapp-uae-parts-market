/**
 * Utility functions for array deduplication
 */

/**
 * Removes duplicate strings from an array
 * @param arr Array of strings to deduplicate
 * @returns Array with unique strings only
 */
export const deduplicateArray = (arr: string[]): string[] => {
  return [...new Set(arr)];
};

/**
 * Combines two string arrays and removes duplicates
 * @param arr1 First array
 * @param arr2 Second array  
 * @returns Combined array with unique strings only
 */
export const combineAndDeduplicate = (arr1: string[], arr2: string[]): string[] => {
  return deduplicateArray([...arr1, ...arr2]);
};