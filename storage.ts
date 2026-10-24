import { Product, AdminPaymentConfig, Order } from '../types';

import HERO_BANNER_IMG from '../assets/images/hero_freefire_diamonds_1792772733023.jpg';
import DIAMOND_PACK_IMG from '../assets/images/ff_diamond_pack_1792772733026.jpg';
import MEMBERSHIP_PASS_IMG from '../assets/images/ff_membership_pass_1792772733470.jpg';

export { HERO_BANNER_IMG, DIAMOND_PACK_IMG, MEMBERSHIP_PASS_IMG };

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'dia-110',
    type: 'diamonds',
    name: '110 Diamantes',
    diamonds: 110,
    bonus: '+10 Bono Evento',
    priceBs: 750,
    costBs: 580,
    description: 'Pack inicial recarga rápida por ID directo.',
    image: DIAMOND_PACK_IMG,
    active: true,
  },
  {
    id: 'dia-220',
    type: 'diamonds',
    name: '220 Diamantes',
    diamonds: 220,
    bonus: '+20 Bono',
    priceBs: 1540,
    costBs: 1190,
    description: 'Ideal para cajas de armas y ruletas básicas.',
    image: DIAMOND_PACK_IMG,
    active: true,
  },
  {
    id: 'dia-341',
    type: 'diamonds',
    name: '341 Diamantes',
    diamonds: 341,
    bonus: '+31 Bono',
    priceBs: 2300,
    costBs: 1780,
    description: 'Perfecto para giros en ruleta mágica.',
    image: DIAMOND_PACK_IMG,
    active: true,
  },
  {
    id: 'dia-572',
    type: 'diamonds',
    name: '572 Diamantes',
    diamonds: 572,
    bonus: '+52 Bono',
    priceBs: 3850,
    costBs: 2980,
    description: 'Recomendado para Pase Booyah y tokens.',
    badge: 'Más Vendido',
    image: DIAMOND_PACK_IMG,
    active: true,
  },
  {
    id: 'dia-1166',
    type: 'diamonds',
    name: '1.166 Diamantes',
    diamonds: 1166,
    bonus: '+106 Bono',
    priceBs: 7150,
    costBs: 5540,
    description: 'Paquete avanzado para eventos especiales y skins.',
    badge: 'Popular',
    image: DIAMOND_PACK_IMG,
    active: true,
  },
  {
    id: 'dia-2398',
    type: 'diamonds',
    name: '2.398 Diamantes',
    diamonds: 2398,
    bonus: '+218 Bono',
    priceBs: 14100,
    costBs: 10950,
    description: 'Gran volumen para colecciones e incubadoras.',
    image: DIAMOND_PACK_IMG,
    active: true,
  },
  {
    id: 'dia-6160',
    type: 'diamonds',
    name: '6.160 Diamantes',
    diamonds: 6160,
    bonus: '+560 Bono',
    priceBs: 35900,
    costBs: 27900,
    description: 'El combo máximo para clanes y torneos competitivos.',
    badge: 'Mejor Ahorro',
    image: DIAMOND_PACK_IMG,
    active: true,
  },
  // Membresías
  {
    id: 'mem-semanal',
    type: 'membership',
    name: 'Membresía Semanal',
    diamonds: 340,
    bonus: '50 al instante + 40 diarios (7 días)',
    priceBs: 2000,
    costBs: 1550,
    description: 'Obtén 340 diamantes totales + ícono VIP especial.',
    badge: 'VIP Semanal',
    image: MEMBERSHIP_PASS_IMG,
    active: true,
  },
  {
    id: 'mem-mensual',
    type: 'membership',
    name: 'Membresía Mensual',
    diamonds: 1800,
    bonus: '500 al instante + 50 diarios (30 días)',
    priceBs: 8500,
    costBs: 6600,
    description: '1.800 diamantes en total + emblema y caja de armas.',
    badge: 'VIP Mensual',
    image: MEMBERSHIP_PASS_IMG,
    active: true,
  },
];

export const INITIAL_PAYMENT_CONFIG: AdminPaymentConfig = {
  pagoMovilAccounts: [
    {
      id: 'account_1',
      label: 'Cuenta Principal',
      bankName: '',
      phone: '',
      idDoc: '',
      holderName: '',
      additionalInfo: 'Configura estos datos reales desde el panel de administración.',
      active: false,
    },
    {
      id: 'account_2',
      label: 'Cuenta Alternativa',
      bankName: '',
      phone: '',
      idDoc: '',
      holderName: '',
      additionalInfo: 'Configura estos datos reales desde el panel de administración.',
      active: false,
    },
  ],
  activePagoMovilId: 'account_1',
  pagoMovil: {
    bankName: '',
    phone: '',
    idDoc: '',
    holderName: '',
  },
  usdt: {
    network: 'TRC20 (Tron) / Binance Pay',
    walletAddress: '',
    trc20Address: '',
    binancePayId: '',
  },
  rateBsPerUsdt: 68.5,
  whatsappNumber: '+584167301856',
  storeLogoUrl: '',
  bannerUrl: HERO_BANNER_IMG,
  showBanner: true,
  bgImageUrl: '',
  bgOverlayOpacity: 75,
};

