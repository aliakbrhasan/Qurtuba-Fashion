import { supabase } from './client';
import type { Order, NewOrder } from '@/ports/orders';

export async function listOrdersRepo(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, customer_name, total, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return data || [];
}

export async function createOrderRepo(payload: NewOrder): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }

  return data;
}

