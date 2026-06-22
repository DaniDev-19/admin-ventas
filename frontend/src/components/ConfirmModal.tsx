import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-850 p-6 shadow-2xl relative animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-outfit text-xl font-bold text-slate-100">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-6 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary py-2 px-4 rounded-lg text-sm disabled:opacity-40"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="btn-primary bg-rose-600 border-rose-600 hover:bg-rose-500 hover:border-rose-500 focus:ring-rose-500/20 py-2 px-4 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
