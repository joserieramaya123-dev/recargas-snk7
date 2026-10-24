import React, { useState, useEffect } from 'react';
import { Product, AdminPaymentConfig, Order, OrderStatus } from '../types';
import {
  X,
  Lock,
  Unlock,
  Package,
  DollarSign,
  Settings,
  TrendingUp,
  Image as ImageIcon,
  Save,
  Plus,
  Trash2,
  Server,
  Eye,
  Check,
  Upload,
  RotateCcw,
  Sparkles,
  Palette,
  Sliders,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Key,
  Building2,
  CreditCard,
  QrCode,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { ReceiptLightbox } from './ReceiptLightbox';
import { HERO_BANNER_IMG, DIAMOND_PACK_IMG, MEMBERSHIP_PASS_IMG, StorageService } from '../services/storage';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void | Promise<void>;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, adminNotes?: string) => void;
  config: AdminPaymentConfig;
  onUpdateConfig: (config: AdminPaymentConfig) => void;
  adminPin: string;
  onUpdateAdminPin: (pin: string) => void;
  onResetDemo: () => void;
  onRefreshOrders?: () => void | Promise<void>;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  products,
  onUpdateProducts,
  orders,
  onUpdateOrderStatus,
  config,
  onUpdateConfig,
  adminPin,
  onUpdateAdminPin,
  onResetDemo,
  onRefreshOrders,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Password change states
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdChangeLoading, setPwdChangeLoading] = useState(false);
  const [pwdChangeMsg, setPwdChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'profits' | 'catalog' | 'branding' | 'settings'>('orders');

  // Verify server admin session on mount / modal open
  useEffect(() => {
    if (isOpen) {
      StorageService.verifyAdminSession().then((res) => {
        if (res.authenticated) {
          setIsAuthenticated(true);
        }
      });
    }
  }, [isOpen]);

  // Keep editConfig updated when config prop changes
  useEffect(() => {
    setEditConfig(config);
  }, [config]);

  // Keep the editable catalog in sync with server-loaded products.
  useEffect(() => {
    setEditableProducts(products);
  }, [products]);

  // Order filters
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<{
    imageUrl: string;
    orderId: string;
    reference: string;
    amountText: string;
  } | null>(null);

  // Settings & Branding local state
  const [editConfig, setEditConfig] = useState<AdminPaymentConfig>(config);
  const [newPin, setNewPin] = useState('');
  const [configSavedSuccess, setConfigSavedSuccess] = useState(false);
  const [brandingSavedSuccess, setBrandingSavedSuccess] = useState(false);

  // Background visual customization state
  const [bgPreview, setBgPreview] = useState<string>(config.bgImageUrl || '');
  const [bgOpacity, setBgOpacity] = useState<number>(config.bgOverlayOpacity ?? 75);
  const [bgError, setBgError] = useState<string | null>(null);
  const [bgIsUploading, setBgIsUploading] = useState<boolean>(false);
  const [bgSuccess, setBgSuccess] = useState<boolean>(false);

  // Catalog edit state
  const [editableProducts, setEditableProducts] = useState<Product[]>(products);
  const [catalogSavedSuccess, setCatalogSavedSuccess] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDiamonds, setNewProductDiamonds] = useState(100);
  const [newProductPrice, setNewProductPrice] = useState(700);
  const [newProductCost, setNewProductCost] = useState(500);
  const [newProductType, setNewProductType] = useState<'diamonds' | 'membership'>('diamonds');

  if (!isOpen) return null;

  // Admin Login via server PBKDF2 authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword) {
      setAuthError('Introduce tu usuario y contraseña de administrador.');
      return;
    }
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await StorageService.loginAdmin(adminUsername.trim(), adminPassword);
      if (res.success && res.token) {
        setIsAuthenticated(true);
        setAdminPassword('');
        setAuthError(null);
        await onRefreshOrders?.();
      } else {
        setAuthError(res.error || 'Credenciales de administrador incorrectas');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error de conexión con el servidor');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    StorageService.logoutAdmin();
    setIsAuthenticated(false);
    setAdminPassword('');
    setAuthError(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdChangeMsg(null);
    if (!currPassword) {
      setPwdChangeMsg({ type: 'error', text: 'Introduce tu contraseña actual.' });
      return;
    }
    if (newPassword.length < 10) {
      setPwdChangeMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 10 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdChangeMsg({ type: 'error', text: 'La confirmación de la nueva contraseña no coincide.' });
      return;
    }
    setPwdChangeLoading(true);
    try {
      const res = await StorageService.changeAdminPassword(currPassword, newPassword);
      if (res.success) {
        setPwdChangeMsg({ type: 'success', text: '¡Contraseña actualizada con éxito en el servidor!' });
        setCurrPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdChangeMsg({ type: 'error', text: res.error || 'Error al cambiar contraseña' });
      }
    } catch (err: any) {
      setPwdChangeMsg({ type: 'error', text: err.message || 'Error de conexión' });
    } finally {
      setPwdChangeLoading(false);
    }
  };

  // Orders filtering
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderFilter === 'all' || o.status === orderFilter;
    const matchesQuery =
      !orderSearch ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.playerId.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.playerNickname && o.playerNickname.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.paymentReference && o.paymentReference.toLowerCase().includes(orderSearch.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  // Financial calculations
  const totalSalesBs = orders.reduce((sum, o) => (o.status !== 'rejected' ? sum + o.amountBs : sum), 0);
  const totalCostBs = orders.reduce((sum, o) => (o.status !== 'rejected' ? sum + (o.costBs || 0) : sum), 0);
  const totalProfitBs = totalSalesBs - totalCostBs;
  const profitMarginPercent = totalSalesBs > 0 ? ((totalProfitBs / totalSalesBs) * 100).toFixed(1) : '0';

  // Grouped breakdown by product
  const productProfitStats = products.map((prod) => {
    const prodOrders = orders.filter((o) => o.productId === prod.id && o.status !== 'rejected');
    const unitsSold = prodOrders.length;
    const revenue = prodOrders.reduce((sum, o) => sum + o.amountBs, 0);
    const cost = prodOrders.reduce((sum, o) => sum + (o.costBs || prod.costBs), 0);
    const profit = revenue - cost;
    return {
      product: prod,
      unitsSold,
      revenue,
      cost,
      profit,
    };
  });

  const handleSaveCatalogChanges = async () => {
    try {
      await onUpdateProducts(editableProducts);
      setCatalogSavedSuccess(true);
      setTimeout(() => setCatalogSavedSuccess(false), 2500);
    } catch (error: any) {
      window.alert(error?.message || 'No se pudo guardar el catálogo. Comprueba la conexión y vuelve a intentarlo.');
    }
  };

  const handleProductImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const stored = await StorageService.uploadImage(file, 'banner');
      const copy = [...editableProducts];
      copy[index] = { ...copy[index], image: stored.url };
      setEditableProducts(copy);
    } catch (error: any) {
      window.alert(error?.message || 'No se pudo guardar la imagen del producto.');
    } finally {
      e.target.value = '';
    }
  };

  const handleStoreLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const stored = await StorageService.uploadImage(file, 'logo');
      setEditConfig({ ...editConfig, storeLogoUrl: stored.url });
    } catch (error: any) {
      window.alert(error?.message || 'No se pudo guardar el logo.');
    } finally {
      e.target.value = '';
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const stored = await StorageService.uploadImage(file, 'banner');
      setEditConfig({ ...editConfig, bannerUrl: stored.url });
    } catch (error: any) {
      window.alert(error?.message || 'No se pudo guardar el banner.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `custom-${Date.now()}`;
    const defaultImg = newProductType === 'membership' ? MEMBERSHIP_PASS_IMG : DIAMOND_PACK_IMG;
    const created: Product = {
      id: newId,
      type: newProductType,
      name: newProductName || `${newProductDiamonds} Diamantes`,
      diamonds: Number(newProductDiamonds),
      priceBs: Number(newProductPrice),
      costBs: Number(newProductCost),
      description: newProductType === 'membership' ? 'Membresía VIP personalizada.' : 'Paquete de recarga directa.',
      image: defaultImg,
      active: true,
    };
    const updated = [...editableProducts, created];
    try {
      await onUpdateProducts(updated);
      setEditableProducts(updated);
      setShowNewProductModal(false);
      setNewProductName('');
    } catch (error: any) {
      window.alert(error?.message || 'No se pudo guardar el nuevo paquete.');
    }
  };

  const accounts =
    editConfig.pagoMovilAccounts && editConfig.pagoMovilAccounts.length >= 2
      ? editConfig.pagoMovilAccounts
      : [
          {
            id: 'account_1',
            label: 'Cuenta 1 (Principal)',
            bankName: editConfig.pagoMovil?.bankName || '',
            phone: editConfig.pagoMovil?.phone || '',
            idDoc: editConfig.pagoMovil?.idDoc || '',
            holderName: editConfig.pagoMovil?.holderName || '',
            notes: 'Configura los datos reales y activa la cuenta al estar lista.',
            active: false,
          },
          {
            id: 'account_2',
            label: 'Cuenta 2 (Alternativa)',
            bankName: '',
            phone: '',
            idDoc: '',
            holderName: '',
            notes: 'Configura los datos reales y activa la cuenta al estar lista.',
            active: false,
          },
        ];

  const updateAccount = (idx: number, patch: any) => {
    const nextAccs = [...accounts];
    nextAccs[idx] = { ...nextAccs[idx], ...patch };
    const primaryId = editConfig.activePagoMovilId || 'account_1';
    const primaryAcc = nextAccs.find((a) => a.id === primaryId) || nextAccs[0];
    setEditConfig({
      ...editConfig,
      pagoMovilAccounts: nextAccs,
      pagoMovil: {
        bankName: primaryAcc.bankName,
        phone: primaryAcc.phone,
        idDoc: primaryAcc.idDoc,
        holderName: primaryAcc.holderName,
      },
    });
  };

  const setPrimaryAccount = (id: string) => {
    const primaryAcc = accounts.find((a) => a.id === id) || accounts[0];
    setEditConfig({
      ...editConfig,
      activePagoMovilId: id,
      pagoMovil: {
        bankName: primaryAcc.bankName,
        phone: primaryAcc.phone,
        idDoc: primaryAcc.idDoc,
        holderName: primaryAcc.holderName,
      },
    });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryId = editConfig.activePagoMovilId || 'account_1';
    const primaryAcc = accounts.find((a) => a.id === primaryId) || accounts[0];
    const fullConfig: AdminPaymentConfig = {
      ...editConfig,
      pagoMovilAccounts: accounts,
      activePagoMovilId: primaryId,
      pagoMovil: {
        bankName: primaryAcc.bankName,
        phone: primaryAcc.phone,
        idDoc: primaryAcc.idDoc,
        holderName: primaryAcc.holderName,
      },
      usdt: {
        network: editConfig.usdt?.network || 'TRC20',
        trc20Address: editConfig.usdt?.trc20Address || '',
        binancePayId: editConfig.usdt?.binancePayId || '',
      },
      rateBsPerUsdt: Number(editConfig.rateBsPerUsdt) || 68.5,
    };
    onUpdateConfig(fullConfig);
    setConfigSavedSuccess(true);
    setTimeout(() => setConfigSavedSuccess(false), 2500);
  };

  const handleSaveBranding = () => {
    onUpdateConfig(editConfig);
    setBrandingSavedSuccess(true);
    setTimeout(() => setBrandingSavedSuccess(false), 2500);
  };

  const handleBackgroundFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBgError(null);
    setBgIsUploading(true);

    try {
      // StorageService.uploadImage validates JPG/PNG/WEBP and size <= 3MB
      const res = await StorageService.uploadImage(file, 'background');
      setBgPreview(res.url);
      setEditConfig({
        ...editConfig,
        bgImageUrl: res.url,
      });
    } catch (err: any) {
      setBgError(err.message || 'Error al procesar la imagen de fondo');
    } finally {
      setBgIsUploading(false);
    }
  };

  const handleSaveBackground = () => {
    const updated: AdminPaymentConfig = {
      ...editConfig,
      bgImageUrl: bgPreview,
      bgOverlayOpacity: bgOpacity,
    };
    setEditConfig(updated);
    onUpdateConfig(updated);
    setBgSuccess(true);
    setTimeout(() => setBgSuccess(false), 2500);
  };

  const handleRemoveBackground = () => {
    setBgPreview('');
    const updated: AdminPaymentConfig = {
      ...editConfig,
      bgImageUrl: '',
    };
    setEditConfig(updated);
    onUpdateConfig(updated);
    setBgSuccess(true);
    setTimeout(() => setBgSuccess(false), 2500);
  };

  const handleRestoreDefaultBackground = () => {
    setBgPreview('');
    setBgOpacity(75);
    const updated: AdminPaymentConfig = {
      ...editConfig,
      bgImageUrl: '',
      bgOverlayOpacity: 75,
    };
    setEditConfig(updated);
    onUpdateConfig(updated);
    setBgSuccess(true);
    setTimeout(() => setBgSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto rounded-3xl bg-[#090b10] border border-zinc-800 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Cabecera del Panel */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
              {isAuthenticated ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block font-mono">
                RECARGAS SNK 7
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Panel de Administración
                {isAuthenticated && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Desbloqueado
                  </span>
                )}
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

        {/* Puerta de Acceso con Autenticación de Administrador */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Lock className="w-7 h-7" />
            </div>
            
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-white">Inicio de Sesión Administrador</h3>
              <p className="text-xs text-zinc-400">
                Panel protegido por autenticación criptográfica segura (PBKDF2 + HMAC-SHA256).
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="w-full max-w-sm space-y-3.5 text-left">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Usuario Administrador
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => {
                    setAdminUsername(e.target.value);
                    setAuthError(null);
                  }}
                  placeholder="admin"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-cyan-400 focus:outline-none text-white font-mono text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setAuthError(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-cyan-400 focus:outline-none text-white text-sm"
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer min-h-[46px] shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Acceder al Panel</span>
                  </>
                )}
              </button>

              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <p>Ingresa el usuario y la contraseña de administrador configurados para tu tienda en Netlify. Por seguridad, las credenciales no se muestran aquí.</p>
              </div>
            </form>
          </div>
        ) : (
          /* PANEL DESBLOQUEADO */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Pestañas de Navegación del Admin */}
            <div className="px-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between overflow-x-auto gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'orders'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Pedidos ({orders.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('profits')}
                  className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'profits'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Ganancias</span>
                </button>

                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'catalog'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Precios & Fotos</span>
                </button>

                <button
                  onClick={() => setActiveTab('branding')}
                  className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'branding'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Personalización visual</span>
                </button>


                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'settings'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Cuentas & BD</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cerrar Sesión de Administrador"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Cerrar Sesión</span>
              </button>
            </div>

            {/* CONTENIDO DE PESTAÑAS */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              
              {/* TAB 1: PEDIDOS */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      {(['all', 'pending', 'processing', 'completed', 'rejected'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setOrderFilter(st)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                            orderFilter === st
                              ? 'bg-cyan-500 text-zinc-950 font-bold'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                          }`}
                        >
                          {st === 'all' && 'Todos'}
                          {st === 'pending' && 'Pendientes'}
                          {st === 'processing' && 'En Proceso'}
                          {st === 'completed' && 'Completados'}
                          {st === 'rejected' && 'Rechazados'}
                        </button>
                      ))}
                    </div>

                    <div className="w-full sm:w-56">
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Buscar ID, Orden, Ref..."
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs">
                      No hay pedidos con este filtro.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-zinc-900">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-cyan-400 text-xs">
                                {ord.id}
                              </span>
                              <span className="text-zinc-500 text-xs">·</span>
                              <span className="text-[11px] text-zinc-400">
                                {new Date(ord.createdAt).toLocaleDateString('es-VE')} {new Date(ord.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                ord.status === 'completed'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : ord.status === 'processing'
                                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                  : ord.status === 'rejected'
                                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {ord.status === 'completed' && 'Completado'}
                              {ord.status === 'processing' && 'En Proceso'}
                              {ord.status === 'pending' && 'Pendiente'}
                              {ord.status === 'rejected' && 'Rechazado'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-zinc-500 text-[10px] block">Producto</span>
                              <span className="font-semibold text-white">
                                {ord.productName} ({ord.diamonds} 💎)
                              </span>
                            </div>

                            <div>
                              <span className="text-zinc-500 text-[10px] block">ID Jugador</span>
                              <span className="font-mono font-bold text-cyan-300">
                                {ord.playerId} {ord.playerNickname ? `(${ord.playerNickname})` : ''}
                              </span>
                              {ord.clientName && (
                                <span className="text-[10px] text-zinc-400 block truncate">
                                  Cliente: {ord.clientName}
                                </span>
                              )}
                            </div>

                            <div>
                              <span className="text-zinc-500 text-[10px] block">Monto y Ref</span>
                              <span className="font-mono text-white">
                                {ord.paymentMethod === 'pago_movil'
                                  ? `${ord.amountBs.toLocaleString('de-DE')} Bs.`
                                  : `${ord.amountUsdt || 0} USDT (Histórico)`}
                              </span>
                              <span className="text-[10px] text-zinc-500 block font-mono">
                                Ref: {ord.paymentReference || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-2">
                            {ord.receiptImage ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedReceipt({
                                    imageUrl: ord.receiptImage!,
                                    orderId: ord.id,
                                    reference: ord.paymentReference,
                                    amountText:
                                      ord.paymentMethod === 'pago_movil'
                                        ? `${ord.amountBs.toLocaleString('de-DE')} Bs.`
                                        : `${ord.amountUsdt} USDT`,
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver Comprobante</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-500">Sin captura</span>
                            )}

                            <div className="flex items-center gap-1 ml-auto">
                              <button
                                onClick={() =>
                                  onUpdateOrderStatus(
                                    ord.id,
                                    'processing',
                                    'Pago revisado. Acreditando diamantes.'
                                  )
                                }
                                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs cursor-pointer"
                              >
                                En Proceso
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateOrderStatus(
                                    ord.id,
                                    'completed',
                                    'Recarga acreditada con éxito.'
                                  )
                                }
                                className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 text-xs font-bold cursor-pointer"
                              >
                                Completar ✓
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateOrderStatus(
                                    ord.id,
                                    'rejected',
                                    'Comprobante no coincide. Contacta soporte.'
                                  )
                                }
                                className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-400 text-xs cursor-pointer"
                              >
                                Rechazar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: GANANCIAS */}
              {activeTab === 'profits' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-0.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-medium">Ventas Totales</span>
                      <div className="text-lg font-black text-white font-mono">
                        {totalSalesBs.toLocaleString('de-DE')} <span className="text-xs text-zinc-400">Bs.</span>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono">Pago Móvil</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-0.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-medium">Costo de Recargas</span>
                      <div className="text-lg font-black text-zinc-300 font-mono">
                        {totalCostBs.toLocaleString('de-DE')} <span className="text-xs text-zinc-400">Bs.</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Gasto proveedor</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-950 border border-emerald-500/40 space-y-0.5">
                      <span className="text-[10px] text-emerald-400 uppercase font-medium">Ganancia Neta</span>
                      <div className="text-lg font-black text-emerald-400 font-mono">
                        +{totalProfitBs.toLocaleString('de-DE')} <span className="text-xs text-emerald-300">Bs.</span>
                      </div>
                      <span className="text-[10px] text-emerald-300 font-mono">En Bolívares</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-950 border border-cyan-500/40 space-y-0.5">
                      <span className="text-[10px] text-cyan-400 uppercase font-medium">Margen Utilidad</span>
                      <div className="text-lg font-black text-cyan-300 font-mono">
                        {profitMarginPercent}%
                      </div>
                      <span className="text-[10px] text-zinc-400">{orders.length} órdenes</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-900 text-zinc-400 font-semibold border-b border-zinc-800">
                        <tr>
                          <th className="p-3">Producto</th>
                          <th className="p-3">Vendido</th>
                          <th className="p-3">Venta</th>
                          <th className="p-3">Costo</th>
                          <th className="p-3">Ganancia Unit.</th>
                          <th className="p-3 text-right">Ganancia Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {productProfitStats.map(({ product, unitsSold, revenue, cost, profit }) => {
                          const unitProfit = product.priceBs - product.costBs;
                          return (
                            <tr key={product.id} className="hover:bg-zinc-900/30">
                              <td className="p-3 font-semibold text-white">{product.name}</td>
                              <td className="p-3 font-mono text-zinc-400">{unitsSold}</td>
                              <td className="p-3 font-mono text-zinc-300">{product.priceBs.toLocaleString('de-DE')} Bs.</td>
                              <td className="p-3 font-mono text-zinc-500">{product.costBs.toLocaleString('de-DE')} Bs.</td>
                              <td className="p-3 font-mono text-emerald-400">+{unitProfit.toLocaleString('de-DE')} Bs.</td>
                              <td className="p-3 font-mono font-bold text-right text-cyan-300">+{profit.toLocaleString('de-DE')} Bs.</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: CATÁLOGO, PRECIOS & FOTOS DE CADA PRODUCTO */}
              {activeTab === 'catalog' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-zinc-400">
                      Edita el precio de venta (Bs.), tu costo de compra y sube fotos personalizadas para cada paquete.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowNewProductModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Paquete</span>
                      </button>
                      <button
                        onClick={handleSaveCatalogChanges}
                        className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Cambios</span>
                      </button>
                    </div>
                  </div>

                  {catalogSavedSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>¡Precios, costos e imágenes de productos actualizados!</span>
                    </div>
                  )}

                  <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-900 text-zinc-400 font-semibold border-b border-zinc-800">
                        <tr>
                          <th className="p-3">Foto</th>
                          <th className="p-3">Nombre</th>
                          <th className="p-3">Diamantes</th>
                          <th className="p-3">Precio Venta (Bs.)</th>
                          <th className="p-3">Costo Recarga (Bs.)</th>
                          <th className="p-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {editableProducts.map((p, index) => (
                          <tr key={p.id} className="hover:bg-zinc-900/30">
                            {/* Imagen de Producto Personalizable */}
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-10 h-10 rounded-lg object-cover bg-black border border-zinc-800"
                                />
                                <label className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-300 text-[10px] cursor-pointer font-medium">
                                  Cambiar
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleProductImageUpload(index, e)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </td>

                            <td className="p-3 font-semibold text-white">
                              <input
                                type="text"
                                value={p.name}
                                onChange={(e) => {
                                  const copy = [...editableProducts];
                                  copy[index].name = e.target.value;
                                  setEditableProducts(copy);
                                }}
                                className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-white"
                              />
                            </td>

                            <td className="p-3 font-mono">
                              <input
                                type="number"
                                value={p.diamonds}
                                onChange={(e) => {
                                  const copy = [...editableProducts];
                                  copy[index].diamonds = Number(e.target.value);
                                  setEditableProducts(copy);
                                }}
                                className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-white font-mono"
                              />
                            </td>

                            <td className="p-3 font-mono">
                              <input
                                type="number"
                                value={p.priceBs}
                                onChange={(e) => {
                                  const copy = [...editableProducts];
                                  copy[index].priceBs = Number(e.target.value);
                                  setEditableProducts(copy);
                                }}
                                className="w-24 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-cyan-300 font-mono font-bold"
                              />
                            </td>

                            <td className="p-3 font-mono">
                              <input
                                type="number"
                                value={p.costBs}
                                onChange={(e) => {
                                  const copy = [...editableProducts];
                                  copy[index].costBs = Number(e.target.value);
                                  setEditableProducts(copy);
                                }}
                                className="w-24 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400 font-mono"
                              />
                            </td>

                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = [...editableProducts];
                                  copy[index].active = !copy[index].active;
                                  setEditableProducts(copy);
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                  p.active
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                                }`}
                              >
                                {p.active ? 'Activo' : 'Pausado'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal para añadir paquete */}
                  {showNewProductModal && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
                      <div className="w-full max-w-sm p-4 rounded-2xl bg-zinc-950 border border-zinc-700 space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                          <h4 className="font-bold text-white text-sm">Nuevo Paquete</h4>
                          <button onClick={() => setShowNewProductModal(false)} className="text-zinc-400">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <form onSubmit={handleAddNewProduct} className="space-y-3 text-xs">
                          <div>
                            <label className="block text-zinc-400 mb-1">Nombre</label>
                            <input
                              type="text"
                              value={newProductName}
                              onChange={(e) => setNewProductName(e.target.value)}
                              placeholder="Ej: 1500 Diamantes Promo"
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-zinc-400 mb-1">Tipo</label>
                              <select
                                value={newProductType}
                                onChange={(e) => setNewProductType(e.target.value as any)}
                                className="w-full px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                              >
                                <option value="diamonds">Diamantes</option>
                                <option value="membership">Membresía</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-zinc-400 mb-1">Diamantes</label>
                              <input
                                type="number"
                                value={newProductDiamonds}
                                onChange={(e) => setNewProductDiamonds(Number(e.target.value))}
                                className="w-full px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-zinc-400 mb-1">Precio Venta (Bs.)</label>
                              <input
                                type="number"
                                value={newProductPrice}
                                onChange={(e) => setNewProductPrice(Number(e.target.value))}
                                className="w-full px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-cyan-300 font-bold font-mono"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-zinc-400 mb-1">Costo Recarga (Bs.)</label>
                              <input
                                type="number"
                                value={newProductCost}
                                onChange={(e) => setNewProductCost(Number(e.target.value))}
                                className="w-full px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono"
                                required
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowNewProductModal(false)}
                              className="px-3 py-1.5 rounded-lg text-zinc-400"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 rounded-lg bg-cyan-500 text-zinc-950 font-bold"
                            >
                              Crear Paquete
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PERSONALIZACIÓN VISUAL (FONDO, LOGO Y BANNER) */}
              {activeTab === 'branding' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-zinc-800">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Palette className="w-4 h-4 text-cyan-400" />
                        <span>Personalización Visual de la Tienda</span>
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Gestiona el fondo general de la tienda, el logo y el banner superior de forma 100% independiente.
                      </p>
                    </div>

                    {(bgSuccess || brandingSavedSuccess) && (
                      <div className="p-2 px-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-1.5 animate-fade-in">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>¡Cambios visuales guardados y aplicados!</span>
                      </div>
                    )}
                  </div>

                  {/* 1. SECCIÓN PRINCIPAL: FONDO PERSONALIZADO DE LA TIENDA */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-cyan-400" />
                          <span>1. Fondo General de la Tienda</span>
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Aparece detrás de todo el contenido, adaptándose a teléfonos Android, tablets y computadoras sin deformarse.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {bgPreview ? (
                          <button
                            type="button"
                            onClick={handleRemoveBackground}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/50 border border-zinc-700 hover:border-red-500/40 text-red-400 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar Fondo</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-mono">
                            Fondo predeterminado: Negro minimalista
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={handleRestoreDefaultBackground}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="Restablecer al diseño negro original"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Predeterminado</span>
                        </button>
                      </div>
                    </div>

                    {/* Mensaje de error de validación si existe */}
                    {bgError && (
                      <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{bgError}</span>
                      </div>
                    )}

                    {/* VISTA PREVIA INTERACTIVA EN TIEMPO REAL */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-300">
                          Vista Previa en Vivo (con oscurecimiento aplicado):
                        </span>
                        {bgPreview !== config.bgImageUrl && bgPreview && (
                          <span className="text-amber-400 text-[11px] font-mono font-medium">
                            ● Imagen seleccionada (Sin guardar)
                          </span>
                        )}
                      </div>

                      <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-zinc-800 bg-[#06080d] shadow-inner flex items-center justify-center">
                        {bgPreview ? (
                          <>
                            <img
                              src={bgPreview}
                              alt="Vista previa del fondo"
                              className="absolute inset-0 w-full h-full object-cover object-center"
                            />
                            {/* Capa de oscurecimiento interactiva en vivo */}
                            <div
                              className="absolute inset-0 bg-black transition-opacity duration-150"
                              style={{ opacity: bgOpacity / 100 }}
                            />
                          </>
                        ) : (
                          <div className="text-center text-zinc-500 space-y-1">
                            <Palette className="w-8 h-8 mx-auto text-zinc-600" />
                            <p className="text-xs font-mono">Fondo oscuro estándar activo (#06080d)</p>
                          </div>
                        )}

                        {/* Muestra de tarjeta flotante para verificar contraste y legibilidad */}
                        <div className="relative z-10 p-3 rounded-xl bg-[#090b10]/90 backdrop-blur-md border border-zinc-800 shadow-xl max-w-xs text-center space-y-1.5">
                          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block font-mono">
                            Prueba de Legibilidad
                          </span>
                          <div className="text-sm font-black text-white font-mono">
                            110 Diamantes · 750 Bs.
                          </div>
                          <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-zinc-950 font-bold text-[11px] uppercase tracking-wider">
                            COMPRAR AHORA
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CONTROL DESLIZANTE DE OSCURECIMIENTO */}
                    {bgPreview && (
                      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="bg-intensity-slider" className="font-bold text-zinc-200 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Control de Oscurecimiento del Fondo:</span>
                          </label>
                          <span className="font-mono font-black text-cyan-300 text-sm bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                            {bgOpacity}%
                          </span>
                        </div>

                        <input
                          id="bg-intensity-slider"
                          type="range"
                          min="30"
                          max="95"
                          step="1"
                          value={bgOpacity}
                          onChange={(e) => setBgOpacity(Number(e.target.value))}
                          className="w-full accent-cyan-400 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                        />

                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                          <span>30% (Más transparente / Brillante)</span>
                          <span className="text-cyan-400 font-semibold">Recomendado: 70% – 85%</span>
                          <span>95% (Máximo contraste / Oscuro)</span>
                        </div>
                      </div>
                    )}

                    {/* CONTROLES DE SUBIDA Y GUARDADO */}
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-400 text-zinc-200 font-semibold text-xs cursor-pointer transition-colors min-h-[48px]">
                          <Upload className="w-4 h-4 text-cyan-400" />
                          <span>{bgPreview ? 'Cambiar imagen de fondo' : 'Subir fondo (JPG, PNG, WEBP)'}</span>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            onChange={handleBackgroundFileSelect}
                            className="hidden"
                          />
                        </label>

                        {/* Botón Guardar Cambios de Fondo */}
                        <button
                          type="button"
                          onClick={handleSaveBackground}
                          disabled={bgIsUploading}
                          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-zinc-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-cyan-950/50 flex items-center justify-center gap-2 min-h-[48px]"
                        >
                          <Save className="w-4 h-4" />
                          <span>{bgIsUploading ? 'Procesando...' : 'Guardar Cambios de Fondo'}</span>
                        </button>
                      </div>

                      {/* URL Alternativa */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500 text-[11px] whitespace-nowrap">O pegar URL directa:</span>
                        <input
                          type="text"
                          value={bgPreview}
                          onChange={(e) => {
                            setBgPreview(e.target.value);
                            setBgError(null);
                          }}
                          placeholder="https://ejemplo.com/fondo.jpg"
                          className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. LOGO OFICIAL DE RECARGAS SNK 7 (INDEPENDIENTE DEL FONDO) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        2. Logo de la Tienda (Independiente del fondo)
                      </h4>
                      {editConfig.storeLogoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...editConfig, storeLogoUrl: '' };
                            setEditConfig(updated);
                            onUpdateConfig(updated);
                          }}
                          className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurar logo predeterminado</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Vista previa logo */}
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center shrink-0">
                        {editConfig.storeLogoUrl ? (
                          <img
                            src={editConfig.storeLogoUrl}
                            alt="Logo actual"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-cyan-600 to-blue-600 p-[1.5px] flex items-center justify-center">
                            <div className="w-full h-full bg-[#090d16] rounded-xl flex items-center justify-center text-cyan-400 font-mono font-black text-xs">
                              SNK7
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 flex-1 w-full text-xs">
                        <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 cursor-pointer w-fit">
                          <Upload className="w-4 h-4 text-cyan-400" />
                          <span>Subir Logo desde tu teléfono / PC</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleStoreLogoUpload}
                            className="hidden"
                          />
                        </label>

                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-[11px]">O escribir URL:</span>
                          <input
                            type="text"
                            value={editConfig.storeLogoUrl || ''}
                            onChange={(e) => {
                              const updated = { ...editConfig, storeLogoUrl: e.target.value };
                              setEditConfig(updated);
                              onUpdateConfig(updated);
                            }}
                            placeholder="https://..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. BANNER VISUAL SUPERIOR (INDEPENDIENTE DEL FONDO) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        3. Banner Superior (Independiente del fondo)
                      </h4>
                      
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editConfig.showBanner !== false}
                            onChange={(e) => {
                              const updated = { ...editConfig, showBanner: e.target.checked };
                              setEditConfig(updated);
                              onUpdateConfig(updated);
                            }}
                            className="rounded accent-cyan-400 cursor-pointer"
                          />
                          <span>Mostrar banner</span>
                        </label>

                        {editConfig.bannerUrl !== HERO_BANNER_IMG && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...editConfig, bannerUrl: HERO_BANNER_IMG };
                              setEditConfig(updated);
                              onUpdateConfig(updated);
                            }}
                            className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Banner original</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Vista previa del banner */}
                    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-black border border-zinc-800">
                      <img
                        src={editConfig.bannerUrl || HERO_BANNER_IMG}
                        alt="Vista previa del banner"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs pt-1">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 cursor-pointer w-fit">
                        <Upload className="w-4 h-4 text-cyan-400" />
                        <span>Subir Banner desde dispositivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                        />
                      </label>

                      <div className="flex items-center gap-2 flex-1 w-full">
                        <span className="text-zinc-500 text-[11px]">O URL:</span>
                        <input
                          type="text"
                          value={editConfig.bannerUrl || ''}
                          onChange={(e) => {
                            const updated = { ...editConfig, bannerUrl: e.target.value };
                            setEditConfig(updated);
                            onUpdateConfig(updated);
                          }}
                          placeholder="https://..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. EXPLICACIÓN TÉCNICA TRANSPARENTE SOBRE ALMACENAMIENTO Y SERVICIOS GRATUITOS */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <Server className="w-4 h-4" />
                      <span>Almacenamiento Persistente & Opciones Gratuitas</span>
                    </div>

                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      • <strong>Almacenamiento en Servidor y Local:</strong> La imagen de fondo se valida en el servidor (formatos JPG, JPEG, PNG, WEBP; tamaño máximo 3 MB) y se guarda en almacenamiento persistente de Netlify. Así todos los clientes ven el mismo fondo desde cualquier dispositivo.
                    </p>
                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      • <strong>Servicios Gratuitos para el Futuro:</strong> Si deseas alojar miles de fotos en la nube sin usar espacio del servidor local, las opciones gratuitas recomendadas son <strong>Firebase Storage (Plan Spark: 5 GB gratis al mes a costo $0)</strong> o <strong>Cloudinary (25 GB mensuales de transferencia gratuita)</strong>. Ambas opciones son gratuitas y seguras sin requerir suscripciones de pago.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 5: CONFIGURACIÓN DE CUENTAS & BD */}
              {activeTab === 'settings' && (
                <div className="space-y-5">
                  {configSavedSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>¡Configuración de cuentas bancarias y USDT guardada con éxito en el servidor!</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveConfig} className="space-y-5">
                    {/* SECCIÓN 1: DOS CUENTAS DE PAGO MÓVIL */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-zinc-900 gap-1.5">
                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                          <Building2 className="w-4 h-4" />
                          <span>Gestión de Cuentas de Pago Móvil (2 Cuentas)</span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          Cuenta Principal activa: <strong className="text-cyan-300 font-mono">{editConfig.activePagoMovilId || 'account_1'}</strong>
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400">
                        Configura aquí tus dos cuentas bancarias. La cuenta marcada como <strong>Principal</strong> es la primera opción para tus clientes. Si la principal tiene problemas de plataforma, puedes cambiar la principal o desactivarla con un solo clic sin tocar código.
                      </p>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {accounts.map((acc, idx) => {
                          const isPrimary = (editConfig.activePagoMovilId || 'account_1') === acc.id;
                          return (
                            <div
                              key={acc.id}
                              className={`p-3.5 rounded-xl border text-xs space-y-3 transition-all ${
                                isPrimary
                                  ? 'bg-cyan-950/20 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                                  : 'bg-zinc-900/60 border-zinc-800'
                              } ${!acc.active ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px]">
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold text-white text-xs">{acc.label}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Toggle Activa/Inactiva */}
                                  <button
                                    type="button"
                                    onClick={() => updateAccount(idx, { active: !acc.active })}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                      acc.active
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                    }`}
                                  >
                                    {acc.active ? 'Activa' : 'Inactiva'}
                                  </button>

                                  {/* Botón Principal */}
                                  <button
                                    type="button"
                                    onClick={() => setPrimaryAccount(acc.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                      isPrimary
                                        ? 'bg-cyan-500 text-zinc-950 shadow-sm'
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                                    }`}
                                  >
                                    {isPrimary ? '★ Principal' : 'Hacer Principal'}
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <label className="block text-zinc-400 mb-0.5 text-[11px]">
                                    Nombre o Etiqueta Interna
                                  </label>
                                  <input
                                    type="text"
                                    value={acc.label}
                                    onChange={(e) => updateAccount(idx, { label: e.target.value })}
                                    placeholder="Ej: Cuenta 1 (Banesco)"
                                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-cyan-400 rounded-lg text-white text-xs"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-zinc-400 mb-0.5 text-[11px]">
                                      Banco y Código
                                    </label>
                                    <input
                                      type="text"
                                      value={acc.bankName}
                                      onChange={(e) => updateAccount(idx, { bankName: e.target.value })}
                                      placeholder="Ej: Banco Banesco (0134)"
                                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-cyan-400 rounded-lg text-white text-xs"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-zinc-400 mb-0.5 text-[11px]">
                                      Teléfono Pago Móvil
                                    </label>
                                    <input
                                      type="text"
                                      value={acc.phone}
                                      onChange={(e) => updateAccount(idx, { phone: e.target.value })}
                                      placeholder="Ej: 0416-7301856"
                                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-cyan-400 rounded-lg text-cyan-300 font-mono text-xs"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-zinc-400 mb-0.5 text-[11px]">
                                      Cédula / RIF
                                    </label>
                                    <input
                                      type="text"
                                      value={acc.idDoc}
                                      onChange={(e) => updateAccount(idx, { idDoc: e.target.value })}
                                      placeholder="Ej: V-27.841.932"
                                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-cyan-400 rounded-lg text-white font-mono text-xs"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-zinc-400 mb-0.5 text-[11px]">
                                      Titular de la Cuenta
                                    </label>
                                    <input
                                      type="text"
                                      value={acc.holderName}
                                      onChange={(e) => updateAccount(idx, { holderName: e.target.value })}
                                      placeholder="Ej: RECARGAS SNK 7 OFICIAL"
                                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-cyan-400 rounded-lg text-white text-xs"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-zinc-400 mb-0.5 text-[11px]">
                                    Nota para el Cliente (Opcional)
                                  </label>
                                  <input
                                    type="text"
                                    value={acc.notes || ''}
                                    onChange={(e) => updateAccount(idx, { notes: e.target.value })}
                                    placeholder="Ej: Transferencias inmediatas desde cualquier banco"
                                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-cyan-400 rounded-lg text-zinc-300 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECCIÓN 2: MÉTODO DE PAGO USDT (CRIPTOMONEDA) */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-zinc-900 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                        <QrCode className="w-4 h-4" />
                        <span>Configuración de Cripto USDT (Consignado & Activo)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-zinc-400 mb-1 text-[11px]">Red de Transferencia</label>
                          <input
                            type="text"
                            value={editConfig.usdt?.network || 'TRC20'}
                            onChange={(e) =>
                              setEditConfig({
                                ...editConfig,
                                usdt: {
                                  ...(editConfig.usdt || { trc20Address: '', binancePayId: '' }),
                                  network: e.target.value,
                                },
                              })
                            }
                            placeholder="TRC20 / BEP20"
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-amber-400 font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-400 mb-1 text-[11px]">Tasa de Cambio (Bs. por 1 USDT)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editConfig.rateBsPerUsdt ?? 68.5}
                            onChange={(e) =>
                              setEditConfig({
                                ...editConfig,
                                rateBsPerUsdt: parseFloat(e.target.value) || 68.5,
                              })
                            }
                            placeholder="68.5"
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-400 font-mono font-bold text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-zinc-400 mb-1 text-[11px]">Dirección de Billetera USDT ({editConfig.usdt?.network || 'TRC20'})</label>
                          <input
                            type="text"
                            value={editConfig.usdt?.trc20Address || ''}
                            onChange={(e) =>
                              setEditConfig({
                                ...editConfig,
                                usdt: {
                                  ...(editConfig.usdt || { network: 'TRC20', binancePayId: '' }),
                                  trc20Address: e.target.value,
                                },
                              })
                            }
                            placeholder="Ej: TLvE8s7Lh4UvP3..."
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-300 font-mono text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-zinc-400 mb-1 text-[11px]">Binance Pay ID (Opcional)</label>
                          <input
                            type="text"
                            value={editConfig.usdt?.binancePayId || ''}
                            onChange={(e) =>
                              setEditConfig({
                                ...editConfig,
                                usdt: {
                                  ...(editConfig.usdt || { network: 'TRC20', trc20Address: '' }),
                                  binancePayId: e.target.value,
                                },
                              })
                            }
                            placeholder="Ej: 84193201"
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECCIÓN 3: WHATSAPP OFICIAL */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                      <h4 className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>Número Oficial de WhatsApp</span>
                      </h4>
                      <div>
                        <label className="block text-zinc-400 mb-1 text-[11px]">
                          Formato internacional (ej: +584167301856)
                        </label>
                        <input
                          type="text"
                          value={editConfig.whatsappNumber}
                          onChange={(e) =>
                            setEditConfig({ ...editConfig, whatsappNumber: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-400 font-mono font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('¿Restaurar datos de prueba iniciales de la tienda?')) {
                            onResetDemo();
                            window.location.reload();
                          }
                        }}
                        className="text-[11px] text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        Restaurar datos de prueba
                      </button>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Cuentas y USDT</span>
                      </button>
                    </div>
                  </form>

                  {/* SECCIÓN 4: CAMBIAR CONTRASEÑA DE ADMINISTRADOR (PBKDF2 SEGURO) */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-900 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <Key className="w-4 h-4" />
                      <span>Cambiar Contraseña de Administrador (Servidor Seguro PBKDF2)</span>
                    </div>

                    <p className="text-[11px] text-zinc-400">
                      La contraseña se almacena con hash criptográfico PBKDF2 (100.000 iteraciones + salt aleatorio) en el servidor. Nunca se guarda en texto plano ni se expone en el cliente.
                    </p>

                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-zinc-400 mb-1 text-[11px]">Contraseña Actual</label>
                          <input
                            type="password"
                            value={currPassword}
                            onChange={(e) => setCurrPassword(e.target.value)}
                            placeholder="Clave actual"
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-400 mb-1 text-[11px]">Nueva Contraseña</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 10 caracteres"
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-400 mb-1 text-[11px]">Confirmar Nueva Contraseña</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite la clave nueva"
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs"
                          />
                        </div>
                      </div>

                      {pwdChangeMsg && (
                        <div
                          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                            pwdChangeMsg.type === 'success'
                              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                              : 'bg-red-950/60 border border-red-500/40 text-red-300'
                          }`}
                        >
                          {pwdChangeMsg.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          )}
                          <span>{pwdChangeMsg.text}</span>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={pwdChangeLoading}
                          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>{pwdChangeLoading ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visor de comprobante */}
        {selectedReceipt && (
          <ReceiptLightbox
            isOpen={true}
            onClose={() => setSelectedReceipt(null)}
            imageUrl={selectedReceipt.imageUrl}
            orderId={selectedReceipt.orderId}
            reference={selectedReceipt.reference}
            amountText={selectedReceipt.amountText}
          />
        )}
      </div>
    </div>
  );
};
