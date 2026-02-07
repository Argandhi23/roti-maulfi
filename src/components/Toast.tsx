// components/Toast.tsx
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  // Otomatis hilang setelah 3 detik
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right duration-300 ${
      type === 'success' 
        ? 'bg-white border-green-100 text-green-800' 
        : 'bg-white border-red-100 text-red-800'
    }`}>
      {type === 'success' ? (
        <CheckCircle className="text-green-500 w-5 h-5" />
      ) : (
        <XCircle className="text-red-500 w-5 h-5" />
      )}
      
      <div>
        <h4 className="font-bold text-sm">{type === 'success' ? 'Berhasil!' : 'Gagal!'}</h4>
        <p className="text-xs opacity-90">{message}</p>
      </div>

      <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
        <X size={14} />
      </button>
    </div>
  );
}