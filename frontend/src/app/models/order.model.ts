export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  latitude?: number;
  longitude?: number;
  serviceType: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  scheduledDate?: string;
  completedDate?: string;
  assignedToId?: number;
  assignedById?: number;
  notes?: string;
  assignedTo?: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  assignedBy?: {
    id: number;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderHistory {
  id: number;
  orderId: number;
  userId?: number;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  description?: string;
  metadata?: any;
  user?: {
    id: number;
    name: string;
    role: string;
  };
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  ordersByStatus: { status: string; count: number }[];
  ordersByPriority: { priority: string; count: number }[];
  recentOrders: number;
  completedThisMonth: number;
  activeEmployees: number;
  busiestEmployees: any[];
}
