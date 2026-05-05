export type UserRole = 'admin' | 'mechanic';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface Vehicle {
  id: string;
  clientId: string;
  plate: string;
  model: string;
  brand: string;
}

export type WorkOrderStatus = 'reception' | 'assigned' | 'in-progress' | 'ready' | 'closed';

export interface WorkOrderPart {
  partId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface WorkOrder {
  id: string;
  vehicleId: string;
  clientId: string;
  clientName: string;
  description: string;
  status: WorkOrderStatus;
  boxId?: string;
  mechanicId?: string;
  startTime?: any; // Firestore Timestamp
  endTime?: any; // Firestore Timestamp
  totalLaborTime?: number; // in minutes
  parts: WorkOrderPart[];
  totalAmount: number;
  createdAt: any;
}

export interface Part {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  price: number;
}

export interface Box {
  id: string;
  name: string;
  status: 'empty' | 'occupied' | 'critical' | 'ready';
  currentOrderId?: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  laborRate: number; // Price per hour
  logoUrl?: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  clientId: string;
  clientName: string;
  date: any;
  items: {
    description: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
}
