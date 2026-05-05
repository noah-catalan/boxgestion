import React from 'react';
import { WorkOrder } from '../types';
import { cn } from '../lib/utils';
import { Clock, User, Car } from 'lucide-react';

interface OTCardProps {
  order: WorkOrder;
  isDraggable?: boolean;
}

export const OTCard: React.FC<OTCardProps> = ({ order, isDraggable = false }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('orderId', order.id);
  };

  const statusColors = {
    reception: 'bg-blue-50 text-blue-700 border-blue-200',
    assigned: 'bg-purple-50 text-purple-700 border-purple-200',
    'in-progress': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    ready: 'bg-green-50 text-green-700 border-green-200',
    closed: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      className={cn(
        "p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md",
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", statusColors[order.status])}>
          {order.status}
        </span>
        <span className="text-[10px] font-mono text-slate-400">#{order.id.slice(-6).toUpperCase()}</span>
      </div>

      <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
        <Car size={14} className="text-slate-400" />
        {order.vehicleId}
      </h3>
      
      <p className="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-tight">{order.clientName}</p>
      <p className="text-xs text-slate-500 line-clamp-2 mb-4">{order.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Clock size={12} />
          {order.totalLaborTime ? `${order.totalLaborTime} min` : '--'}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <User size={12} />
          {order.mechanicId ? 'Asignado' : 'Sin asignar'}
        </div>
      </div>
    </div>
  );
};
