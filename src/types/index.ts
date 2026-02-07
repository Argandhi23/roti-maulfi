// src/types/index.ts

export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface DailySale {
  id: string;
  date: string;
  product_id: number;
  price_at_sale: number;
  production_qty: number;
  return_qty: number;
  sold_qty: number;
  total_income: number;
  // Tambahan untuk menampung hasil Join dari tabel products
  products?: {
    name: string;
  };
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string; // Contoh: 'Bahan Baku', 'Operasional'
}