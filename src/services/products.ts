import { supabase } from "@/lib/supabase";

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getCategories() {
  const { data, error } = await supabase.from("categories").select("*");

  if (error) throw error;
  return data;
}
