import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { getStore } from '@netlify/blobs';

const pbkdf2 = promisify(crypto.pbkdf2);
const store = getStore('snk7-production-data');

interface HandlerEvent {
  path: string;
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
  queryStringParameters?: Record<string, string | undefined> | null;
}

interface AuthRecord {
  username: string;
  salt: string;
  hash: string;
}
interface SessionPayload {
  username: string;
  exp: number;
  iat: number;
}

const responseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function json(statusCode: number, value: unknown) {
  return { statusCode, headers: responseHeaders, body: JSON.stringify(value) };
}

function normalizedPath(path: string) {
  const p = (path || '/').replace(/^\/\.netlify\/functions\/api/, '/api');
  return p.length > 1 ? p.replace(/\/$/, '') : p;
}

async function hashPassword(password: string, salt: string) {
  const result = await pbkdf2(password, salt, 210_000, 32, 'sha256');
  return result.toString('hex');
}

async function getAuthRecord(): Promise<AuthRecord> {
  const saved = await store.get('auth/admin', { type: 'json', consistency: 'strong' }) as AuthRecord | null;
  if (saved?.username && saved?.salt && saved?.hash) return saved;

  const username = (process.env.ADMIN_USERNAME || 'admin').trim();
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || '';
  if (initialPassword.length < 12) {
    throw new Error('ADMIN_INITIAL_PASSWORD no está configurada o tiene menos de 12 caracteres.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const record = { username, salt, hash: await hashPassword(initialPassword, salt) };
  await store.setJSON('auth/admin', record);
  return record;
}

async function getSigningSecret(): Promise<string> {
  if (process.env.ADMIN_JWT_SECRET && process.env.ADMIN_JWT_SECRET.length >= 32) {
    return process.env.ADMIN_JWT_SECRET;
  }
  const saved = await store.get('auth/signing-secret', { consistency: 'strong' });
  if (saved) return saved;
  const secret = crypto.randomBytes(48).toString('base64url');
  await store.set('auth/signing-secret', secret);
  return secret;
}

async function verifyCredentials(username: string, password: string) {
  const record = await getAuthRecord();
  if (!username || username.trim().toLowerCase() !== record.username.toLowerCase() || !password) return false;
  const candidate = await hashPassword(password, record.salt);
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(record.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function createSessionToken(username: string) {
  const secret = await getSigningSecret();
  const now = Date.now();
  const payload: SessionPayload = { username, exp: now + 12 * 60 * 60 * 1000, iat: now };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

async function verifySessionToken(token: string) {
  if (!token) return { valid: false, error: 'Falta el token de sesión.' };
  const [encoded, signature, ...rest] = token.split('.');
  if (!encoded || !signature || rest.length) return { valid: false, error: 'Sesión inválida.' };
  const secret = await getSigningSecret();
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { valid: false, error: 'Sesión inválida.' };
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.exp || Date.now() > payload.exp) return { valid: false, error: 'La sesión expiró. Inicia sesión otra vez.' };
    return { valid: true, username: payload.username };
  } catch {
    return { valid: false, error: 'Sesión inválida.' };
  }
}

async function auth(event: HandlerEvent) {
  const header = event.headers?.authorization || event.headers?.Authorization || '';
  if (!header.startsWith('Bearer ')) return { authorized: false, error: 'Acceso no autorizado. Inicia sesión.' };
  const result = await verifySessionToken(header.slice(7));
  return result.valid ? { authorized: true, username: result.username } : { authorized: false, error: result.error || 'Sesión inválida.' };
}

async function getOrders() {
  const listing = await store.list({ prefix: 'orders/' });
  const keys = (listing.blobs || []).map((item: { key: string }) => item.key);
  const records = await Promise.all(keys.map((key: string) => store.get(key, { type: 'json', consistency: 'strong' })));
  return records.filter(Boolean).sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function publicOrder(order: any) {
  if (!order) return order;
  const { receiptImage, ...safe } = order;
  return safe;
}

function parseJsonBody(event: HandlerEvent) {
  if (!event.body) return {};
  return JSON.parse(event.body);
}

export const handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: responseHeaders, body: '' };

  const path = normalizedPath(event.path);
  let body: any = {};
  try {
    body = parseJsonBody(event);
  } catch {
    return json(400, { error: 'El cuerpo de la solicitud no contiene JSON válido.' });
  }

  try {
    // Public image endpoint. IDs are random and only public branding images are stored here.
    const imageMatch = path.match(/^\/api\/images\/([a-f0-9-]{20,50})$/i);
    if (imageMatch && event.httpMethod === 'GET') {
      const key = `images/${imageMatch[1]}`;
      const found = await store.getWithMetadata(key, { consistency: 'strong' });
      if (!found) return json(404, { error: 'Imagen no encontrada.' });
      const buffer = Buffer.from(String(found.data), 'base64');
      const mimeType = String(found.metadata?.mimeType || 'application/octet-stream');
      return {
        statusCode: 200,
        headers: { 'Content-Type': mimeType, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
        isBase64Encoded: true,
        body: buffer.toString('base64'),
      };
    }

    // Administrator login.
    if (path === '/api/admin/login' && event.httpMethod === 'POST') {
      const { username, password } = body;
      if (!username || !password) return json(400, { success: false, error: 'Introduce el usuario y la contraseña.' });
      const existingAuth = await store.get('auth/admin', { type: 'json', consistency: 'strong' });
      if (!existingAuth && (typeof process.env.ADMIN_INITIAL_PASSWORD !== 'string' || process.env.ADMIN_INITIAL_PASSWORD.length < 12)) {
        return json(503, { success: false, error: 'El panel aún no está configurado. En Netlify define ADMIN_INITIAL_PASSWORD (mínimo 12 caracteres) y vuelve a desplegar.' });
      }
      const ok = await verifyCredentials(String(username), String(password));
      if (!ok) return json(401, { success: false, error: 'Usuario o contraseña incorrectos.' });
      return json(200, { success: true, token: await createSessionToken((await getAuthRecord()).username), username: (await getAuthRecord()).username });
    }

    if (path === '/api/admin/verify' && event.httpMethod === 'GET') {
      const result = await auth(event);
      return result.authorized
        ? json(200, { authenticated: true, username: result.username })
        : json(401, { authenticated: false, error: result.error });
    }

    if (path === '/api/admin/change-password' && event.httpMethod === 'POST') {
      const result = await auth(event);
      if (!result.authorized) return json(401, { success: false, error: result.error });
      const { currentPassword, newPassword } = body;
      const record = await getAuthRecord();
      if (!(await verifyCredentials(record.username, String(currentPassword || '')))) {
        return json(400, { success: false, error: 'La contraseña actual es incorrecta.' });
      }
      if (typeof newPassword !== 'string' || newPassword.length < 10) {
        return json(400, { success: false, error: 'La nueva contraseña debe tener al menos 10 caracteres.' });
      }
      const salt = crypto.randomBytes(16).toString('hex');
      await store.setJSON('auth/admin', { username: record.username, salt, hash: await hashPassword(newPassword, salt) });
      return json(200, { success: true, token: await createSessionToken(record.username), message: 'Contraseña actualizada correctamente.' });
    }

    // Product catalog: public read, admin-only write.
    if (path === '/api/products') {
      if (event.httpMethod === 'GET') {
        const products = await store.get('products', { type: 'json', consistency: 'strong' });
        // null means the catalog has not been configured yet; [] is a saved, intentionally empty catalog.
        return json(200, Array.isArray(products) ? products : null);
      }
      if (event.httpMethod === 'POST') {
        const result = await auth(event);
        if (!result.authorized) return json(401, { error: result.error });
        if (!Array.isArray(body.products)) return json(400, { error: 'El catálogo no tiene un formato válido.' });
        await store.setJSON('products', body.products);
        return json(200, { success: true });
      }
    }

    // Public read, admin-only write. Netlify Blobs stores these values across function instances and deploys.
    if (path === '/api/store-config') {
      if (event.httpMethod === 'GET') {
        const config = await store.get('store-config', { type: 'json', consistency: 'strong' });
        return json(200, config && typeof config === 'object' ? config : {});
      }
      if (event.httpMethod === 'POST') {
        const result = await auth(event);
        if (!result.authorized) return json(401, { error: result.error });
        await store.setJSON('store-config', body);
        return json(200, { success: true, config: body });
      }
    }

    // Save a store logo/banner/background image. Requires admin authentication.
    if (path === '/api/upload-image' && event.httpMethod === 'POST') {
      const { imageBase64, targetType } = body;
      const target = String(targetType || '');
      if (!['logo', 'banner', 'background', 'receipt'].includes(target)) return json(400, { error: 'Tipo de imagen no válido.' });
      if (target !== 'receipt') {
        const result = await auth(event);
        if (!result.authorized) return json(401, { error: result.error });
      }
      if (typeof imageBase64 !== 'string') return json(400, { error: 'No se recibieron datos de imagen válidos.' });
      const allowedMime = target === 'receipt'
        ? '(?:image\/(?:jpeg|jpg|png|webp|gif)|application\/pdf)'
        : 'image\/(?:jpeg|jpg|png|webp)';
      const matches = imageBase64.match(new RegExp(`^data:(${allowedMime});base64,([A-Za-z0-9+/=]+)$`, 'i'));
      if (!matches) return json(400, { error: target === 'receipt' ? 'Adjunta una imagen JPG, PNG, WEBP, GIF o un PDF.' : 'Formato no permitido. Usa JPG, PNG o WEBP.' });
      const mimeType = matches[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : matches[1].toLowerCase();
      const buffer = Buffer.from(matches[2], 'base64');
      if (buffer.length > 3 * 1024 * 1024) return json(413, { error: 'El archivo supera el límite de 3 MB.' });
      const id = crypto.randomUUID();
      await store.set(`images/${id}`, buffer.toString('base64'), { metadata: { mimeType, targetType: target } });
      return json(201, { success: true, url: `/api/images/${id}`, size: buffer.length, mimeType });
    }

    // Create order publicly; list/update require an administrator.
    if (path === '/api/orders/track' && event.httpMethod === 'POST') {
      const orderId = String(body.orderId || '').trim().toUpperCase();
      const playerId = String(body.playerId || '').trim();
      if (!orderId || !playerId) return json(400, { success: false, error: 'Introduce el número de pedido y el ID de jugador.' });
      const orders = await getOrders();
      const found = orders.find((order: any) => String(order.id).toUpperCase() === orderId && String(order.playerId) === playerId);
      if (!found) return json(404, { success: false, error: 'No se encontró el pedido con esos datos.' });
      return json(200, { success: true, order: publicOrder(found) });
    }

    if (path === '/api/orders' && event.httpMethod === 'GET') {
      const result = await auth(event);
      if (!result.authorized) return json(401, { error: result.error });
      return json(200, await getOrders());
    }

    if (path === '/api/orders' && event.httpMethod === 'POST') {
      const order = body;
      if (!['pago_movil', 'usdt'].includes(order.paymentMethod)) return json(400, { error: 'Método de pago no válido.' });
      const playerId = String(order.playerId || '').trim();
      if (!/^\d{6,14}$/.test(playerId)) return json(400, { error: 'El ID de jugador debe tener entre 6 y 14 números.' });
      const reference = String(order.paymentReference || '').trim();
      const receipt = typeof order.receiptImage === 'string' ? order.receiptImage : '';
      if (!reference && !receipt) return json(400, { error: 'Adjunta el comprobante o introduce la referencia del pago.' });
      if (receipt && !/^data:(image\/(?:jpeg|png|webp|gif)|application\/pdf);base64,/i.test(receipt) && !receipt.startsWith('/api/images/')) {
        return json(400, { error: 'El comprobante debe ser una imagen o PDF válido.' });
      }
      if (receipt.startsWith('data:') && Buffer.byteLength(receipt, 'utf8') > 4_300_000) {
        return json(413, { error: 'El comprobante pesa demasiado para registrarlo. Adjunta un archivo de hasta 3 MB.' });
      }
      const id = /^SNK-\d{6}$/i.test(String(order.id || '')) ? String(order.id).toUpperCase() : `SNK-${crypto.randomInt(100000, 1000000)}`;
      const existing = await store.get(`orders/${id}.json`, { type: 'json', consistency: 'strong' });
      if (existing) return json(409, { error: 'Ese número de pedido ya existe. Intenta realizar el pedido nuevamente.' });
      const created = {
        ...order,
        id,
        playerId,
        paymentReference: reference || 'Comprobante adjunto',
        createdAt: typeof order.createdAt === 'string' ? order.createdAt : new Date().toISOString(),
        status: 'pending',
      };
      await store.setJSON(`orders/${id}.json`, created);
      return json(201, { success: true, order: created });
    }

    const updateMatch = path.match(/^\/api\/orders\/([A-Z0-9-]+)$/i);
    if (updateMatch && event.httpMethod === 'PATCH') {
      const result = await auth(event);
      if (!result.authorized) return json(401, { error: result.error });
      const id = updateMatch[1].toUpperCase();
      const key = `orders/${id}.json`;
      const found = await store.get(key, { type: 'json', consistency: 'strong' }) as any;
      if (!found) return json(404, { error: 'Pedido no encontrado.' });
      const allowed = ['pending', 'processing', 'completed', 'rejected'];
      if (body.status !== undefined && !allowed.includes(body.status)) return json(400, { error: 'Estado de pedido no válido.' });
      const updated = {
        ...found,
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.adminNotes !== undefined ? { adminNotes: String(body.adminNotes) } : {}),
        updatedAt: new Date().toISOString(),
      };
      await store.setJSON(key, updated);
      return json(200, { success: true, order: updated });
    }

    return json(404, { error: 'Ruta no encontrada.' });
  } catch (error: any) {
    console.error('SNK7 API error:', error);
    return json(500, { error: 'Error interno del servidor. Revisa los registros de funciones en Netlify.' });
  }
};
