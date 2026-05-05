import { db } from '../firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, increment, getDoc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { WorkOrder, Part, WorkOrderStatus, CompanySettings } from '../types';

export const workshopService = {
  async createWorkOrder(data: { clientId: string; clientName: string; vehicleId: string; description: string; mechanicId?: string }) {
    const orderData = {
      ...data,
      status: 'reception',
      createdAt: serverTimestamp(),
      parts: [],
      totalAmount: 0
    };

    const docRef = await addDoc(collection(db, 'workOrders'), orderData);
    return docRef.id;
  },

  async updateWorkOrder(orderId: string, data: Partial<WorkOrder>) {
    const docRef = doc(db, 'workOrders', orderId);
    await updateDoc(docRef, data);
  },

  async createClient(data: { name: string; email?: string; phone?: string }) {
    const docRef = await addDoc(collection(db, 'clients'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async updateClient(clientId: string, data: { name: string; email?: string; phone?: string }) {
    const docRef = doc(db, 'clients', clientId);
    await updateDoc(docRef, data);
  },

  async updateUserRole(userId: string, role: 'admin' | 'mechanic') {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { role });
  },

  async deleteUser(userId: string) {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
  },

  async toggleBoxStatus(boxId: string, currentStatus: string) {
    const boxRef = doc(db, 'boxes', boxId);
    const newStatus = currentStatus === 'empty' ? 'critical' : 'empty';
    await setDoc(boxRef, { status: newStatus }, { merge: true });
  },

  async assignWorkOrder(orderId: string, boxId: string, mechanicId: string) {
    const docRef = doc(db, 'workOrders', orderId);
    await updateDoc(docRef, {
      boxId,
      mechanicId,
      status: 'assigned',
    });
  },

  async startWorkOrder(orderId: string) {
    const docRef = doc(db, 'workOrders', orderId);
    await updateDoc(docRef, {
      status: 'in-progress',
      startTime: serverTimestamp(),
    });
  },

  async stopWorkOrder(orderId: string) {
    console.log('Stopping work order:', orderId);
    const docRef = doc(db, 'workOrders', orderId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`La orden de trabajo con ID ${orderId} no existe.`);
    }

    const data = docSnap.data() as WorkOrder;
    const rawStartTime = data.startTime;
    let startTime: Date | null = null;
    
    if (rawStartTime) {
      if (typeof (rawStartTime as any).toDate === 'function') {
        startTime = (rawStartTime as any).toDate();
      } else {
        startTime = new Date(rawStartTime);
      }
    }

    const endTime = new Date();
    
    let laborMinutes = data.totalLaborTime || 0;
    if (startTime && !isNaN(startTime.getTime())) {
      const diffMs = endTime.getTime() - startTime.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      // Ensure we don't add negative time
      if (diffMin > 0) {
        laborMinutes += diffMin;
      }
      console.log(`Calculated additional labor: ${diffMin} mins. Total: ${laborMinutes} mins.`);
    }

    const settings = await this.getCompanySettings();
    const hourlyRate = settings.laborRate || 45;
    const laborCost = (laborMinutes / 60) * hourlyRate;
    const parts = data.parts || [];
    const partsCost = parts.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    const totalAmount = laborCost + partsCost;

    console.log(`Updating order ${orderId} with status 'ready', totalAmount: ${totalAmount}`);

    await updateDoc(docRef, {
      status: 'ready',
      endTime: serverTimestamp(),
      totalLaborTime: laborMinutes,
      totalAmount: totalAmount,
      parts: parts 
    });
  },

  async addPartToOrder(orderId: string, partId: string, quantity: number) {
    const orderRef = doc(db, 'workOrders', orderId);
    const partRef = doc(db, 'inventory', partId);
    
    const partSnap = await getDoc(partRef);
    if (!partSnap.exists()) return;
    const partData = partSnap.data() as Part;

    if (partData.stock < quantity) throw new Error('Insufficient stock');

    // Update stock
    await updateDoc(partRef, {
      stock: increment(-quantity),
    });

    // Add to order
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data() as WorkOrder;
    const parts = orderData.parts || [];
    const existingPartIndex = parts.findIndex(p => p.partId === partId);
    
    let newParts = [...parts];
    if (existingPartIndex > -1) {
      newParts[existingPartIndex].quantity += quantity;
    } else {
      newParts.push({
        partId,
        name: partData.name,
        quantity,
        price: partData.price,
      });
    }

    const settings = await this.getCompanySettings();
    const laborCost = ((orderData.totalLaborTime || 0) / 60) * (settings.laborRate || 45);
    const partsCost = newParts.reduce((acc, p) => acc + (p.price * p.quantity), 0);

    await updateDoc(orderRef, {
      parts: newParts,
      totalAmount: laborCost + partsCost,
    });
  },

  async closeWorkOrder(orderId: string) {
    await updateDoc(doc(db, 'workOrders', orderId), {
      status: 'closed',
    });
  },

  async addInventoryPart(data: Omit<Part, 'id'>) {
    const docRef = await addDoc(collection(db, 'inventory'), data);
    return docRef.id;
  },

  async updateInventoryPart(partId: string, data: Partial<Part>) {
    const docRef = doc(db, 'inventory', partId);
    await updateDoc(docRef, data);
  },

  async deleteInventoryPart(partId: string) {
    const docRef = doc(db, 'inventory', partId);
    await deleteDoc(docRef);
  },

  async getCompanySettings() {
    const docRef = doc(db, 'settings', 'company');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CompanySettings;
    }
    return {
      name: 'Mi Taller Mecánico',
      address: '',
      phone: '',
      email: '',
      taxId: '',
      laborRate: 45,
    } as CompanySettings;
  },

  async updateCompanySettings(data: CompanySettings) {
    const docRef = doc(db, 'settings', 'company');
    await setDoc(docRef, data);
  }
};
