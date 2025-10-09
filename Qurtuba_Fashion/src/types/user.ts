export interface User {
  id: number;
  code: string;
  name: string;
  email: string;
  phone: string;
  status: 'ادمن' | 'موظف' | 'محاسب';
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  allowedPages: string[];
  allowedActions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Page {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  category: string;
}
