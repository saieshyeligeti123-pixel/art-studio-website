import React from 'react';
import { useAppStore } from '../../lib/store';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-sm shadow-xl border transition-all duration-300 animate-slide-in ${
              isSuccess
                ? 'bg-[#F4F9F4] border-emerald-300 text-stone-900'
                : isError
                ? 'bg-[#FDF4F4] border-rose-300 text-stone-900'
                : 'bg-[#FAF7F2] border-[#D8CCC4] text-stone-900'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-700" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-700" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-[#9E6B38]" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-tight text-stone-900 font-sans">
                {toast.title}
              </h4>
              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed font-sans">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-stone-700 p-0.5 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
