import type { OrdersPort, NewOrder, Order } from '@/ports/orders';
import { databaseService } from '@/db/database.service';

export const ordersAdapter: OrdersPort = {
  list: async (): Promise<Order[]> => await databaseService.getOrders(),
  create: async (payload: NewOrder): Promise<Order> => await databaseService.createOrder(payload),
};

