import { FormEvent, useEffect, useState } from 'react';
import type { Product } from '../types';

interface EditProductModalProps {
  product: Product;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSave: (updates: {
    name: string;
    description: string;
    category: string;
    price_minor: number;
    quantity: number;
  }) => Promise<void>;
}

export function EditProductModal({
  product,
  open,
  submitting,
  onClose,
  onSave,
}: EditProductModalProps) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? '');
  const [category, setCategory] = useState(product.category);
  const [priceMinor, setPriceMinor] = useState(String(product.price_minor));
  const [quantity, setQuantity] = useState(String(product.quantity));

  useEffect(() => {
    if (open) {
      setName(product.name);
      setDescription(product.description ?? '');
      setCategory(product.category);
      setPriceMinor(String(product.price_minor));
      setQuantity(String(product.quantity));
    }
  }, [open, product]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({
      name,
      description,
      category,
      price_minor: Number.parseInt(priceMinor, 10),
      quantity: Number.parseInt(quantity, 10),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="card w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-title"
      >
        <h2 id="edit-product-title" className="text-lg font-semibold text-white">
          Edit product
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{product.name}</p>

        <form className="mt-5 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Category</label>
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Description</label>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Price (FCFA)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={priceMinor}
                onChange={(e) => setPriceMinor(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Stock quantity</label>
              <input
                className="input"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
