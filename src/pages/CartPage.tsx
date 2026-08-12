import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, formatPrice, newIdempotencyKey } from '../lib/api';
import type { OrderResponse } from '../types';

export function CartPage() {
  const { session, cart, updateCartQuantity, removeFromCart, clearCart } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);

  const total = cart.reduce(
    (sum, item) => sum + item.product.price_minor * item.quantity,
    0,
  );

  async function checkout() {
    if (!session?.access_token || cart.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await api.createOrder(
        session.access_token,
        cart.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        newIdempotencyKey(),
      );
      setOrder(result.data);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="card p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--success)]">Order confirmed</p>
          <h1 className="font-display mt-2 text-4xl text-white">Thank you!</h1>
          <p className="mt-3 text-[var(--muted)]">
            Order <span className="text-white">{order.order.id.slice(0, 8)}...</span> placed for{' '}
            {formatPrice(order.order.total_minor, order.order.currency)}.
          </p>
          <Link to="/" className="btn btn-primary mt-6 inline-flex">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">Checkout</p>
          <h1 className="font-display mt-2 text-4xl text-white">Your cart</h1>
        </div>

        {cart.length === 0 ? (
          <div className="card p-8 text-center text-[var(--muted)]">
            Cart is empty. <Link to="/" className="text-[var(--accent)]">Browse products</Link>
          </div>
        ) : (
          cart.map((item) => (
            <article key={item.product.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{item.product.name}</h2>
                <p className="text-sm text-[var(--muted)]">
                  {formatPrice(item.product.price_minor, item.product.currency)} each
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  className="input w-20"
                  type="number"
                  min={1}
                  max={item.product.quantity}
                  value={item.quantity}
                  onChange={(e) =>
                    updateCartQuantity(item.product.id, Number.parseInt(e.target.value, 10) || 1)
                  }
                />
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeFromCart(item.product.id)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <aside className="card h-fit p-6">
        <h2 className="text-lg font-semibold text-white">Summary</h2>
        <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          <div className="flex justify-between">
            <span>Items</span>
            <span>{cart.reduce((n, item) => n + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-white">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[#fecdd3]">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary mt-6 w-full"
          disabled={submitting || cart.length === 0}
          onClick={() => void checkout()}
        >
          {submitting ? 'Placing order...' : 'Place order'}
        </button>

        <p className="mt-3 text-xs text-[var(--muted)]">
          Prices are validated server-side. Each checkout uses an idempotency key to prevent duplicate
          orders.
        </p>
      </aside>
    </div>
  );
}
