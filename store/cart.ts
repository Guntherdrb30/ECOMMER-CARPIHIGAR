import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  name: string;
  priceUSD: number;
  quantity: number;
  // Snapshot del stock disponible al momento de agregar
  stock?: number;
};

export type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQty: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalUSD: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const existingItem = get().items.find((item) => item.id === product.id);
        const maxStock = typeof product.stock === 'number' ? product.stock : existingItem?.stock ?? Infinity;
        if (existingItem) {
          const nextQty = Math.min(existingItem.quantity + quantity, maxStock);
          set((state) => ({
            items: state.items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: nextQty, stock: maxStock }
                : item
            ),
          }));
        } else {
          const qty = Math.min(quantity, maxStock);
          set((state) => ({
            items: [...state.items, { ...product, quantity: qty, stock: maxStock }],
          }));
        }
      },
      updateQty: (itemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(itemId);
        } else {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === itemId
                ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock ?? quantity)) }
                : item
            ),
          }));
        }
      },
      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      getTotalUSD: () => {
        return get().items.reduce((total, item) => total + item.priceUSD * item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage', // name of the item in the storage (must be unique)
    }
  )
);
