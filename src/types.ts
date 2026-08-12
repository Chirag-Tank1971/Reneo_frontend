export type UserRole = 'SELLER' | 'CUSTOMER';

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  category: string;
  price_minor: number;
  currency: string;
  is_archived: boolean;
  quantity: number;
  available: boolean;
  created_at: string;
  updated_at: string;
  store_name?: string | null;
  seller_name?: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  store_id: string;
  quantity: number;
  unit_price_minor: number;
  currency: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  status: string;
  total_minor: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface OrderResponse {
  order: Order;
  items: OrderItem[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Profile {
  id: string;
  role: UserRole;
  email: string;
  full_name: string | null;
}
