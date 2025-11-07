import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely copy text to clipboard with proper error handling
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      console.warn("Clipboard API not supported in this browser");
      return false;
    }
    
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}
