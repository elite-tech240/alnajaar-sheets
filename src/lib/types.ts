export type Lang = "ar" | "en";

export type Category = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  sort: number;
  image_url: string | null;
  is_active: boolean;
};

export type Variant = {
  id: string;
  product_id: string;
  size_ar: string;
  size_en: string;
  dims: string | null;
  color_ar: string;
  color_en: string;
  color_hex: string;
  sku: string | null;
  stock: number;
  price: number | null;
  sort: number;
};

export type Product = {
  id: string;
  slug: string;
  category_id: string | null;
  name_ar: string;
  name_en: string;
  desc_ar: string | null;
  desc_en: string | null;
  material_ar: string | null;
  material_en: string | null;
  price: number;
  compare_price: number | null;
  badge_ar: string | null;
  badge_en: string | null;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  variants?: Variant[];
  categories?: Pick<Category, "slug" | "name_ar" | "name_en"> | null;
};

export type Zone = {
  id: string;
  name_ar: string;
  name_en: string;
  fee: number;
  free_over: number | null;
  sort: number;
  is_active: boolean;
};

export type OrderStatus = "new" | "packed" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded";

export type OrderItem = {
  id: string;
  name_ar: string;
  name_en: string;
  variant_label: string;
  unit_price: number;
  qty: number;
  line_total: number;
};

export type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  email: string | null;
  governorate: string;
  area: string;
  address: string;
  notes: string | null;
  payment_method: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  gift_wrap: boolean;
  subtotal: number;
  shipping: number;
  total: number;
  created_at: string;
  order_items?: OrderItem[];
};

export const pick = <T extends Record<string, unknown>>(row: T, field: string, lang: Lang): string =>
  String(row[`${field}_${lang}`] ?? row[`${field}_ar`] ?? "");
