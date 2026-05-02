import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * tailwind sınıflarını birleştirir; aynı özellikteki çakışmaları (bg-*, text-*) çözümler.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
