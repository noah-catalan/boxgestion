import React from 'react';
import { signInWithGoogle } from '../firebase';
import { LogIn, ShieldCheck, Wrench } from 'lucide-react';

export const Auth: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-blue-400">BOXGESTIÓN</h1>
          <p className="text-slate-400 uppercase tracking-widest text-xs font-bold">Taller Mecánico OS</p>
        </div>

        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          <div className="flex justify-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
              <ShieldCheck size={24} />
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Wrench size={24} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Bienvenido de nuevo</h2>
            <p className="text-sm text-slate-400">Accede a tu panel de control para gestionar el taller o tus tareas asignadas.</p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-4 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
            Continuar con Google
          </button>

          <div className="pt-4 border-t border-slate-700">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Sistema de Gestión Integral v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};
