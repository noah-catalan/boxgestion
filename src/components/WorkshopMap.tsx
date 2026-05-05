import React, { useState } from 'react';
import { WorkOrder, Box } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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

  // 2D grid coordinates (2 rows of 3)
  const getBoxCoords = (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const x = 50 + col * 300;
    const y = 80 + row * 220;
    return { x, y };
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <div className="absolute inset-0 p-8">
        <svg viewBox="0 0 1000 600" className="w-full h-full">
          {/* Boxes */}
          {DEFAULT_BOXES.map((box, index) => {
            const { x, y } = getBoxCoords(index);
            const status = getBoxStatus(box.id);
            const order = getOrderInBox(box.id);
            const isOver = dragOver === box.id;

            return (
              <g 
                key={box.id} 
                className="cursor-pointer transition-all duration-300"
                onDragOver={(e) => handleDragOver(e, box.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, box.id)}
                onClick={() => onBoxClick(box.id)}
              >
                {/* 2D Rect */}
                <rect 
                  x={x} 
                  y={y} 
                  width="260" 
                  height="180" 
                  rx="16"
                  fill={isOver ? '#94a3b8' : status === 'empty' ? '#ffffff' : status === 'ready' ? '#dcfce7' : status === 'occupied' ? '#fef9c3' : status === 'critical' ? '#fee2e2' : '#ffffff'}
                  stroke={isOver ? '#475569' : status === 'critical' ? '#ef4444' : '#cbd5e1'}
                  strokeWidth={isOver ? "4" : status === 'critical' ? "3" : "2"}
                  className="transition-colors duration-300 shadow-sm"
                />
                
                {/* Label */}
                <text 
                  x={x + 130} 
                  y={y + 35} 
                  textAnchor="middle" 
                  className={cn(
                    "text-sm font-black uppercase tracking-tighter pointer-events-none select-none",
                    status === 'critical' ? "fill-red-400" : "fill-slate-400"
                  )}
                >
                  {box.name} {status === 'critical' && '(MANTENIMIENTO)'}
                </text>

                {/* Vehicle Indicator */}
                {order && (
                  <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <rect x={x + 30} y={y + 60} width="200" height="90" rx="12" fill="#1e293b" />
                    <text x={x + 130} y={y + 105} textAnchor="middle" className="text-2xl fill-white font-black tracking-tighter">
                      {order.vehicleId.toUpperCase()}
                    </text>
                    <text x={x + 130} y={y + 130} textAnchor="middle" className="text-xs fill-slate-400 font-bold uppercase">
                      {order.clientName}
                    </text>
                    {/* Status Dot */}
                    <circle 
                      cx={x + 215} 
                      cy={y + 75} 
                      r="8" 
                      fill={status === 'ready' ? '#22c55e' : status === 'occupied' ? '#eab308' : '#ef4444'} 
                      className="animate-pulse"
                    />
                  </motion.g>
                )}

                {/* Empty State Indicator */}
                {!order && (
                  <text 
                    x={x + 130} 
                    y={y + 105} 
                    textAnchor="middle" 
                    className="text-xs fill-slate-300 font-bold uppercase tracking-widest pointer-events-none select-none"
                  >
                    DISPONIBLE
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur p-3 rounded-lg border border-slate-200 text-xs space-y-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300" />
          <span>Vacío</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300" />
          <span>En Proceso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300" />
          <span>Listo</span>
        </div>
      </div>
    </div>
  );
};
