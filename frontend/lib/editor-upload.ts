'use client';

export { API_URL } from './config';
import { getToken } from './admin-api';

/** Bearer header for raw fetch() calls that bypass the adminApi helper. */
export function getTokenHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
