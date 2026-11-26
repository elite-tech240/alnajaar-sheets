import "server-only";
import { publicClient } from "./supabase";
import type { Category, Product, Zone } from "./types";

const PRODUCT_FIELDS = "*, variants(*), categories(slug,name_ar,name_en)";

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await publicClient().from("categories").select("*").eq("is_active", true).order("sort");
  if (error) throw error;
  return data ?? [];
}

export async function getFeatured(limit = 8): Promise<Product[]> {
  const { data, error } = await publicClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProducts(categoryId?: string): Promise<Product[]> {
  let q = publicClient().from("products").select(PRODUCT_FIELDS).eq("is_active", true);
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProduct(slug: string): Promise<Product | null> {
  const { data, error } = await publicClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (data?.variants) (data.variants as Product["variants"])!.sort((a, b) => a.sort - b.sort);
  return data as Product | null;
}

export async function getZones(): Promise<Zone[]> {
  const { data, error } = await publicClient().from("shipping_zones").select("*").eq("is_active", true).order("sort");
  if (error) throw error;
  return data ?? [];
}
