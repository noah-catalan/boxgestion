import React, { useState } from 'react';
import { WorkOrder, Box } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench } from 'lucide-react';

interface WorkshopMapProps {
  workOrders: WorkOrder[];
  boxes: Box[];
  onDrop: (orderId: string, boxId: string) => void;
  onBoxClick: (boxId: string) => void;
}

const DEFAULT_BOXES: Box[] = [
  { id: 'box-1', name: 'Elevador 1', status: 'empty' },
  { id: 'box-2', name: 'Elevador 2', status: 'empty' },
  { id: 'box-3', name: 'Elevador 3', status: 'empty' },
  { id: 'box-4', name: 'Elevador 4', status: 'empty' },
  { id: 'box-5', name: 'Elevador 5', status: 'empty' },
  { id: 'box-6', name: 'Elevador 6', status: 'empty' },
];

export const WorkshopMap: React.FC<WorkshopMapProps> = ({ workOrders, boxes, onDrop, onBoxClick }) => {
  const [dragOver, setDragOver] = useState<string | null>(null);

  const getBoxStatus = (boxId: string) => {
    const manualBox = boxes.find(b => b.id === boxId);
    if (manualBox?.status === 'critical') return 'critical';
    
    const order = workOrders.find(wo => wo.boxId === boxId && wo.status !== 'closed');
    if (!order) return 'empty';
    if (order.status === 'ready') return 'ready';
    if (order.status === 'in-progress') return 'occupied';
    return 'occupied';
  };

  const getOrderInBox = (boxId: string) => {
    return workOrders.find(wo => wo.boxId === boxId && wo.status !== 'closed');
  };

  const handleDragOver = (e: React.DragEvent, boxId: string) => {
    e.preventDefault();
    setDragOver(boxId);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, boxId: string) => {
    e.preventDefault();
    setDragOver(null);
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) {
      onDrop(orderId, boxId);
    }
  };

  return (
    <div className="relative w-full min-h-[600px] bg-slate-100 rounded-2xl p-8 border border-slate-200 shadow-inner">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {DEFAULT_BOXES.map((box) => {
          const status = getBoxStatus(box.id);
          const order = getOrderInBox(box.id);
          const isOver = dragOver === box.id;

          return (
            <div
              key={box.id}
              onDragOver={(e) => handleDragOver(e, box.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, box.id)}
              onClick={() => onBoxClick(box.id)}
              className={cn(
                "relative h-48 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col",
                isOver ? "border-blue-500 bg-blue-50 shadow-lg scale-[1.02]" : 
                status === 'empty' ? "border-slate-200 bg-white hover:border-slate-300" :
                status === 'ready' ? "border-green-200 bg-green-50/50" :
                status === 'occupied' ? "border-yellow-200 bg-yellow-50/50" :
                status === 'critical' ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
              )}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-inherit flex justify-between items-center bg-white/50">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-tighter",
                  status === 'critical' ? "text-red-500" : "text-slate-400"
                )}>
                  {box.name}
                </span>
                {status === 'critical' && (
                  <span className="text-[8px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full uppercase">
                    Mantenimiento
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center justify-center p-4">
                <AnimatePresence mode="wait">
                  {order ? (
                    <motion.div
                      key={order.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('orderId', order.id);
                      }}
                      className="w-full bg-slate-900 rounded-xl p-4 shadow-xl cursor-grab active:cursor-grabbing group relative"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-500">#{order.id.slice(-4).toUpperCase()}</span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          status === 'ready' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-yellow-500 animate-pulse"
                        )} />
                      </div>
                      <p className="text-xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors">
                        {order.vehicleId.toUpperCase()}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                        {order.clientName}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="text-center space-y-2 opacity-20 group-hover:opacity-40 transition-opacity">
                      <Wrench size={32} className="mx-auto text-slate-400" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {status === 'critical' ? 'BLOQUEADO' : 'DISPONIBLE'}
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Indicator Bar */}
              <div className={cn(
                "h-1.5 w-full",
                status === 'empty' ? "bg-slate-100" :
                status === 'ready' ? "bg-green-500" :
                status === 'occupied' ? "bg-yellow-500" :
                status === 'critical' ? "bg-red-500" : "bg-slate-100"
              )} />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-6 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-200" />
          <span className="font-bold text-slate-600">Vacío</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="font-bold text-slate-600">En Proceso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="font-bold text-slate-600">Listo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="font-bold text-slate-600">Mantenimiento</span>
        </div>
      </div>
    </div>
  );
};
