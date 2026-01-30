/**
 * Get the base URL for the application
 * Works in both development and production
 */
export function getBaseUrl(): string {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Browser: use current origin
    return window.location.origin;
  }

  // Server-side: check environment variables
  // Production: use NEXTAUTH_URL or NEXT_PUBLIC_BASE_URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Development fallback
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Default to localhost for development
  return process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' // Replace with your actual domain
    : 'http://localhost:9002';
}

/**
 * Get the full URL for an API route
 */
export function getApiUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Get the full URL for a page route
 */
export function getPageUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

