import { useState } from 'react';
import { formatPrice } from '../lib/api';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryDisabled?: boolean;
}

export function ProductCard({
  product,
  actionLabel = 'Add to cart',
  onAction,
  disabled,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryDisabled,
}: ProductCardProps) {
  const isAddToCart = actionLabel === 'Add to cart';
  const [justAdded, setJustAdded] = useState(false);

  function handleAction() {
    if (!onAction) return;
    onAction();
    if (isAddToCart) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 700);
    }
  }

  return (
    <article className="card flex h-full flex-col overflow-hidden">
      <div className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <span className="badge badge-muted">{product.category}</span>
          <div className="flex flex-wrap gap-2">
            {product.is_archived && (
              <span className="badge bg-amber-500/15 text-amber-200">Archived</span>
            )}
            <span className={product.available ? 'badge badge-success' : 'badge badge-muted'}>
              {product.available ? 'In stock' : 'Out of stock'}
            </span>
          </div>
        </div>
        <h3 className="font-display text-2xl leading-tight text-white">{product.name}</h3>
        {(product.seller_name || product.store_name) && (
          <p className="mt-2 text-sm">
            <span className="font-medium text-[var(--accent)]">
              {product.seller_name ?? product.store_name}
            </span>
            {product.seller_name && product.store_name ? (
              <span className="text-[var(--muted)]"> · {product.store_name}</span>
            ) : null}
          </p>
        )}
        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{product.description}</p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Price</p>
            <p className="text-2xl font-semibold text-white">
              {formatPrice(product.price_minor, product.currency)}
            </p>
          </div>
          <p className="text-sm text-[var(--muted)]">Qty: {product.quantity}</p>
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          {onAction && (
            <button
              type="button"
              className={`btn btn-primary flex-1 ${justAdded ? 'btn-cart-added' : ''}`}
              onClick={handleAction}
              disabled={
                disabled ?? (isAddToCart ? !product.available : false)
              }
            >
              {justAdded ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Added
                </>
              ) : (
                actionLabel
              )}
            </button>
          )}
          {onSecondaryAction && secondaryActionLabel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onSecondaryAction}
              disabled={secondaryDisabled}
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
