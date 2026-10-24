import React from 'react';
import { X, ZoomIn, Download, ExternalLink } from 'lucide-react';

interface ReceiptLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  orderId: string;
  reference: string;
  amountText: string;
}

export const ReceiptLightbox: React.FC<ReceiptLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  orderId,
  reference,
  amountText,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
      <div className="relative max-w-2xl w-full rounded-2xl bg-[#090d16] border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0d1424]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Comprobante de Pago</span>
              <span className="font-mono text-cyan-400 text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                {orderId}
              </span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Ref: {reference} · Monto: {amountText}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display */}
        <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/60 min-h-[300px]">
          <img
            src={imageUrl}
            alt={`Comprobante de ${orderId}`}
            className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#06080d] flex items-center justify-between text-xs text-slate-400">
          <span>Verificación visual de transferencia bancaria / hash cripto</span>
          <a
            href={imageUrl}
            download={`comprobante_${orderId}.jpg`}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </a>
        </div>
      </div>
    </div>
  );
};
