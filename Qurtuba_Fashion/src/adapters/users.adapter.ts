import type { User, Role } from '@/types/user';
import { databaseService } from '@/db/database.service';

export interface UsersPort {
  getUsers(): Promise<User[]>;
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getRoles(): Promise<Role[]>;
}

export const usersAdapter: UsersPort = {
  getUsers: async (): Promise<User[]> => await databaseService.getUsers(),
  createUser: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => await databaseService.createUser(user),
  updateUser: async (id: number, updates: Partial<User>): Promise<User> => await databaseService.updateUser(id, updates),
  deleteUser: async (id: number): Promise<void> => await databaseService.deleteUser(id),
  getRoles: async (): Promise<Role[]> => await databaseService.getRoles(),
};
