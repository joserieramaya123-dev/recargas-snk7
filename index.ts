export type ProductType = 'diamonds' | 'membership';

export interface Product {
  id: string;
  type: ProductType;
  name: string;
  diamonds: number;
  bonus?: string;
  priceBs: number;
  costBs: number; // Internal top-up cost registered by admin to calculate profits
  description: string;
  badge?: string;
  image: string;
  active: boolean;
}

export type PaymentMethod = 'pago_movil' | 'usdt';

export interface PagoMovilConfig {
  bankName: string;
  phone: string;
  idDoc: string;
  holderName: string;
}

export interface PagoMovilAccount {
  id: string; // 'account_1' | 'account_2'
  label: string; // e.g. "Cuenta Principal" | "Cuenta Secundaria"
  bankName: string;
  phone: string;
  idDoc: string;
  holderName: string;
  additionalInfo?: string; // Optional info for client
  notes?: string; // Alias for additional notes
  active: boolean; // whether this account is available
}

export interface UsdtConfig {
  network: string;
  walletAddress?: string;
  trc20Address?: string;
  binancePayId?: string;
}

export interface AdminPaymentConfig {
  pagoMovilAccounts: PagoMovilAccount[]; // Two configurable accounts
  activePagoMovilId: string; // 'account_1' | 'account_2' (primary active account)
  pagoMovil: PagoMovilConfig; // Kept for backwards compatibility
  usdt: UsdtConfig;
  rateBsPerUsdt: number;
  whatsappNumber: string;
  storeLogoUrl?: string; // Custom store logo URL or base64
  bannerUrl?: string; // Custom banner URL or base64
  showBanner?: boolean; // Toggle compact banner visibility
  bgImageUrl?: string; // Custom full-store background image URL or base64
  bgOverlayOpacity?: number; // Background dimming/darkness overlay percentage (30 to 95, default 75)
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  error?: string;
  username?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface Order {
  id: string; // e.g. SNK-108429
  createdAt: string;
  productId: string;
  productName: string;
  productType: ProductType;
  diamonds: number;
  amountBs: number;
  amountUsdt?: number; // Kept for historical USDT orders
  costBs: number;
  playerId: string;
  playerNickname?: string;
  clientName?: string;
  serverRegion: string;
  paymentMethod: PaymentMethod;
  pagoMovilAccountId?: string;
  receiptImage?: string; // base64 or URL
  receiptFilename?: string;
  receiptFileSize?: number;
  paymentReference: string;
  status: OrderStatus;
  adminNotes?: string;
  updatedAt?: string;
  notifications?: OrderNotifications;
}

export type NotificationDeliveryStatus = 'sent' | 'failed' | 'not_configured';

export interface NotificationChannelStatus {
  status: NotificationDeliveryStatus;
  error?: string;
  sentAt?: string;
  recipient?: string;
  details?: string;
}

export interface OrderNotifications {
  email?: NotificationChannelStatus;
  whatsapp?: NotificationChannelStatus;
}

export interface NotificationConfigStatus {
  email: {
    configured: boolean;
    provider: string;
    recipientEmail?: string;
    fromEmail?: string;
    apiKeySet: boolean;
    maskedKey?: string;
    missingFields: string[];
  };
  whatsapp: {
    configured: boolean;
    provider: string;
    adminPhone: string;
    phoneNumberIdSet: boolean;
    accessTokenSet: boolean;
    maskedToken?: string;
    missingFields: string[];
  };
}
