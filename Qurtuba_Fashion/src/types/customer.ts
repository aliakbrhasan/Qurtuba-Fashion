export interface CustomerMeasurements {
  height: number;
  shoulder: number;
  waist: number;
  chest: number;
  collar: number;
}

export interface CustomerOrder {
  id: string;
  type: string;
  status: string;
  orderDate: string;
  deliveryDate: string;
  total: number;
  paid: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  totalSpent: number;
  lastOrder: string;
  label: string;
  // When true, the system assigns label automatically based on activity
  // When false, the user-selected manual label is preserved
  label_auto?: boolean;
  measurements: CustomerMeasurements;
  orders: CustomerOrder[];
  notes?: string;
  created_at?: string;
}
