import React, { useState, useEffect } from 'react';
import { Product, AdminPaymentConfig, Order, OrderStatus } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { PurchaseModal } from './components/PurchaseModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Gem, Award, MessageCircle } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<AdminPaymentConfig>(StorageService.getPaymentConfig());
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminPin, setAdminPin] = useState<string>('snk7admin');

  // UI state: current active view tab
  const [activeTab, setActiveTab] = useState<'diamonds' | 'membership'>('diamonds');
  const [purchasingProduct, setPurchasingProduct] = useState<Product | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerSearchId, setTrackerSearchId] = useState<string | undefined>(undefined);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Initialize data from persistent local storage and check for remote sync
  useEffect(() => {
    setProducts(StorageService.getProducts());
    setConfig(StorageService.getPaymentConfig());
    setOrders(StorageService.getOrders());
    setAdminPin(StorageService.getAdminPin());

    // Sync catalog, payment settings and orders from the server for all devices.
    StorageService.fetchRemoteProducts().then((remoteProducts) => {
      if (remoteProducts) setProducts(remoteProducts);
    });

    StorageService.fetchRemoteConfig().then((remoteCfg) => {
      if (remoteCfg) {
        setConfig(remoteCfg);
      }
    });

    // Sync remote orders across devices if available
    StorageService.fetchRemoteOrders().then((remoteOrders) => {
      if (remoteOrders) {
        setOrders(remoteOrders);
      }
    });
  }, []);

  const handleBuyProduct = (product: Product) => {
    setPurchasingProduct(product);
  };

  const handleOrderCreated = async (newOrder: Order) => {
    await StorageService.addOrder(newOrder);
    setOrders(StorageService.getOrders());
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus, adminNotes?: string) => {
    const updated = StorageService.updateOrderStatus(orderId, status, adminNotes);
    if (updated) {
      setOrders(StorageService.getOrders());
    }
  };

  const handleUpdateProducts = async (newProducts: Product[]) => {
    await StorageService.saveProducts(newProducts);
    setProducts(newProducts);
  };

  const handleUpdateConfig = (newConfig: AdminPaymentConfig) => {
    StorageService.savePaymentConfig(newConfig);
    setConfig(newConfig);
  };

  const handleUpdateAdminPin = (newPin: string) => {
    StorageService.setAdminPin(newPin);
    setAdminPin(newPin);
  };

  const handleOpenTrackerWithId = (orderId?: string) => {
    setTrackerSearchId(orderId);
    setIsTrackerOpen(true);
  };

  // Separate products by category
  const diamondProducts = products.filter((p) => p.active && p.type === 'diamonds');
  const membershipProducts = products.filter((p) => p.active && p.type === 'membership');

  return (
    <div className="relative min-h-screen bg-[#06080d] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-zinc-950 pb-20 md:pb-8">
      
      {/* 1. FONDO PERSONALIZADO PARA TODA LA TIENDA */}
      {config.bgImageUrl && (
        <div
          className="fixed inset-0 z-0 pointer-events-none bg-center bg-cover bg-no-repeat transition-all duration-300"
          style={{
            backgroundImage: `url("${config.bgImageUrl}")`,
          }}
        >
          {/* Capa de oscurecimiento ajustable para legibilidad perfecta */}
          <div
            className="absolute inset-0 bg-black transition-opacity duration-200"
            style={{
              opacity: (config.bgOverlayOpacity ?? 75) / 100,
            }}
          />
        </div>
      )}

      {/* CONTENEDOR DE CONTENIDO (relative z-10) */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* ENCABEZADO: Únicamente logo y nombre, sin eslóganes. Acceso discreto a rastrear y admin */}
        <Navbar
          storeLogoUrl={config.storeLogoUrl}
          onOpenTracker={() => handleOpenTrackerWithId()}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />

        <main className="flex-1">
          {/* BANNER PEQUEÑO (Opcional, modificable por admin en el panel) */}
          {config.showBanner !== false && (
            <Hero bannerUrl={config.bannerUrl} showBanner={config.showBanner} />
          )}

        {/* CATÁLOGO DIRECTO: Sin bloques de texto promocional ni tarjetas con frases largas */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-6">
          
          {/* Selector Segmentado Claro entre Diamantes y Membresías */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex p-1 bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('diamonds')}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
                  activeTab === 'diamonds'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-zinc-950 shadow-md shadow-cyan-950/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Gem className="w-4 h-4" />
                <span>Diamantes ({diamondProducts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('membership')}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
                  activeTab === 'membership'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-zinc-950 shadow-md shadow-cyan-950/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Membresías VIP ({membershipProducts.length})</span>
              </button>
            </div>
          </div>

          {/* VISTA 1: PAQUETES DE DIAMANTES */}
          {activeTab === 'diamonds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Gem className="w-4 h-4 text-cyan-400" />
                  <span>Paquetes de Diamantes</span>
                </h2>
                <span className="text-xs text-zinc-500 font-mono">
                  Recarga inmediata por ID
                </span>
              </div>

              {/* Grid de Tarjetas de Diamantes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {diamondProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onBuy={handleBuyProduct}
                  />
                ))}
              </div>
            </div>
          )}

          {/* VISTA 2: SECCIÓN SEPARADA DE MEMBRESÍAS CON SUS PROPIAS IMÁGENES Y PRECIOS */}
          {activeTab === 'membership' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Membresías Semanales y Mensuales VIP</span>
                </h2>
                <span className="text-xs text-zinc-500 font-mono">
                  Pases con diamantes acumulativos
                </span>
              </div>

              {/* Grid de Membresías */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto sm:mx-0 sm:max-w-none">
                {membershipProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onBuy={handleBuyProduct}
                  />
                ))}
              </div>
            </div>
          )}

        </section>
      </main>

      {/* PIE DE PÁGINA SENCILLO Y DISCRETO */}
      <footer className="border-t border-zinc-900 bg-[#05060a] py-6 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="text-zinc-400">
            <strong className="text-white">RECARGAS SNK 7</strong> · Tienda de Recargas Free Fire
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => handleOpenTrackerWithId()}
              className="hover:text-cyan-400 cursor-pointer"
            >
              Rastrear Pedido
            </button>
            <a
              href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hola%20Recargas%20SNK%207!`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp {config.whatsappNumber}</span>
            </a>
          </div>
        </div>
      </footer>
      </div>

      {/* MODAL DE COMPRA DIRECTO (Se abre directamente al pulsar COMPRAR) */}
      <PurchaseModal
        isOpen={Boolean(purchasingProduct)}
        product={purchasingProduct}
        config={config}
        onClose={() => setPurchasingProduct(null)}
        onOrderCreated={handleOrderCreated}
        onTrackOrder={(orderId) => {
          setPurchasingProduct(null);
          handleOpenTrackerWithId(orderId);
        }}
      />

      {/* MODAL DE SEGUIMIENTO DE PEDIDOS */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => {
          setIsTrackerOpen(false);
          setTrackerSearchId(undefined);
        }}
        orders={orders}
        initialSearchId={trackerSearchId}
        whatsappNumber={config.whatsappNumber}
      />

      {/* PANEL ADMINISTRATIVO PROTEGIDO */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onUpdateProducts={handleUpdateProducts}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        adminPin={adminPin}
        onUpdateAdminPin={handleUpdateAdminPin}
        onResetDemo={() => StorageService.resetToDefault()}
        onRefreshOrders={async () => {
          const remoteOrders = await StorageService.fetchRemoteOrders();
          if (remoteOrders !== null) setOrders(remoteOrders);
          else setOrders(StorageService.getOrders());
        }}
      />

      {/* BOTÓN FLOTANTE DE WHATSAPP */}
      <WhatsAppFloatingButton whatsappNumber={config.whatsappNumber} />

      {/* BARRA INFERIOR MÓVIL SENCILLA CON 4 OPCIONES (Tienda, Membresías, Pedidos, WhatsApp) */}
      <MobileBottomNav
        currentTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenTracker={() => handleOpenTrackerWithId()}
        whatsappNumber={config.whatsappNumber}
      />

    </div>
  );
}
