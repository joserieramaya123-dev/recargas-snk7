import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  Gem,
  Award,
  MessageCircle,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  initialSearchId?: string;
  whatsappNumber: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
  initialSearchId,
  whatsappNumber,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialSearchId) {
      setSearchTerm(initialSearchId);
      const match = orders.find(
        (o) =>
          o.id.toLowerCase() === initialSearchId.toLowerCase() ||
          o.playerId === initialSearchId
      );
      if (match) setSelectedOrder(match);
      setHasSearched(true);
    }
  }, [initialSearchId, orders]);

  if (!isOpen) return null;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchTerm.trim().toLowerCase();
    if (!query) return;

    const match = orders.find(
      (o) =>
        o.id.toLowerCase() === query ||
        o.playerId.toLowerCase() === query ||
        (o.paymentReference && o.paymentReference.toLowerCase() === query)
    );

    setSelectedOrder(match || null);
    setHasSearched(true);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Recarga Completada
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold text-xs">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Acreditando en Garena
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 font-bold text-xs">
            <XCircle className="w-3.5 h-3.5" />
            Pedido Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-xs">
            <Clock className="w-3.5 h-3.5" />
            En Verificación de Pago
          </span>
        );
    }
  };

  const getWhatsAppSupportUrl = (order?: Order) => {
    const text = order
      ? `Hola Recargas SNK 7, consulto el estado de mi orden ${order.id} (ID Free Fire: ${order.playerId}).`
      : `Hola Recargas SNK 7, necesito soporte con mi pedido de Free Fire.`;
    const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto rounded-3xl bg-[#090b10] border border-zinc-800 shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase block font-mono">
                CONSULTA DE PEDIDO
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Rastrear Estado de Recarga
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Ingresa tu Número de Orden o tu ID de Free Fire
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ej: SNK-704918 o 3948102941"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#06080d] border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm font-mono placeholder:text-slate-600"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-cyan-950/60 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Buscar</span>
              </button>
            </div>
            
            {/* Quick sample chips for testing */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
              <span>Probar órdenes de muestra:</span>
              {orders.slice(0, 3).map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => {
                    setSearchTerm(ord.id);
                    setSelectedOrder(ord);
                    setHasSearched(true);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700 text-slate-300 font-mono text-[10px] cursor-pointer"
                >
                  {ord.id}
                </button>
              ))}
            </div>
          </form>

          {/* Search Result */}
          {hasSearched && (
            <div>
              {selectedOrder ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-4 rounded-2xl bg-[#06080d] border border-cyan-500/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Número de Orden</span>
                        <span className="text-base font-black text-cyan-400 font-mono">
                          {selectedOrder.id}
                        </span>
                      </div>
                      <div>{getStatusBadge(selectedOrder.status)}</div>
                    </div>

                    {/* Progress Step Bar */}
                    <div className="py-2">
                      <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center mb-1">
                            ✓
                          </div>
                          <span className="text-slate-300 font-medium">Recibido</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full font-bold flex items-center justify-center mb-1 ${
                              selectedOrder.status !== 'pending'
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-cyan-500 text-slate-950 animate-pulse'
                            }`}
                          >
                            {selectedOrder.status !== 'pending' ? '✓' : '2'}
                          </div>
                          <span className="text-slate-300 font-medium">Verificación</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full font-bold flex items-center justify-center mb-1 ${
                              selectedOrder.status === 'completed'
                                ? 'bg-emerald-500 text-slate-950'
                                : selectedOrder.status === 'processing'
                                ? 'bg-cyan-500 text-slate-950 animate-pulse'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {selectedOrder.status === 'completed' ? '✓' : '3'}
                          </div>
                          <span className="text-slate-300 font-medium">Acreditando</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full font-bold flex items-center justify-center mb-1 ${
                              selectedOrder.status === 'completed'
                                ? 'bg-emerald-500 text-slate-950'
                                : selectedOrder.status === 'rejected'
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {selectedOrder.status === 'completed'
                              ? '✓'
                              : selectedOrder.status === 'rejected'
                              ? '✕'
                              : '4'}
                          </div>
                          <span className="text-slate-300 font-medium">
                            {selectedOrder.status === 'rejected' ? 'Rechazado' : 'Entregado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Notes if any */}
                    {selectedOrder.adminNotes && (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                        <span className="text-cyan-400 font-semibold block text-[11px] mb-0.5">
                          Nota de Administración:
                        </span>
                        <p>{selectedOrder.adminNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Order Details Breakdown */}
                  <div className="p-4 rounded-2xl bg-[#06080d] border border-slate-800 text-xs space-y-2">
                    <h4 className="font-bold text-white text-sm pb-1 border-b border-slate-800">
                      Detalles de la Recarga
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-slate-400">
                      <div>
                        <span>Producto:</span>
                        <p className="font-semibold text-white">
                          {selectedOrder.productName} ({selectedOrder.diamonds} diamantes)
                        </p>
                      </div>

                      <div>
                        <span>ID Free Fire:</span>
                        <p className="font-mono font-bold text-cyan-300">
                          {selectedOrder.playerId} {selectedOrder.playerNickname ? `(${selectedOrder.playerNickname})` : ''}
                        </p>
                        {selectedOrder.clientName && (
                          <p className="text-[11px] text-slate-400">
                            Cliente: {selectedOrder.clientName}
                          </p>
                        )}
                      </div>

                      <div>
                        <span>Fecha:</span>
                        <p className="text-slate-300">
                          {new Date(selectedOrder.createdAt).toLocaleString('es-VE')}
                        </p>
                      </div>

                      <div>
                        <span>Método:</span>
                        <p className="font-medium text-slate-200">
                          {selectedOrder.paymentMethod === 'pago_movil' ? 'Pago Móvil' : 'USDT Cripto (Histórico)'}
                        </p>
                      </div>

                      <div>
                        <span>Monto Abonado:</span>
                        <p className="font-mono font-bold text-white">
                          {selectedOrder.paymentMethod === 'pago_movil'
                            ? `${selectedOrder.amountBs.toLocaleString('de-DE')} Bs.`
                            : `${selectedOrder.amountUsdt || 0} USDT (Histórico)`}
                        </p>
                      </div>

                      <div>
                        <span>Ref. Comprobante:</span>
                        <p className="font-mono text-slate-300">
                          {selectedOrder.paymentReference || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Support CTA */}
                  <a
                    href={getWhatsAppSupportUrl(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0e1626] hover:bg-[#131d33] border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>¿Dudas con este pedido? Contactar por WhatsApp</span>
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-[#06080d] border border-slate-800/80 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    No se encontró ningún pedido
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Verifica que hayas escrito correctamente el número de referencia (ej: <strong className="text-cyan-300">SNK-704918</strong>) o tu ID de Free Fire.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
