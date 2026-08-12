import type { ApiError, OrderResponse, Pagination, Product } from '../types';
import { supabase } from './supabase';

function resolveApiUrl(): string {
  const raw = (import.meta.env.VITE_API_URL || '/api').trim();
  return raw.replace(/\/+$/, '');
}

const API_URL = resolveApiUrl();

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      await supabase.auth.signOut();
    }
    const err = payload as ApiError;
    throw new ApiClientError(
      response.status,
      err.error?.code ?? 'UNKNOWN',
      err.error?.message ?? 'Request failed',
    );
  }

  return payload as T;
}

export function formatPrice(minor: number, currency = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(minor);
}

const BOOL_QUERY_PARAMS = new Set(['mine', 'available']);

export const api = {
  listMyProducts(
    token: string,
    params: Record<string, string | number | boolean | undefined> = {},
  ) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') continue;
      if (BOOL_QUERY_PARAMS.has(key) && typeof value === 'boolean') {
        query.set(key, value ? 'true' : 'false');
      } else {
        query.set(key, String(value));
      }
    }
    const qs = query.toString();
    return request<{ data: Product[]; pagination: Pagination }>(
      `/products/mine${qs ? `?${qs}` : ''}`,
      token,
    );
  },

  listProducts(
    token: string,
    params: Record<string, string | number | boolean | undefined>,
  ) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') continue;
      if (BOOL_QUERY_PARAMS.has(key) && typeof value === 'boolean') {
        query.set(key, value ? 'true' : 'false');
      } else {
        query.set(key, String(value));
      }
    }
    const qs = query.toString();
    return request<{ data: Product[]; pagination: Pagination }>(
      `/products${qs ? `?${qs}` : ''}`,
      token,
    );
  },

  getProduct(token: string, id: string) {
    return request<{ data: Product }>(`/products/${id}`, token);
  },

  createProduct(
    token: string,
    body: {
      name: string;
      description?: string;
      category: string;
      price_minor: number;
      quantity: number;
    },
  ) {
    return request<{ data: Product }>('/products', token, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateProduct(
    token: string,
    id: string,
    body: Partial<{
      name: string;
      description: string | null;
      category: string;
      price_minor: number;
      quantity: number;
      is_archived: boolean;
    }>,
  ) {
    return request<{ data: Product }>(`/products/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  archiveProduct(token: string, id: string) {
    return request<void>(`/products/${id}`, token, { method: 'DELETE' });
  },

  createOrder(token: string, items: Array<{ product_id: string; quantity: number }>, idempotencyKey: string) {
    return request<{ data: OrderResponse }>('/orders', token, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ items }),
    });
  },
};

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