export const INITIAL_ORDERS: Order[] = [];

const STORAGE_KEYS = {
  PRODUCTS: 'snk7_products_v2',
  CONFIG: 'snk7_config_v2',
  ORDERS: 'snk7_orders_v2',
  ADMIN_PIN: 'snk7_admin_pin_v2',
};

export const StorageService = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  },

  async saveProducts(products: Product[]): Promise<void> {
    const token = this.getAdminToken();
    if (!token) throw new Error('Inicia sesión en el panel de administración antes de guardar el catálogo.');
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ products }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'El catálogo no se pudo guardar en el servidor.');
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  async fetchRemoteProducts(): Promise<Product[] | null> {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote)) {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(remote));
          return remote;
        }
      }
    } catch (e) {
      console.warn('Catálogo remoto no disponible; se mantiene el catálogo local.', e);
    }
    return null;
  },

  getPaymentConfig(): AdminPaymentConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (data) {
        const parsed = JSON.parse(data);

        // Ensure both accounts exist
        const accounts = Array.isArray(parsed.pagoMovilAccounts) && parsed.pagoMovilAccounts.length > 0
          ? parsed.pagoMovilAccounts
          : INITIAL_PAYMENT_CONFIG.pagoMovilAccounts;

        let safeAccounts = [...accounts];
        if (!safeAccounts.some(a => a.id === 'account_1')) {
          safeAccounts.unshift(INITIAL_PAYMENT_CONFIG.pagoMovilAccounts[0]);
        }
        if (!safeAccounts.some(a => a.id === 'account_2')) {
          safeAccounts.push(INITIAL_PAYMENT_CONFIG.pagoMovilAccounts[1]);
        }

        return {
          ...INITIAL_PAYMENT_CONFIG,
          ...parsed,
          pagoMovilAccounts: safeAccounts,
          activePagoMovilId: parsed.activePagoMovilId || 'account_1',
          pagoMovil: {
            ...INITIAL_PAYMENT_CONFIG.pagoMovil,
            ...(parsed.pagoMovil || {}),
          },
          usdt: {
            ...INITIAL_PAYMENT_CONFIG.usdt,
            ...(parsed.usdt || {}),
          },
          rateBsPerUsdt: parsed.rateBsPerUsdt ?? 68.5,
        };
      }
    } catch {
      // fallback
    }
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_PAYMENT_CONFIG));
    return INITIAL_PAYMENT_CONFIG;
  },

  savePaymentConfig(config: AdminPaymentConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
      const token = this.getAdminToken();
      // Configuration changes sync to the server only during an authenticated admin session.
      if (token) {
        fetch('/api/store-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(config),
        }).then(async (res) => {
          if (!res.ok) console.error('No se pudo sincronizar la configuración:', await res.text());
        }).catch((error) => console.error('No se pudo guardar la configuración en el servidor:', error));
      }
    } catch (e) {
      console.error('Error saving config:', e);
    }
  },

  async fetchRemoteConfig(): Promise<AdminPaymentConfig | null> {
    try {
      const res = await fetch('/api/store-config');
      if (res.ok) {
        const remoteConfig = await res.json();
        if (remoteConfig && Object.keys(remoteConfig).length > 0) {
          const merged: AdminPaymentConfig = {
            ...INITIAL_PAYMENT_CONFIG,
            ...this.getPaymentConfig(),
            ...remoteConfig,
          };
          localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(merged));
          return merged;
        }
      }
    } catch {
      // Server not reachable yet, continue with local
    }
    return null;
  },

  async uploadImage(
    file: File,
    targetType: 'background' | 'logo' | 'banner' = 'background'
  ): Promise<{ url: string }> {
    // 1. Client-Side Validation: Type check (JPG, JPEG, PNG, WEBP)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error('Formato no permitido. Solo se aceptan imágenes JPG, JPEG, PNG y WEBP.');
    }

    // 2. Client-Side Validation: Max size (3 MB; data URLs expand request size)
    const MAX_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('La imagen supera los 3 MB permitidos. Por favor reduce su peso o elige otra.');
    }

    // 3. Read as Data URL
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
      reader.readAsDataURL(file);
    });

    // 4. Try uploading to server endpoint for global persistent URL
    try {
      const token = this.getAdminToken();
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          imageBase64: base64Data,
          filename: file.name,
          targetType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          return { url: data.url };
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        if (errJson.error) {
          throw new Error(errJson.error);
        }
      }
    } catch (err: any) {
      console.error('No se pudo guardar la imagen de forma persistente:', err);
      throw new Error(err?.message || 'No se pudo guardar la imagen. Comprueba la conexión y vuelve a intentarlo.');
    }

    throw new Error('El servidor no devolvió una dirección para la imagen.');
  },

  async uploadReceipt(file: File): Promise<{ url: string }> {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowed.includes(file.type.toLowerCase())) {
      throw new Error('Formato no compatible. Adjunta una imagen JPG, PNG, WEBP, GIF o un PDF.');
    }
    if (file.size > 3 * 1024 * 1024) {
      throw new Error('El comprobante supera el límite de 3 MB. Comprímelo o toma una captura más ligera.');
    }
    const imageBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer el comprobante.'));
      reader.readAsDataURL(file);
    });
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, filename: file.name, targetType: 'receipt' }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) throw new Error(data.error || 'No se pudo guardar el comprobante en el servidor.');
    return { url: data.url };
  },

  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    this.saveOrders([]);
    return [];
  },

  saveOrders(orders: Order[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders:', e);
    }
  },

  async addOrder(order: Order): Promise<void> {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'No se pudo registrar el pedido en el servidor. Inténtalo de nuevo.');
    }
    const savedOrder = (data.order || order) as Order;
    const orders = this.getOrders().filter((item) => item.id !== savedOrder.id);
    this.saveOrders([savedOrder, ...orders]);
  },

  async fetchRemoteOrders(): Promise<Order[] | null> {
    try {
      const token = this.getAdminToken();
      const res = await fetch('/api/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const remoteOrders = await res.json();
        if (Array.isArray(remoteOrders)) {
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(remoteOrders));
          return remoteOrders;
        }
      }
    } catch {
      // Server not reachable
    }
    return null;
  },

  async trackRemoteOrder(orderId: string, playerId?: string): Promise<Order | null> {
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, playerId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          return data.order;
        }
      }
    } catch {
      // Fallback
    }

    const localOrders = this.getOrders();
    const found = localOrders.find(
      (o) =>
        o.id.toUpperCase() === orderId.trim().toUpperCase() &&
        (!playerId || o.playerId === playerId.trim())
    );
    return found || null;
  },

  updateOrderStatus(orderId: string, status: Order['status'], adminNotes?: string): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;
    orders[idx] = {
      ...orders[idx],
      status,
      adminNotes: adminNotes !== undefined ? adminNotes : orders[idx].adminNotes,
      updatedAt: new Date().toISOString(),
    };
    this.saveOrders(orders);

    const token = this.getAdminToken();
    // Sync status change with server
    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status, adminNotes }),
    }).catch(() => {});

    return orders[idx];
  },

  // --- ADMIN AUTHENTICATION MANAGEMENT ---
  getAdminToken(): string | null {
    try {
      return sessionStorage.getItem('snk7_admin_token') || localStorage.getItem('snk7_admin_token');
    } catch {
      return null;
    }
  },

  setAdminToken(token: string, persist: boolean = false): void {
    try {
      sessionStorage.setItem('snk7_admin_token', token);
      if (persist) {
        localStorage.setItem('snk7_admin_token', token);
      }
    } catch (e) {
      console.error('Error saving admin token:', e);
    }
  },

  clearAdminToken(): void {
    try {
      sessionStorage.removeItem('snk7_admin_token');
      localStorage.removeItem('snk7_admin_token');
    } catch (e) {
      console.error('Error clearing token:', e);
    }
  },

  async loginAdmin(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        this.setAdminToken(data.token, true);
        return { success: true, token: data.token };
      }
      return { success: false, error: data.error || 'Credenciales incorrectas.' };
    } catch {
      return { success: false, error: 'El servidor de administración no responde. La tienda debe publicarse con las funciones de Netlify activas.' };
    }
  },

  async verifyAdminSession(): Promise<{ authenticated: boolean; username?: string }> {
    const token = this.getAdminToken();
    if (!token) return { authenticated: false };

    try {
      const res = await fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return { authenticated: !!data.authenticated, username: data.username };
      }
    } catch {
      this.clearAdminToken();
      return { authenticated: false };
    }
    this.clearAdminToken();
    return { authenticated: false };
  },

  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const token = this.getAdminToken();
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          this.setAdminToken(data.token, true);
        }
        return { success: true };
      }
      return { success: false, error: data.error || 'Error al actualizar contraseña' };
    } catch {
      return { success: false, error: 'No se pudo contactar al servidor; la contraseña no fue cambiada.' };
    }
  },

  logoutAdmin(): void {
    this.clearAdminToken();
  },

  getAdminPin(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || 'snk7admin';
  },

  setAdminPin(pin: string): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin);
  },

  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_PAYMENT_CONFIG));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, 'snk7admin');
  },
};
