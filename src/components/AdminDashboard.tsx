import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWorkOrders, useMechanics, useInventory, useBoxes, useClients, useAllUsers } from '../hooks/useFirestore';
import { WorkshopMap } from './WorkshopMap';
import { OTCard } from './OTCard';
import { workshopService } from '../services/workshopService';
import { LayoutDashboard, Users, Package, FileText, Plus, X, Database, LogOut, Edit2, Trash2, Settings, Shield, UserPlus, Menu } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateMockData } from '../services/mockData';
import { logout, db } from '../firebase';
import { Part, WorkOrder, Client, CompanySettings } from '../types';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { data: workOrders } = useWorkOrders();
  const mechanics = useMechanics();
  const clients = useClients();
  const boxes = useBoxes();
  const [activeTab, setActiveTab] = useState('map');
  const [showAssignModal, setShowAssignModal] = useState<{ orderId: string, boxId: string } | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [showPartModal, setShowPartModal] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const receptionOrders = workOrders.filter(wo => wo.status === 'reception');
  const activeOrders = workOrders.filter(wo => wo.status !== 'closed' && wo.status !== 'reception');

  const handleDrop = (orderId: string, boxId: string) => {
    setShowAssignModal({ orderId, boxId });
  };

  const handleAssign = async () => {
    if (showAssignModal && selectedMechanic) {
      await workshopService.assignWorkOrder(showAssignModal.orderId, showAssignModal.boxId, selectedMechanic);
      setShowAssignModal(null);
      setSelectedMechanic('');
    }
  };

  const handleAddPart = () => {
    setEditingPart(null);
    setShowPartModal(true);
  };

  const handleEditPart = (part: Part) => {
    setEditingPart(part);
    setShowPartModal(true);
  };

  const handleEditOrder = (order: WorkOrder) => {
    setEditingOrder(order);
    setShowOrderModal(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowClientModal(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-300 transform lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tighter text-blue-400">BOXGESTIÓN</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Taller Mecánico OS</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'map', icon: LayoutDashboard, label: 'Taller' },
            { id: 'clients', icon: Users, label: 'Clientes' },
            { id: 'inventory', icon: Package, label: 'Inventario' },
            { id: 'billing', icon: FileText, label: 'Facturación' },
            { id: 'revenue', icon: LayoutDashboard, label: 'Ingresos' },
            { id: 'history', icon: Database, label: 'Historial' },
            { id: 'users', icon: Shield, label: 'Personal' },
            { id: 'company', icon: Settings, label: 'Empresa' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activeTab === item.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <img src={profile?.photoURL} className="w-8 h-8 rounded-full bg-slate-700" alt="" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{profile?.displayName}</p>
              <p className="text-[10px] text-slate-500 uppercase">Administrador</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-black tracking-tighter text-blue-600">BOXGESTIÓN</h1>
          <div className="w-10 h-10" /> {/* Spacer */}
        </header>

        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8">
          <h2 className="text-lg font-bold text-slate-800">
            {activeTab === 'map' && 'Mapa del Taller'}
            {activeTab === 'clients' && 'Gestión de Clientes'}
            {activeTab === 'inventory' && 'Inventario de Piezas'}
            {activeTab === 'billing' && 'Facturación'}
            {activeTab === 'revenue' && 'Resumen de Ingresos'}
            {activeTab === 'company' && 'Configuración de Empresa'}
            {activeTab === 'users' && 'Gestión de Personal'}
          </h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={generateMockData}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-2 transition-colors"
            >
              <Database size={14} />
              Cargar Demos
            </button>
            {activeTab === 'inventory' && (
              <button 
                onClick={handleAddPart}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Nueva Pieza
              </button>
            )}
            {activeTab === 'clients' && (
              <button 
                onClick={() => setShowClientModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={16} />
                Nuevo Cliente
              </button>
            )}
            {(activeTab === 'map' || activeTab === 'billing' || activeTab === 'revenue' || activeTab === 'users' || activeTab === 'company') && (
              <button 
                onClick={() => setShowOrderModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Nueva Orden
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {activeTab === 'map' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">
              {/* Workshop Map */}
              <div className="xl:col-span-9 space-y-6 overflow-x-auto">
                <div className="min-w-[800px] xl:min-w-0">
                  <WorkshopMap 
                    workOrders={activeOrders} 
                    boxes={boxes}
                    onDrop={handleDrop}
                    onBoxClick={async (id) => {
                      const order = activeOrders.find(o => o.boxId === id);
                      if (order) {
                        handleEditOrder(order);
                      } else {
                        const currentBox = boxes.find(b => b.id === id);
                        await workshopService.toggleBoxStatus(id, currentBox?.status || 'empty');
                      }
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Ocupación</p>
                    <p className="text-3xl font-black text-slate-800">{activeOrders.length} / 6</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">En Recepción</p>
                    <p className="text-3xl font-black text-blue-600">{receptionOrders.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Listos</p>
                    <p className="text-3xl font-black text-green-600">{activeOrders.filter(o => o.status === 'ready').length}</p>
                  </div>
                </div>
              </div>

              {/* Reception Sidebar */}
              <div className="xl:col-span-3 flex flex-col gap-4">
                <div className="bg-slate-200 p-4 rounded-xl flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">Recepción</h3>
                  <span className="bg-slate-300 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {receptionOrders.length}
                  </span>
                </div>
                <div className="flex-1 overflow-auto space-y-4 pr-2 max-h-[400px] xl:max-h-full">
                  {receptionOrders.map(order => (
                    <div key={order.id} className="relative group">
                      <OTCard order={order} isDraggable />
                      <button 
                        onClick={() => handleEditOrder(order)}
                        className="absolute top-2 right-2 p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  ))}
                  {receptionOrders.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center p-4">
                      No hay órdenes pendientes en recepción
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'inventory' && <InventoryView onEdit={handleEditPart} />}
          {activeTab === 'billing' && <BillingView />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'revenue' && <RevenueView />}
          {activeTab === 'clients' && <ClientsView onEdit={handleEditClient} />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'company' && <CompanySettingsView />}
        </div>
      </main>

      {/* Client Modal */}
      {showClientModal && (
        <ClientModal 
          client={editingClient}
          onClose={() => {
            setShowClientModal(false);
            setEditingClient(null);
          }} 
        />
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-800">Asignar Mecánico</h3>
                <p className="text-xs text-slate-500">Box: {showAssignModal.boxId}</p>
              </div>
              <button onClick={() => setShowAssignModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase">Seleccionar Mecánico</label>
              <div className="grid gap-2">
                {mechanics.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMechanic(m.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      selectedMechanic === m.id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <img src={m.photoURL} className="w-8 h-8 rounded-full bg-slate-200" alt="" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{m.displayName}</p>
                      <p className="text-[10px] text-slate-500">Mecánico Especialista</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setShowAssignModal(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAssign}
                disabled={!selectedMechanic}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Part Modal */}
      {showPartModal && (
        <PartModal 
          part={editingPart} 
          onClose={() => setShowPartModal(false)} 
        />
      )}

      {/* Order Modal */}
      {showOrderModal && (
        <OrderModal 
          order={editingOrder}
          onClose={() => {
            setShowOrderModal(false);
            setEditingOrder(null);
          }} 
        />
      )}
    </div>
  );
};

const RevenueView = () => {
  const { data: workOrders } = useWorkOrders();
  const closedOrders = workOrders.filter(wo => wo.status === 'closed' || wo.status === 'ready');

  const totalRevenue = closedOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Ingresos Totales</p>
          <p className="text-3xl font-black text-slate-800">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Órdenes Finalizadas</p>
          <p className="text-3xl font-black text-blue-600">{closedOrders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Ticket Promedio</p>
          <p className="text-3xl font-black text-green-600">
            ${closedOrders.length > 0 ? (totalRevenue / closedOrders.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Orden</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Vehículo</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {closedOrders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-slate-400">#{order.id.slice(-6).toUpperCase()}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800">{order.clientName}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{order.vehicleId}</td>
                <td className="px-6 py-4 text-sm font-black text-slate-800">${(order.totalAmount || 0).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase border",
                    order.status === 'closed' ? "bg-slate-50 text-slate-600 border-slate-200" : "bg-green-50 text-green-600 border-green-200"
                  )}>
                    {order.status === 'closed' ? 'Facturado' : 'Listo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OrderModal = ({ order, onClose }: { order?: WorkOrder | null, onClose: () => void }) => {
  const mechanics = useMechanics();
  const clients = useClients();
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: order?.clientId || '',
    vehicleId: order?.vehicleId || '',
    description: order?.description || '',
    mechanicId: order?.mechanicId || '',
  });

  const [newClientData, setNewClientData] = useState({
    name: '',
    phone: '',
  });

  const [confirmAction, setConfirmAction] = useState<'ready' | 'close' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalClientId = formData.clientId;
    let finalClientName = '';

    if (showNewClientForm) {
      finalClientId = await workshopService.createClient(newClientData);
      finalClientName = newClientData.name;
    } else {
      const selectedClient = clients.find(c => c.id === formData.clientId);
      finalClientName = selectedClient?.name || '';
    }

    if (!finalClientId) return;

    if (order) {
      await workshopService.updateWorkOrder(order.id, {
        ...formData,
        clientId: finalClientId,
        clientName: finalClientName
      });
    } else {
      await workshopService.createWorkOrder({
        ...formData,
        clientId: finalClientId,
        clientName: finalClientName
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-slate-800">{order ? 'Editar Orden' : 'Nueva Orden de Trabajo'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-auto">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Cliente</label>
              {!order && (
                <button 
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                >
                  {showNewClientForm ? 'Seleccionar Existente' : '+ Nuevo Cliente'}
                </button>
              )}
            </div>
            
            {showNewClientForm ? (
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <input 
                  required
                  type="text"
                  placeholder="Nombre completo"
                  value={newClientData.name}
                  onChange={e => setNewClientData({ ...newClientData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  required
                  type="tel"
                  placeholder="Teléfono (obligatorio)"
                  value={newClientData.phone}
                  onChange={e => setNewClientData({ ...newClientData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <select
                required
                value={formData.clientId}
                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Placa del Vehículo</label>
            <input 
              required
              type="text"
              value={formData.vehicleId}
              onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: ABC-1234"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Asignar Mecánico (Opcional)</label>
            <select
              value={formData.mechanicId}
              onChange={e => setFormData({ ...formData, mechanicId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin asignar</option>
              {mechanics.map(m => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Descripción del Problema</label>
            <textarea 
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isProcessing}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Procesando...' : (order ? 'Guardar Cambios' : 'Crear Orden')}
              </button>
            </div>
            
            {order && (
              <div className="space-y-2">
                {order.status !== 'ready' && order.status !== 'closed' && (
                  <>
                    {confirmAction === 'ready' ? (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100 space-y-2">
                        <p className="text-xs font-bold text-green-800 text-center">¿Confirmar marcar como lista?</p>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setConfirmAction(null)}
                            className="flex-1 px-3 py-1.5 rounded-md text-xs font-bold text-slate-600 bg-white border border-slate-200"
                          >
                            No
                          </button>
                          <button 
                            type="button"
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                await workshopService.stopWorkOrder(order.id);
                                onClose();
                              } catch (error) {
                                console.error('Error marking order as ready:', error);
                                alert('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
                              } finally {
                                setIsProcessing(false);
                                setConfirmAction(null);
                              }
                            }}
                            className="flex-1 px-3 py-1.5 rounded-md text-xs font-bold text-white bg-green-600"
                          >
                            Sí, Lista
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setConfirmAction('ready')}
                        className="w-full px-4 py-2 rounded-lg text-sm font-bold bg-green-50 text-green-600 border border-green-100 hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        Marcar como Hecha (Listo)
                      </button>
                    )}
                  </>
                )}
                
                {confirmAction === 'close' ? (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100 space-y-2">
                    <p className="text-xs font-bold text-red-800 text-center">¿Confirmar cerrar orden?</p>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 px-3 py-1.5 rounded-md text-xs font-bold text-slate-600 bg-white border border-slate-200"
                      >
                        No
                      </button>
                      <button 
                        type="button"
                        onClick={async () => {
                          setIsProcessing(true);
                          try {
                            await workshopService.closeWorkOrder(order.id);
                            onClose();
                          } catch (error) {
                            console.error('Error closing order:', error);
                            alert('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
                          } finally {
                            setIsProcessing(false);
                            setConfirmAction(null);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-md text-xs font-bold text-white bg-red-600"
                      >
                        Sí, Cerrar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setConfirmAction('close')}
                    className="w-full px-4 py-2 rounded-lg text-sm font-bold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Cerrar Orden (Finalizar)
                  </button>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const ClientsView = ({ onEdit }: { onEdit: (client: Client) => void }) => {
  const clients = useClients();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Cliente</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Teléfono</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clients.map(client => (
            <tr key={client.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-slate-800">{client.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{client.id}</p>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">{client.email || '-'}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{client.phone || '-'}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => onEdit(client)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ClientModal = ({ client, onClose }: { client?: Client | null, onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (client) {
      await workshopService.updateClient(client.id, formData);
    } else {
      await workshopService.createClient(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-slate-800">{client ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Completo</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Teléfono (Obligatorio)</label>
            <input 
              required
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Email (Opcional)</label>
            <input 
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {client ? 'Guardar Cambios' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HistoryView = () => {
  const { data: workOrders } = useWorkOrders();
  const historyOrders = workOrders.filter(wo => wo.status === 'closed');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
      <div className="p-6 border-b border-slate-100 min-w-[800px]">
        <h3 className="font-black text-slate-800">Historial de Órdenes</h3>
        <p className="text-xs text-slate-500">Registro de todos los trabajos finalizados y entregados</p>
      </div>
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Vehículo</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Cliente</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Fecha</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Detalles</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {historyOrders.map(order => (
            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-slate-800">{order.vehicleId}</p>
                <p className="text-[10px] text-slate-400 font-mono">#{order.id.slice(-6).toUpperCase()}</p>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">{order.clientName}</td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {order.createdAt?.toDate().toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-slate-800">
                ${order.totalAmount?.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right">
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                  <FileText size={16} />
                </button>
              </td>
            </tr>
          ))}
          {historyOrders.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                No hay órdenes en el historial todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const UsersView = () => {
  const users = useAllUsers();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'mechanic') => {
    await workshopService.updateUserRole(userId, newRole);
  };

  const handleDeleteUser = async (userId: string) => {
    await workshopService.deleteUser(userId);
    setDeletingUserId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-black text-slate-800">Gestión de Personal</h3>
        <p className="text-xs text-slate-500">Gestiona los roles y el acceso de todos los usuarios del sistema</p>
      </div>
      <div className="divide-y divide-slate-100">
        {users.map(user => (
          <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <img src={user.photoURL} className="w-10 h-10 rounded-full bg-slate-100" alt="" />
              <div>
                <p className="text-sm font-bold text-slate-800">{user.displayName}</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => handleRoleChange(user.id, 'admin')}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                    user.role === 'admin' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Admin
                </button>
                <button
                  onClick={() => handleRoleChange(user.id, 'mechanic')}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                    user.role === 'mechanic' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Mecánico
                </button>
              </div>
              
              {deletingUserId === user.id ? (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                  <span className="text-[10px] font-bold text-red-600 uppercase">¿Eliminar?</span>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-[10px] font-bold text-red-700 hover:underline"
                  >
                    SÍ
                  </button>
                  <button 
                    onClick={() => setDeletingUserId(null)}
                    className="text-[10px] font-bold text-slate-500 hover:underline"
                  >
                    NO
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setDeletingUserId(user.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm italic">
            No hay usuarios registrados
          </div>
        )}
      </div>
    </div>
  );
};

const InventoryView = ({ onEdit }: { onEdit: (part: Part) => void }) => {
  const inventory = useInventory();
  const [deletingPartId, setDeletingPartId] = useState<string | null>(null);

  const handleDelete = async (partId: string) => {
    await workshopService.deleteInventoryPart(partId);
    setDeletingPartId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Pieza</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Stock</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Mínimo</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Precio</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Estado</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {inventory.map(item => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-slate-800">{item.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{item.id}</p>
              </td>
              <td className="px-6 py-4 text-sm font-mono">{item.stock}</td>
              <td className="px-6 py-4 text-sm font-mono text-slate-400">{item.minStock}</td>
              <td className="px-6 py-4 text-sm font-bold text-slate-800">${item.price}</td>
              <td className="px-6 py-4">
                {item.stock <= item.minStock ? (
                  <span className="px-2 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-100">
                    Pedido Pendiente
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold border border-green-100">
                    En Stock
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {deletingPartId === item.id ? (
                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                      <span className="text-[10px] font-bold text-red-600 uppercase">¿Eliminar?</span>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-[10px] font-bold text-red-700 hover:underline"
                      >
                        SÍ
                      </button>
                      <button 
                        onClick={() => setDeletingPartId(null)}
                        className="text-[10px] font-bold text-slate-500 hover:underline"
                      >
                        NO
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => onEdit(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setDeletingPartId(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PartModal = ({ part, onClose }: { part: Part | null, onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: part?.name || '',
    stock: part?.stock || 0,
    minStock: part?.minStock || 0,
    price: part?.price || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (part) {
      await workshopService.updateInventoryPart(part.id, formData);
    } else {
      await workshopService.addInventoryPart(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-slate-800">
            {part ? 'Editar Pieza' : 'Nueva Pieza'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre de la Pieza</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Stock Actual</label>
              <input 
                required
                type="number"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Stock Mínimo</label>
              <input 
                required
                type="number"
                value={formData.minStock}
                onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Precio Unitario ($)</label>
            <input 
              required
              type="number"
              step="0.01"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {part ? 'Guardar Cambios' : 'Crear Pieza'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CompanySettingsView = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    workshopService.getCompanySettings().then(setSettings);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      await workshopService.updateCompanySettings(settings);
      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) return <div className="p-8 text-center text-slate-500">Cargando configuración...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h3 className="font-black text-slate-800">Datos de la Empresa</h3>
        <p className="text-xs text-slate-500">Esta información aparecerá en las facturas</p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Comercial</label>
            <input 
              required
              type="text"
              value={settings.name}
              onChange={e => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">CIF / NIF</label>
            <input 
              required
              type="text"
              value={settings.taxId}
              onChange={e => setSettings({ ...settings, taxId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Dirección Fiscal</label>
            <input 
              required
              type="text"
              value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Teléfono</label>
            <input 
              required
              type="tel"
              value={settings.phone}
              onChange={e => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Email de Contacto</label>
            <input 
              required
              type="email"
              value={settings.email}
              onChange={e => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Precio Hora Mecánico ($)</label>
            <input 
              required
              type="number"
              value={settings.laborRate}
              onChange={e => setSettings({ ...settings, laborRate: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="pt-4">
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
};

const BillingView = () => {
  const { data: workOrders } = useWorkOrders();
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [manualHours, setManualHours] = useState<string>('');
  const closedOrders = workOrders.filter(wo => wo.status === 'closed' || wo.status === 'ready');

  const generateInvoice = async (order: WorkOrder, hoursOverride?: number) => {
    const settings = await workshopService.getCompanySettings();
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(settings.name, 20, 20);
    doc.setFontSize(10);
    doc.text(settings.address, 20, 28);
    doc.text(`CIF: ${settings.taxId}`, 20, 33);
    doc.text(`Tel: ${settings.phone} | Email: ${settings.email}`, 20, 38);

    // Invoice Info
    doc.setFontSize(16);
    doc.text('FACTURA', 140, 20);
    doc.setFontSize(10);
    doc.text(`Nº Factura: INV-${order.id.slice(0, 8).toUpperCase()}`, 140, 28);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 140, 33);
    doc.text(`Orden: ${order.id.slice(0, 8)}`, 140, 38);

    // Client Info
    doc.setFontSize(12);
    doc.text('CLIENTE', 20, 55);
    doc.setFontSize(10);
    doc.text(order.clientName, 20, 62);
    doc.text(`Vehículo: ${order.vehicleId}`, 20, 67);

    // Items Table
    const laborHours = hoursOverride !== undefined ? hoursOverride : (order.totalLaborTime || 0) / 60;
    const laborRate = settings.laborRate || 45;
    const laborTotal = laborHours * laborRate;

    const parts = order.parts || [];
    const partsCost = parts.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    const subtotal = laborTotal + partsCost;

    const tableData = [
      ['Mano de Obra', `${laborHours.toFixed(2)} h`, `$${laborRate.toFixed(2)}`, `$${laborTotal.toFixed(2)}`],
      ...parts.map(p => [
        p.name,
        p.quantity.toString(),
        `$${p.price.toFixed(2)}`,
        `$${(p.price * p.quantity).toFixed(2)}`
      ])
    ];

    autoTable(doc, {
      startY: 80,
      head: [['Descripción', 'Cant.', 'Precio', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Totals
    const tax = subtotal * 0.21;
    const total = subtotal + tax;

    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY + 10);
    doc.text(`IVA (21%): $${tax.toFixed(2)}`, 140, finalY + 15);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: $${total.toFixed(2)}`, 140, finalY + 22);

    doc.save(`Factura-${order.id.slice(0, 8)}.pdf`);
    setSelectedOrder(null);
    setManualHours('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-black text-slate-800">Facturación</h3>
            <p className="text-xs text-slate-500">Genera facturas para órdenes finalizadas o listas</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Orden</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Vehículo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Est.</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closedOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-blue-600">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{order.clientName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{order.vehicleId}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold border uppercase",
                      order.status === 'closed' ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-green-50 text-green-600 border-green-100"
                    )}>
                      {order.status === 'closed' ? 'Cerrada' : 'Lista'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-800">${order.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setManualHours(((order.totalLaborTime || 0) / 60).toFixed(2));
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      <FileText size={14} />
                      Generar Factura
                    </button>
                  </td>
                </tr>
              ))}
              {closedOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                    No hay órdenes listas para facturar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Hours Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-800">Horas de Mano de Obra</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Ajusta las horas de mano de obra para la orden <span className="font-bold">#{selectedOrder.id.slice(0, 8)}</span>.
              </p>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Horas Totales</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 2.5"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => generateInvoice(selectedOrder, parseFloat(manualHours) || 0)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Generar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
