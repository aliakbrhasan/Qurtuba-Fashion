export interface CustomerMeasurements {
  height: number;
  shoulder: number;
  waist: number;
  chest: number;
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
  measurements: CustomerMeasurements;
  orders: CustomerOrder[];
  notes?: string;
  created_at?: string;
}
