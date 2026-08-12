import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function CartToast() {
  const { cartToast, dismissCartToast } = useAuth();

  if (!cartToast) return null;

  return (
    <div
      className="cart-toast fixed bottom-6 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl sm:right-6"
      role="status"
      aria-live="polite"
    >
      <span className="cart-toast-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--success)_20%,transparent)] text-[var(--success)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">Added to cart</p>
        <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
          {cartToast.quantity > 1
            ? `${cartToast.quantity} × ${cartToast.productName}`
            : cartToast.productName}
        </p>
        <Link
          to="/cart"
          className="mt-2 inline-block text-sm font-semibold text-[var(--accent)] hover:underline"
          onClick={dismissCartToast}
        >
          View cart
        </Link>
      </div>

      <button
        type="button"
        className="shrink-0 rounded-md p-1 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-white"
        aria-label="Dismiss"
        onClick={dismissCartToast}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
