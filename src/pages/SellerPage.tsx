import { FormEvent, useEffect, useMemo, useState } from 'react';
import { EditProductModal } from '../components/EditProductModal';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Product } from '../types';

const emptyForm = {
  name: '',
  description: '',
  category: '',
  price_minor: '',
  quantity: '0',
};

type CatalogFilter = 'active' | 'archived' | 'all';

export function SellerPage() {
  const { session, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>('active');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const filteredProducts = useMemo(() => {
    if (catalogFilter === 'archived') {
      return products.filter((p) => p.is_archived);
    }
    if (catalogFilter === 'active') {
      return products.filter((p) => !p.is_archived);
    }
    return products;
  }, [products, catalogFilter]);

  const archivedCount = useMemo(() => products.filter((p) => p.is_archived).length, [products]);

  async function loadProducts() {
    if (!session?.access_token || profile?.role !== 'SELLER') return;
    setLoading(true);
    try {
      const result = await api.listMyProducts(session.access_token, {
        page: 1,
        limit: 100,
      });
      setProducts(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, [session?.access_token, profile?.role]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!session?.access_token) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await api.createProduct(session.access_token, {
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        price_minor: Number.parseInt(form.price_minor, 10),
        quantity: Number.parseInt(form.quantity, 10),
      });
      setForm(emptyForm);
      setCatalogFilter('active');
      setMessage('Product created successfully.');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive(productId: string) {
    if (!session?.access_token) return;
    setError(null);
    try {
      await api.archiveProduct(session.access_token, productId);
      setMessage('Product archived. View it under the Archived tab.');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive product');
    }
  }

  async function handleRestore(productId: string) {
    if (!session?.access_token) return;
    setError(null);
    try {
      await api.updateProduct(session.access_token, productId, { is_archived: false });
      setMessage('Product restored to your active catalog.');
      setCatalogFilter('active');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore product');
    }
  }

  async function handleSaveEdit(updates: {
    name: string;
    description: string;
    category: string;
    price_minor: number;
    quantity: number;
  }) {
    if (!session?.access_token || !editingProduct) return;

    setSavingEdit(true);
    setError(null);
    setMessage(null);

    try {
      await api.updateProduct(session.access_token, editingProduct.id, {
        name: updates.name,
        description: updates.description || null,
        category: updates.category,
        price_minor: updates.price_minor,
        quantity: updates.quantity,
      });
      setEditingProduct(null);
      setMessage('Product updated successfully.');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">Seller Studio</p>
        <h1 className="font-display mt-2 text-4xl text-white">Manage your catalog</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Active products appear in the marketplace. Archived products are hidden from customers but
          stay in your catalog here.
        </p>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white">Create product</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={(e) => void handleCreate(e)}>
          <input
            className="input"
            placeholder="Product name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />
          <input
            className="input md:col-span-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className="input"
            type="number"
            min="0"
            placeholder="Price (FCFA minor units)"
            value={form.price_minor}
            onChange={(e) => setForm({ ...form, price_minor: e.target.value })}
            required
          />
          <input
            className="input"
            type="number"
            min="0"
            placeholder="Initial stock"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
          />
          <button type="submit" className="btn btn-primary md:col-span-2" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create product'}
          </button>
        </form>
      </section>

      {message && (
        <p className="rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 px-4 py-3 text-sm text-[#bbf7d0]">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[#fecdd3]">
          {error}
        </p>
      )}

      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">Your products</h2>
          <div className="flex gap-2 rounded-xl bg-[var(--surface-2)] p-1">
            {(
              [
                ['active', 'Active'],
                ['archived', `Archived${archivedCount > 0 ? ` (${archivedCount})` : ''}`],
                ['all', 'All'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  catalogFilter === value ? 'bg-[var(--surface)] text-white' : 'text-[var(--muted)]'
                }`}
                onClick={() => setCatalogFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-[var(--muted)]">Loading...</p>
        ) : filteredProducts.length === 0 ? (
          <div className="card p-8 text-center text-[var(--muted)]">
            {catalogFilter === 'archived'
              ? 'No archived products yet.'
              : catalogFilter === 'active'
                ? 'No active products yet.'
                : 'No products yet.'}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                actionLabel="Edit"
                onAction={() => setEditingProduct(product)}
                secondaryActionLabel={product.is_archived ? 'Restore' : 'Archive'}
                onSecondaryAction={() =>
                  void (product.is_archived
                    ? handleRestore(product.id)
                    : handleArchive(product.id))
                }
              />
            ))}
          </div>
        )}
      </section>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          open={Boolean(editingProduct)}
          submitting={savingEdit}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
