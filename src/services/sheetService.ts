/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const API_URL = import.meta.env.VITE_API_URL;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T = any>(
  action: 'getAll' | 'getById' | 'create' | 'update' | 'delete',
  sheet: string,
  payload?: { id?: string; data?: any }
): Promise<T> {
  const body: any = { action, sheet };
  if (payload?.id) body.id = payload.id;
  if (payload?.data) body.data = payload.data;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json: ApiResponse<T> = await res.json();

    if (!json.success) {
      throw new Error(json.error || 'Unknown API error');
    }

    return json.data as T;
  } catch (error) {
    console.error(`[sheetService] ${action}@${sheet} failed:`, error);
    throw error;
  }
}

export function getAll<T = any>(sheet: string): Promise<T[]> {
  return request<T[]>('getAll', sheet);
}

export function getById<T = any>(sheet: string, id: string): Promise<T> {
  return request<T>('getById', sheet, { id });
}

export function create<T = any>(sheet: string, data: any): Promise<T> {
  return request<T>('create', sheet, { data });
}

export function update<T = any>(sheet: string, id: string, data: any): Promise<T> {
  return request<T>('update', sheet, { id, data });
}

export function remove<T = any>(sheet: string, id: string): Promise<T> {
  return request<T>('delete', sheet, { id });
}
