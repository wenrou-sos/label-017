export interface User {
  id: number;
  username: string;
  realName: string;
  role: 'admin' | 'planner' | 'viewer';
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  productCode: string;
  productName: string;
  processHours: number;
  unit: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Machine {
  id: number;
  machineCode: string;
  machineName: string;
  type: string;
  status: 'running' | 'idle' | 'maintenance' | 'broken';
  capacity: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNo: string;
  productId: number;
  product?: Product;
  quantity: number;
  estimatedHours: number;
  deliveryDate: string;
  status: 'pending' | 'scheduled' | 'producing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: number;
  orderId: number;
  order?: Order;
  machineId: number;
  machine?: Machine;
  startTime: string;
  endTime: string;
  actualHours: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  version: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictInfo {
  hasConflict: boolean;
  conflicts: Array<{
    scheduleId: number;
    orderNo: string;
    productName: string;
    startTime: string;
    endTime: string;
    overlapMinutes: number;
  }>;
}

export interface OperationLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  module: string;
  targetId: number;
  details: string;
  ip: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateOrderRequest {
  orderNo: string;
  productId: number;
  quantity: number;
  deliveryDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
}

export interface CreateScheduleRequest {
  orderId: number;
  machineId: number;
  startTime: string;
  endTime: string;
}

export interface CheckConflictRequest {
  scheduleId?: number;
  machineId: number;
  startTime: string;
  endTime: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  scheduledOrders: number;
  completedOrders: number;
  totalMachines: number;
  runningMachines: number;
  todaySchedules: number;
  totalLoadRate: number;
}

export interface MachineLoad {
  machineId: number;
  machineName: string;
  loadHours: number;
  totalHours: number;
  loadRate: number;
}
