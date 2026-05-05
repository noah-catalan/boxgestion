import { useAuth } from './hooks/useAuth';
import { AdminDashboard } from './components/AdminDashboard';
import { MechanicDashboard } from './components/MechanicDashboard';
import { Auth } from './components/Auth';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, profile, loading, isAdmin, isMechanic } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-blue-400" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isMechanic) {
    return <MechanicDashboard />;
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Rol no asignado</h1>
      <p className="text-slate-400 max-w-md">
        Tu cuenta ha sido creada correctamente, pero aún no tienes un rol asignado (Administrador o Mecánico). 
        Contacta con el administrador del sistema.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-3 bg-blue-600 rounded-xl font-bold"
      >
        Reintentar
      </button>
    </div>
  );
}
