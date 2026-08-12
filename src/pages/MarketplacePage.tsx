import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Product } from '../types';

export function MarketplacePage() {
  const { session, profile, addToCart } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [available, setAvailable] = useState(true);
  const [sort, setSort] = useState('created_at_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!session?.access_token) return;

    async function load() {
      setLoading(true);
      setError(null);
      const token = session?.access_token;
      if (!token) return;
      try {
        const result = await api.listProducts(token, {
          page,
          limit: 12,
          search: search || undefined,
          category: category || undefined,
          available,
          sort,
        });
        setProducts(result.data);
        setTotalPages(result.pagination.total_pages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [session?.access_token, page, search, category, available, sort]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[#0f172a] to-[#134e4a55] p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">Marketplace</p>
        <h1 className="font-display mt-2 text-4xl text-white md:text-5xl">
          Discover products from trusted sellers
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Search, filter, and order with backend-enforced pricing and inventory checks.
        </p>
      </section>

      <section className="card grid gap-4 p-4 md:grid-cols-4">
        <input
          className="input md:col-span-2"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <input
          className="input"
          placeholder="Category"
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
        />
        <select
          className="input"
          value={sort}
          onChange={(e) => {
            setPage(1);
            setSort(e.target.value);
          }}
        >
          <option value="created_at_desc">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name_asc">Name A-Z</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-[var(--muted)] md:col-span-4">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => {
              setPage(1);
              setAvailable(e.target.checked);
            }}
          />
          Show only available products
        </label>
      </section>

      {loading && <p className="text-[var(--muted)]">Loading products...</p>}
      {error && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[#fecdd3]">
          {error}
        </p>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="card p-8 text-center text-[var(--muted)]">
          No products found. {profile?.role === 'SELLER' ? 'Add your first product in Seller Studio.' : ''}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            actionLabel={profile?.role === 'CUSTOMER' ? 'Add to cart' : undefined}
            onAction={
              profile?.role === 'CUSTOMER'
                ? () => addToCart({ product, quantity: 1 })
                : undefined
            }
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-[var(--muted)]">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
