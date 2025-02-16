import { type ClassValue, clsx } from 'clsx'import { twMerge } from 'tailwind-merge'/** * Utility function to conditionally combine class names. * @param classes - An array of class names. * @returns A string of combined class names.
 */
export function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
}
