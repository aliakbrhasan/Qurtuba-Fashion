export interface Order {
  id: string;
  customer_id?: string;
  customer_name: string;
  total: number;
  created_at: string;
}

export interface NewOrder {
  customer_name: string;
  total: number;
}

export interface OrdersPort {
  list(): Promise<Order[]>;
  create(payload: NewOrder): Promise<Order>;
}

