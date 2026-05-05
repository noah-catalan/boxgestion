import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWorkOrders, useInventory } from '../hooks/useFirestore';
import { workshopService } from '../services/workshopService';
import { Play, Square, Package, Search, ChevronRight, ChevronDown, Clock, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { logout } from '../firebase';

export const MechanicDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { data: workOrders } = useWorkOrders();
  const inventory = useInventory();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showPartSearch, setShowPartSearch] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const activeOrders = workOrders.filter(wo => 
    wo.mechanicId === profile?.uid && 
    (wo.status === 'assigned' || wo.status === 'in-progress')
  );

  const historyOrders = workOrders.filter(wo => 
    wo.mechanicId === profile?.uid && 
    (wo.status === 'ready' || wo.status === 'closed')
  );

  const currentOrders = activeTab === 'active' ? activeOrders : historyOrders;

  const handleStart = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await workshopService.startWorkOrder(orderId);
    } catch (error) {
      console.error('Error starting work order:', error);
      alert('Error al iniciar la tarea: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleStop = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await workshopService.stopWorkOrder(orderId);
    } catch (error) {
      console.error('Error stopping work order:', error);
      alert('Error al completar la tarea: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddPart = async (orderId: string, partId: string) => {
    try {
      await workshopService.addPartToOrder(orderId, partId, 1);
      setShowPartSearch(null);
      setSearchTerm('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error adding part');
    }
  };

  const filteredInventory = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl">
      {/* Header */}
      <header className="bg-slate-900 text-white p-5 sticky top-0 z-30 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter text-white">BOXGESTIÓN</h1>
              <p className="text-[8px] text-blue-400 uppercase tracking-widest font-bold">Workshop OS</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <LogOut size={18} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
          <div className="relative">
            <img src={profile?.photoURL} className="w-10 h-10 rounded-full border-2 border-blue-500/30" alt="" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-800 rounded-full" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{profile?.displayName}</p>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Mecánico en Turno</p>
          </div>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="px-5 py-4 grid grid-cols-2 gap-3 bg-white border-b border-slate-100">
        <div 
          onClick={() => setActiveTab('active')}
          className={cn(
            "p-3 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'active' ? "bg-blue-50 border-blue-100 ring-2 ring-blue-500/20" : "bg-slate-50 border-slate-100 opacity-60"
          )}
        >
          <p className="text-[9px] text-blue-600 uppercase font-black mb-1">Activas</p>
          <p className="text-xl font-black text-blue-900">{activeOrders.length}</p>
        </div>
        <div 
          onClick={() => setActiveTab('history')}
          className={cn(
            "p-3 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'history' ? "bg-green-50 border-green-100 ring-2 ring-green-500/20" : "bg-slate-50 border-slate-100 opacity-60"
          )}
        >
          <p className="text-[9px] text-green-600 uppercase font-black mb-1">Historial</p>
          <p className="text-xl font-black text-green-900">{historyOrders.length}</p>
        </div>
      </div>

      {/* Main List */}
      <main className="flex-1 p-5 space-y-4 overflow-auto pb-24">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {activeTab === 'active' ? 'Tareas Asignadas' : 'Historial de Trabajos'}
          </h2>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {currentOrders.length}
          </span>
        </div>
        
        {currentOrders.length === 0 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Clock size={24} />
            </div>
            <p className="text-sm text-slate-500 font-medium">
              {activeTab === 'active' ? 'No tienes órdenes asignadas.' : 'No hay historial de trabajos.'}
            </p>
          </div>
        )}

        {currentOrders.map(order => {
          const isExpanded = expandedOrder === order.id;
          const isInProgress = order.status === 'in-progress';

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
              {/* Card Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs",
                    isInProgress ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-500"
                  )}>
                    {order.boxId?.split('-')[1] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{order.vehicleId}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{order.status}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-50 pt-4">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Descripción de la Avería</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{order.description}</p>
                  </div>

                  {/* Actions */}
                  {activeTab === 'active' && (
                    <div className="grid grid-cols-2 gap-3">
                      {!isInProgress ? (
                        <button 
                          onClick={() => handleStart(order.id)}
                          disabled={processingId === order.id}
                          className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Play size={16} fill="currentColor" />
                          {processingId === order.id ? 'Iniciando...' : 'Iniciar'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStop(order.id)}
                          disabled={processingId === order.id}
                          className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Square size={16} fill="currentColor" />
                          {processingId === order.id ? 'Completando...' : 'Completar'}
                        </button>
                      )}
                      <button 
                        onClick={() => setShowPartSearch(order.id)}
                        disabled={processingId === order.id}
                        className="flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors disabled:opacity-50"
                      >
                        <Package size={16} />
                        Piezas
                      </button>
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="bg-slate-100 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase font-black">Total Facturado</p>
                        <p className="text-sm font-black text-slate-800">${(order.totalAmount || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-slate-400 uppercase font-black">Estado Final</p>
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                          order.status === 'ready' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {order.status === 'ready' ? 'Listo' : 'Entregado'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Parts List */}
                  {order.parts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Piezas Utilizadas</p>
                      <div className="space-y-1">
                        {order.parts.map((p, i) => (
                          <div key={i} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg">
                            <span className="font-medium text-slate-700">{p.name}</span>
                            <span className="font-bold text-slate-900">x{p.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* Part Search Modal */}
      {showPartSearch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex flex-col max-w-md mx-auto">
          <div className="mt-auto bg-white rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-800">Solicitar Pieza</h3>
              <button onClick={() => setShowPartSearch(null)} className="text-slate-400 hover:text-slate-600">
                Cerrar
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar pieza (ej: aceite, filtro)..."
                className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-auto space-y-2 pr-2">
              {filteredInventory.map(part => (
                <button
                  key={part.id}
                  onClick={() => handleAddPart(showPartSearch, part.id)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800">{part.name}</p>
                    <p className="text-[10px] text-slate-500">Stock: {part.stock} unidades</p>
                  </div>
                  <Plus size={18} className="text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Plus = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
