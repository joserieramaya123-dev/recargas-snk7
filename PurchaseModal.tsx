import React, { useState, useEffect } from 'react';
import { Product, AdminPaymentConfig, Order, PaymentMethod, PagoMovilAccount } from '../types';
import { StorageService } from '../services/storage';
import {
  X,
  ShieldCheck,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Upload,
  MessageCircle,
  Gem,
  Award,
  AlertCircle,
  Clock,
  Building2,
  FileText,
  Trash2,
  AlertTriangle,
  Send
} from 'lucide-react';

interface PurchaseModalProps {
  product: Product | null;
  config: AdminPaymentConfig;
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void | Promise<void>;
  onTrackOrder: (orderId: string) => void;
}

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB; base64 expands the request size

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  product,
  config,
  isOpen,
  onClose,
  onOrderCreated,
  onTrackOrder,
}) => {
  const [clientName, setClientName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [playerNickname, setPlayerNickname] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pago_movil');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    config.activePagoMovilId || 'account_1'
  );
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [receiptFilename, setReceiptFilename] = useState<string>('');
  const [receiptFileSize, setReceiptFileSize] = useState<number | undefined>(undefined);
  const [isPdfReceipt, setIsPdfReceipt] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  // Sincroniza la cuenta de pago móvil activa con la configuración
  useEffect(() => {
    if (config.activePagoMovilId) {
      setSelectedAccountId(config.activePagoMovilId);
    }
  }, [config.activePagoMovilId]);

  if (!isOpen || !product) return null;

  // Lista de cuentas de Pago Móvil activas (conserva las 2 cuentas configuradas)
  const activeAccounts: PagoMovilAccount[] = (
    config.pagoMovilAccounts && config.pagoMovilAccounts.length > 0
      ? config.pagoMovilAccounts
      : [
          {
            id: 'account_1',
            label: 'Cuenta Principal',
            bankName: config.pagoMovil?.bankName || '',
            phone: config.pagoMovil?.phone || '',
            idDoc: config.pagoMovil?.idDoc || '',
            holderName: config.pagoMovil?.holderName || '',
            active: true,
          },
        ]
  ).filter((a) => a.active);

  const currentAccount =
    activeAccounts.find((a) => a.id === selectedAccountId) ||
    activeAccounts[0] || {
      id: 'account_1',
      label: 'Cuenta Principal',
      bankName: config.pagoMovil?.bankName || '',
      phone: config.pagoMovil?.phone || '',
      idDoc: config.pagoMovil?.idDoc || '',
      holderName: config.pagoMovil?.holderName || '',
      active: true,
    };

  const priceUsdt = Number((product.priceBs / (config.rateBsPerUsdt || 68.5)).toFixed(2));

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(`El archivo supera el tamaño máximo permitido de 3 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB). Por favor comprime o toma una captura más ligera.`);
      e.target.value = '';
      return;
    }
    const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!isValidType) {
      setValidationError('Formato no compatible. Adjunta una imagen (JPG, PNG, WEBP, GIF) o un documento PDF.');
      e.target.value = '';
      return;
    }

    setIsUploadingReceipt(true);
    setValidationError(null);
    try {
      const stored = await StorageService.uploadReceipt(file);
      setReceiptImage(stored.url);
      setIsPdfReceipt(file.type === 'application/pdf');
      setReceiptFilename(file.name);
      setReceiptFileSize(file.size);
    } catch (error: any) {
      setValidationError(error?.message || 'No se pudo guardar el comprobante. Inténtalo de nuevo.');
      setReceiptImage('');
    } finally {
      setIsUploadingReceipt(false);
      e.target.value = '';
    }
  };

  const handleClearReceipt = () => {
    setReceiptImage('');
    setReceiptFilename('');
    setReceiptFileSize(undefined);
    setIsPdfReceipt(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanId = playerId.trim();
    if (!cleanId) {
      setValidationError('Introduce tu ID de jugador de Free Fire para la recarga.');
      return;
    }
    if (!/^\d{6,14}$/.test(cleanId)) {
      setValidationError('El ID de Free Fire debe contener entre 6 y 14 dígitos numéricos.');
      return;
    }

    if (paymentMethod === 'pago_movil' && activeAccounts.length === 0) {
      setValidationError('Pago Móvil aún no está configurado. Contacta al administrador por WhatsApp.');
      return;
    }
    if (paymentMethod === 'usdt' && !(config.usdt?.trc20Address || config.usdt?.walletAddress || config.usdt?.binancePayId)) {
      setValidationError('El método USDT aún no está configurado. Contacta al administrador por WhatsApp.');
      return;
    }

    // Validar que proporcione o bien el comprobante o bien el número de referencia
    if (!receiptImage && !referenceNumber.trim()) {
      setValidationError('Por favor adjunta la captura de tu comprobante o introduce el número de referencia para verificar tu pago.');
      return;
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const newOrderId = `SNK-${randomSuffix}`;

    const newOrder: Order = {
      id: newOrderId,
      createdAt: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      productType: product.type,
      diamonds: product.diamonds,
      amountBs: product.priceBs,
      amountUsdt: priceUsdt,
      costBs: product.costBs,
      clientName: clientName.trim() || undefined,
      playerId: cleanId,
      playerNickname: playerNickname.trim() || undefined,
      serverRegion: 'Sudamérica / EE.UU.',
      paymentMethod,
      pagoMovilAccountId: paymentMethod === 'pago_movil' ? currentAccount.id : undefined,
      receiptImage: receiptImage || undefined,
      receiptFilename: receiptFilename || undefined,
      receiptFileSize: receiptFileSize,
      paymentReference: referenceNumber.trim() || 'Por WhatsApp',
      status: 'pending', // No afirmamos que esté confirmado: estado pendiente de verificación
      adminNotes: paymentMethod === 'pago_movil'
        ? `Pago Móvil (${currentAccount.bankName}) registrado. En espera de verificación manual por el administrador.`
        : 'Pago USDT registrado. En espera de verificación manual por el administrador.',
    };

    setIsSubmitting(true);
    try {
      await onOrderCreated(newOrder);
      setCreatedOrder(newOrder);
    } catch (error: any) {
      setValidationError(error?.message || 'No se pudo registrar el pedido. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setClientName('');
    setPlayerId('');
    setPlayerNickname('');
    setReferenceNumber('');
    setReceiptImage('');
    setReceiptFilename('');
    setReceiptFileSize(undefined);
    setIsPdfReceipt(false);
    setValidationError(null);
    setCreatedOrder(null);
    onClose();
  };

  // Generador del enlace de WhatsApp con todos los datos requeridos
  const generateWhatsAppUrl = (order: Order) => {
    const methodDesc = order.paymentMethod === 'pago_movil'
      ? `Pago Móvil (${currentAccount.bankName})`
      : `USDT Cripto (${config.usdt?.network || 'TRC20'})`;

    const accountLine = order.paymentMethod === 'pago_movil'
      ? `• *Cuenta Utilizada:* ${currentAccount.label} (${currentAccount.bankName})\n`
      : '';

    const amountDesc = order.paymentMethod === 'pago_movil'
      ? `${order.amountBs.toLocaleString('de-DE')} Bs.`
      : `${order.amountUsdt || priceUsdt} USDT`;

    const clientLine = order.clientName ? `• *Nombre del Cliente:* ${order.clientName}\n` : '';
    const nicknameLine = order.playerNickname ? ` (${order.playerNickname})` : '';
    const refLine = order.paymentReference && order.paymentReference !== 'Por WhatsApp'
      ? `• *Referencia de Pago:* ${order.paymentReference}\n`
      : '';

    const message = `Hola Recargas SNK 7! 👋
He realizado mi pedido en la tienda y deseo notificarlo para recarga:

• *Número de Pedido:* ${order.id}
${clientLine}• *ID de Free Fire:* ${order.playerId}${nicknameLine}
• *Paquete:* ${order.productName}
• *Cantidad:* ${order.diamonds} Diamantes
• *Total a Pagar:* ${amountDesc}
• *Método de Pago:* ${methodDesc}
${accountLine}${refLine}• *Comprobante de Pago:* Adjunto la foto/captura en este chat 📎

Quedo atento a la verificación y entrega. ¡Muchas gracias!`;

    const phoneClean = config.whatsappNumber.replace(/[^0-9]/g, '');
    return `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto rounded-3xl bg-[#090b10] border border-zinc-800 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Cabecera del formulario */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              {product.type === 'membership' ? <Award className="w-4 h-4" /> : <Gem className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block font-mono">
                COMPRA DE RECARGA
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                {product.name}
                <span className="text-xs font-mono font-bold text-cyan-300">
                  · {product.priceBs.toLocaleString('de-DE')} Bs.
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PASO 8: Pantalla de Confirmación de Pedido con Notificación por WhatsApp */}
        {createdOrder ? (
          <div className="p-5 sm:p-6 space-y-4 text-center my-auto overflow-y-auto">
            {/* Ícono de Estado Pendiente de Verificación */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block font-mono">
                ¡Pedido Realizado con Éxito!
              </span>
              <h3 className="text-2xl font-black text-white font-mono">
                {createdOrder.id}
              </h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Estado: Pendiente de Verificación</span>
              </div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto pt-1">
                Tu pedido fue registrado en el sistema. El administrador verificará la transferencia bancaria antes de acreditar los diamantes en tu cuenta de Free Fire.
              </p>
            </div>

            {/* AVISO IMPORTANTE SOBRE ADJUNTAR EN WHATSAPP */}
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Paso Necesario en WhatsApp</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Por políticas de seguridad del navegador, los sitios web no pueden adjuntar automáticamente fotos o archivos a WhatsApp.
              </p>
              <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/20 text-[11px] text-amber-200 font-mono space-y-1">
                <p>1. Pulsa el botón verde <strong className="text-white">"NOTIFICAR AL ADMINISTRADOR POR WHATSAPP"</strong>.</p>
                <p>2. En WhatsApp, pulsa <strong className="text-white">Enviar</strong> y adjunta la captura de tu comprobante (ícono de clip 📎 o cámara 📷).</p>
              </div>
            </div>

            {/* Resumen Detallado del Pedido */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Número de Pedido:</span>
                <span className="text-white font-bold">{createdOrder.id}</span>
              </div>
              {createdOrder.clientName && (
                <div className="flex justify-between text-zinc-400">
                  <span>Cliente:</span>
                  <span className="text-zinc-200">{createdOrder.clientName}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>ID de Free Fire:</span>
                <span className="text-cyan-300 font-bold">
                  {createdOrder.playerId} {createdOrder.playerNickname ? `(${createdOrder.playerNickname})` : ''}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Paquete:</span>
                <span className="text-white font-bold">{createdOrder.productName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Cantidad:</span>
                <span className="text-cyan-300 font-bold">{createdOrder.diamonds} Diamantes</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Método de Pago:</span>
                <span className="text-zinc-200">
                  {createdOrder.paymentMethod === 'pago_movil' ? 'Pago Móvil' : 'USDT Cripto'}
                </span>
              </div>
              {createdOrder.paymentMethod === 'pago_movil' && (
                <div className="flex justify-between text-zinc-400">
                  <span>Cuenta:</span>
                  <span className="text-zinc-300">{currentAccount.bankName}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Total a Pagar:</span>
                <span className="text-emerald-400 font-bold">
                  {createdOrder.paymentMethod === 'pago_movil'
                    ? `${createdOrder.amountBs.toLocaleString('de-DE')} Bs.`
                    : `${createdOrder.amountUsdt || priceUsdt} USDT`}
                </span>
              </div>
              {createdOrder.paymentReference && (
                <div className="flex justify-between text-zinc-400">
                  <span>Referencia:</span>
                  <span className="text-zinc-300">{createdOrder.paymentReference}</span>
                </div>
              )}
              {createdOrder.receiptFilename && (
                <div className="flex justify-between text-zinc-400 pt-1 border-t border-zinc-900">
                  <span>Comprobante registrado:</span>
                  <span className="text-cyan-300 truncate max-w-[180px]">
                    {createdOrder.receiptFilename} ({formatFileSize(createdOrder.receiptFileSize)})
                  </span>
                </div>
              )}
            </div>

            {/* Vista previa pequeña del comprobante si existe */}
            {createdOrder.receiptImage && !isPdfReceipt && (
              <div className="p-2 rounded-xl bg-black/40 border border-zinc-800 text-left">
                <span className="text-[10px] text-zinc-400 block mb-1">Vista previa del comprobante cargado:</span>
                <img
                  src={createdOrder.receiptImage}
                  alt="Comprobante del pedido"
                  className="max-h-24 w-auto rounded object-contain border border-zinc-800"
                />
              </div>
            )}

            {/* Botón Principal: NOTIFICAR AL ADMINISTRADOR POR WHATSAPP */}
            <div className="space-y-2 pt-1">
              <a
                href={generateWhatsAppUrl(createdOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-950/60 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5 fill-zinc-950 text-zinc-950" />
                <span>NOTIFICAR AL ADMINISTRADOR POR WHATSAPP</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const id = createdOrder.id;
                    handleClose();
                    onTrackOrder(id);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-300 text-xs font-semibold cursor-pointer"
                >
                  Rastrear Estado
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-medium cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Formulario de Compra Paso a Paso */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {validationError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{validationError}</span>
              </div>
            )}

            {/* PASO 3: Datos del Jugador */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200">
                  PASO 3: Datos del Jugador
                </label>
                <span className="text-[10px] text-zinc-400">Requerido para la recarga</span>
              </div>

              {/* ID de Free Fire */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  ID de Jugador de Free Fire <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={playerId}
                  onChange={(e) => {
                    setPlayerId(e.target.value.replace(/\D/g, ''));
                    setValidationError(null);
                  }}
                  placeholder="Ej: 2849182914"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-400 focus:outline-none text-white font-mono text-base tracking-wider placeholder:text-zinc-600"
                  required
                />
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Solo necesitamos tu ID numérico. ¡Jamás solicitaremos contraseñas ni correos!</span>
                </div>
              </div>

              {/* Nombre del Cliente (Opcional) */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Nombre del Cliente / Titular (Opcional)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Carlos Mendoza"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-400 focus:outline-none text-white text-xs placeholder:text-zinc-600"
                />
              </div>

              {/* Apodo opcional */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Apodo / Nickname en el juego (Opcional)
                </label>
                <input
                  type="text"
                  value={playerNickname}
                  onChange={(e) => setPlayerNickname(e.target.value)}
                  placeholder="Ej: SNK_Killer"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-400 focus:outline-none text-white text-xs placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* PASO 4: Selección de Método de Pago */}
            <div className="space-y-3 pt-1 border-t border-zinc-900">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200">
                  PASO 4: Método de Pago
                </label>
                <span className="text-[10px] text-zinc-400">Selecciona tu forma de pago</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pago_movil')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                    paymentMethod === 'pago_movil'
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pago Móvil (Bs.)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('usdt')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                    paymentMethod === 'usdt'
                      ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-sm shadow-emerald-500/20'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>USDT (Cripto)</span>
                </button>
              </div>

              {/* PASO 5: Instrucciones del Método de Pago Seleccionado */}
              {paymentMethod === 'pago_movil' && (
                <div className="space-y-2.5">
                  {/* Selector entre cuentas de Pago Móvil activas si hay más de 1 */}
                  {activeAccounts.length > 1 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-cyan-400" /> Cuentas disponibles:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {activeAccounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => setSelectedAccountId(acc.id)}
                            className={`p-2 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                              currentAccount.id === acc.id
                                ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-950'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-bold truncate">{acc.label}</span>
                              {acc.id === config.activePagoMovilId && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  Principal
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 truncate">{acc.bankName}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Datos bancarios de la cuenta seleccionada */}
                  {activeAccounts.length === 0 && (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
                      Pago Móvil todavía no está configurado. No realices transferencias hasta que el administrador publique los datos correctos.
                    </div>
                  )}
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2.5">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">{currentAccount.label}</span>
                        <span className="text-xs font-semibold text-zinc-200">{currentAccount.bankName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block">Total exacto a transferir:</span>
                        <span className="font-mono font-black text-cyan-300 text-base">
                          {product.priceBs.toLocaleString('de-DE')} Bs.
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Teléfono:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-300">{currentAccount.phone}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentAccount.phone.replace(/[^0-9]/g, ''), 'pm_phone')}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedField === 'pm_phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'pm_phone' ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Cédula / RIF:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">{currentAccount.idDoc}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentAccount.idDoc.replace(/[^0-9a-zA-Z]/g, ''), 'pm_ci')}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedField === 'pm_ci' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'pm_ci' ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Titular:</span>
                        <span className="text-zinc-300">{currentAccount.holderName}</span>
                      </div>

                      {currentAccount.notes && (
                        <div className="pt-1.5 border-t border-zinc-900/60 text-[10px] text-amber-300/90 bg-amber-950/20 px-2 py-1 rounded">
                          Nota: {currentAccount.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Instrucciones de USDT */}
              {paymentMethod === 'usdt' && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <div>
                      <span className="text-zinc-400 font-medium text-[11px]">Monto USDT aprox.:</span>
                      <p className="text-[10px] text-zinc-500">Tasa: {config.rateBsPerUsdt || 68.5} Bs/USDT</p>
                    </div>
                    <span className="font-mono font-black text-emerald-400 text-base">
                      ~{priceUsdt} USDT
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Red:</span>
                      <span className="font-bold text-amber-400">{config.usdt?.network || 'TRC20'}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Billetera USDT ({config.usdt?.network || 'TRC20'}):</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(config.usdt?.trc20Address || config.usdt?.walletAddress || '', 'usdt_addr')}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedField === 'usdt_addr' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'usdt_addr' ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                      <div className="p-2 rounded bg-zinc-900/80 font-mono text-[10px] text-emerald-300 break-all select-all border border-zinc-800">
                        {config.usdt?.trc20Address || config.usdt?.walletAddress || 'Dirección pendiente de configurar'}
                      </div>
                    </div>

                    {config.usdt?.binancePayId && (
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                        <span className="text-zinc-500">Binance Pay ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-200">{config.usdt.binancePayId}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(config.usdt?.binancePayId || '', 'binance_id')}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedField === 'binance_id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'binance_id' ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PASO 6: Adjuntar Comprobante y Referencia */}
            <div className="space-y-3 pt-1 border-t border-zinc-900">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200">
                  PASO 6: Comprobante de Pago
                </label>
                <span className="text-[10px] text-zinc-400">Captura desde tu teléfono o PC</span>
              </div>

              {/* Selector de Comprobante */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Adjuntar Captura o Comprobante (Máx. 3 MB) <span className="text-cyan-400">*</span>
                </label>

                {isUploadingReceipt ? (
                  <div className="p-4 rounded-xl bg-zinc-950 border border-cyan-500/30 text-xs text-cyan-300">Guardando comprobante de forma segura…</div>
                ) : receiptImage ? (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-cyan-500/40 space-y-2.5">
                    {isPdfReceipt ? (
                      <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-3">
                        <FileText className="w-8 h-8 text-cyan-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{receiptFilename}</p>
                          <p className="text-[10px] text-zinc-400">{formatFileSize(receiptFileSize)} · Documento PDF</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative max-h-36 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-zinc-900">
                        <img
                          src={receiptImage}
                          alt="Vista previa del comprobante"
                          className="max-h-32 object-contain"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <div className="truncate max-w-[200px] text-[11px] font-mono">
                        <span className="text-zinc-200">{receiptFilename}</span>
                        {receiptFileSize && <span className="text-zinc-500 ml-1">({formatFileSize(receiptFileSize)})</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-bold text-xs underline">
                          Cambiar
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleClearReceipt}
                          className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-zinc-900 cursor-pointer"
                          title="Eliminar archivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border border-dashed border-zinc-700 hover:border-cyan-400 bg-zinc-950 cursor-pointer transition-colors text-center group min-h-[56px]">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold text-zinc-200">
                        Toca aquí para seleccionar captura o foto del comprobante
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      Compatible con galería y cámara de Android, iPhone y PC (JPG, PNG, PDF · máx 3MB)
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Número de Referencia */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Número de Referencia del Pago (Opcional si adjuntaste captura)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => {
                    setReferenceNumber(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="Ej: Últimos 4 o 6 dígitos de la transferencia"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-400 focus:outline-none text-white font-mono text-xs placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* PASO 7: Botón REALIZAR PEDIDO */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isUploadingReceipt}
                className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60 disabled:cursor-wait active:scale-[0.98] text-zinc-950 font-black text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan-950/60 cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Send className="w-4 h-4" />
                <span>{isUploadingReceipt ? 'GUARDANDO COMPROBANTE...' : isSubmitting ? 'REGISTRANDO PEDIDO...' : 'REALIZAR PEDIDO'}</span>
              </button>
              <p className="text-[10px] text-zinc-500 text-center mt-2">
                Al presionar "REALIZAR PEDIDO", tu orden quedará registrada y podrás notificarla inmediatamente al administrador por WhatsApp.
              </p>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
