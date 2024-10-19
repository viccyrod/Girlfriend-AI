import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const centsToDollars = (cents: number) => {
  return (cents / 100).toFixed(2)
}