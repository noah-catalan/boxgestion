import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { WorkOrder, Client, Vehicle, Part, Box } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export function useWorkOrders() {
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const path = 'workOrders';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkOrder)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, []);

  return { data, loading };
}

export function useClients() {
  const [data, setData] = useState<Client[]>([]);
  useEffect(() => {
    if (!auth.currentUser) return;
    const path = 'clients';
    return onSnapshot(collection(db, path), (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, []);
  return data;
}

export function useVehicles() {
  const [data, setData] = useState<Vehicle[]>([]);
  useEffect(() => {
    if (!auth.currentUser) return;
    const path = 'vehicles';
    return onSnapshot(collection(db, path), (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, []);
  return data;
}

export function useInventory() {
  const [data, setData] = useState<Part[]>([]);
  useEffect(() => {
    if (!auth.currentUser) return;
    const path = 'inventory';
    return onSnapshot(collection(db, path), (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Part)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, []);
  return data;
}

export function useMechanics() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    if (!auth.currentUser) return;
    const path = 'users';
    const q = query(collection(db, path), where('role', '==', 'mechanic'));
    return onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, []);
  return data;
}

export function useBoxes() {
  const [data, setData] = useState<Box[]>([]);
  useEffect(() => {
    if (!auth.currentUser) return;
    const path = 'boxes';
    return onSnapshot(collection(db, path), (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Box)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, []);
  return data;
}

export function useAllUsers() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    if (!auth.currentUser) return;
    const path = 'users';
    return onSnapshot(collection(db, path), (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, []);
  return data;
}
