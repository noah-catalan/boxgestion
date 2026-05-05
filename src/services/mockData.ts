import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const generateMockData = async () => {
  try {
    // 1. Clients
    const clients = [
      { name: 'Juan Pérez', phone: '600111222', email: 'juan@example.com' },
      { name: 'María García', phone: '600333444', email: 'maria@example.com' },
      { name: 'Carlos Ruiz', phone: '600555666', email: 'carlos@example.com' },
      { name: 'Elena Martínez', phone: '600777888', email: 'elena@example.com' },
      { name: 'Roberto Gómez', phone: '600999000', email: 'roberto@example.com' },
    ];

    const clientIds: string[] = [];
    for (const client of clients) {
      const doc = await addDoc(collection(db, 'clients'), client);
      clientIds.push(doc.id);
    }

    // 2. Vehicles
    const vehicles = [
      { plate: '1234ABC', model: 'Golf', brand: 'Volkswagen', clientId: clientIds[0] },
      { plate: '5678DEF', model: 'A3', brand: 'Audi', clientId: clientIds[1] },
      { plate: '9012GHI', model: 'Clio', brand: 'Renault', clientId: clientIds[2] },
      { plate: '3456JKL', model: 'Focus', brand: 'Ford', clientId: clientIds[3] },
      { plate: '7890MNP', model: '308', brand: 'Peugeot', clientId: clientIds[4] },
    ];

    const vehicleIds: string[] = [];
    for (const vehicle of vehicles) {
      const doc = await addDoc(collection(db, 'vehicles'), vehicle);
      vehicleIds.push(doc.id);
    }

    // 3. Inventory
    const inventory = [
      { name: 'Aceite 5W30 5L', stock: 50, minStock: 10, price: 45 },
      { name: 'Filtro de Aceite', stock: 100, minStock: 20, price: 12 },
      { name: 'Pastillas de Freno Delanteras', stock: 20, minStock: 5, price: 65 },
      { name: 'Líquido Refrigerante 5L', stock: 30, minStock: 8, price: 18 },
      { name: 'Batería 70Ah', stock: 15, minStock: 4, price: 95 },
      { name: 'Bujía Iridium', stock: 80, minStock: 16, price: 14 },
      { name: 'Filtro de Aire', stock: 40, minStock: 10, price: 22 },
    ];

    for (const item of inventory) {
      await addDoc(collection(db, 'inventory'), item);
    }

    // 4. Work Orders (Reception)
    const workOrders = [
      { vehicleId: '1234ABC', clientId: clientIds[0], clientName: 'Juan Pérez', description: 'Revisión anual y cambio de aceite.', status: 'reception', createdAt: serverTimestamp(), parts: [], totalAmount: 0 },
      { vehicleId: '5678DEF', clientName: 'María García', clientId: clientIds[1], description: 'Ruido extraño en la suspensión delantera.', status: 'reception', createdAt: serverTimestamp(), parts: [], totalAmount: 0 },
      { vehicleId: '9012GHI', clientName: 'Carlos Ruiz', clientId: clientIds[2], description: 'Frenos chillan al frenar suave.', status: 'reception', createdAt: serverTimestamp(), parts: [], totalAmount: 0 },
    ];

    for (const order of workOrders) {
      await addDoc(collection(db, 'workOrders'), order);
    }

    alert('Datos de prueba generados correctamente.');
  } catch (error) {
    console.error('Error generating mock data:', error);
    alert('Error al generar datos de prueba.');
  }
};
