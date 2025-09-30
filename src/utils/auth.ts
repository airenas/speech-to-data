// Storage key constant
export const SESSION_ID_KEY = 'session_id';

/**
 * Adds authentication token to a URL as a query parameter
 * @param url - The URL to add authentication to
 * @returns The URL with authentication token appended
 */
export function addAuth(url: string): string {
  const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  const res = new URL(url);
  if (sessionId) {
    // console.log('add session id');
    res.searchParams.append('token', sessionId);
  } else {
    console.warn('no session for creating url');
  }
  return res.toString();
}
