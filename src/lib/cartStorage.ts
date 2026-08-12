import type { CartItem, Product } from '../types';

export const CART_STORAGE_KEY = 'reneo:cart';

interface StoredCart {
  userId: string;
  items: CartItem[];
}

function normalizeCartItem(item: unknown): CartItem | null {
  if (!item || typeof item !== 'object') return null;
  const candidate = item as CartItem;
  const product = candidate.product as Product | undefined;
  if (
    typeof candidate.quantity !== 'number' ||
    candidate.quantity <= 0 ||
    typeof product?.id !== 'string' ||
    typeof product?.name !== 'string'
  ) {
    return null;
  }

  const priceMinor =
    typeof product.price_minor === 'number'
      ? product.price_minor
      : Number.parseInt(String(product.price_minor), 10);

  if (!Number.isFinite(priceMinor)) return null;

  return {
    quantity: candidate.quantity,
    product: {
      ...product,
      price_minor: priceMinor,
    },
  };
}

function readStoredCart(): StoredCart | null {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCart;
    if (!parsed || typeof parsed.userId !== 'string' || !Array.isArray(parsed.items)) {
      return null;
    }
    return {
      userId: parsed.userId,
      items: parsed.items
        .map((item) => normalizeCartItem(item))
        .filter((item): item is CartItem => item !== null),
    };
  } catch {
    return null;
  }
}

export function loadCart(userId: string): CartItem[] {
  const stored = readStoredCart();
  if (!stored || stored.userId !== userId) return [];
  return stored.items;
}

export function saveCart(userId: string, items: CartItem[]): void {
  try {
    if (items.length === 0) {
      const existing = readStoredCart();
      if (existing?.userId === userId) {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      return;
    }

    const payload: StoredCart = { userId, items };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('[Reneo] Failed to save cart to localStorage', error);
  }
}

export function clearCartStorage(userId: string): void {
  try {
    const existing = readStoredCart();
    if (!existing || existing.userId === userId) {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  } catch (error) {
    console.error('[Reneo] Failed to clear cart from localStorage', error);
  }
}

export function readStoredCartForSession(userId: string | undefined): CartItem[] {
  if (!userId) return [];
  return loadCart(userId);
}
