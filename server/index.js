import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import crypto from 'node:crypto';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 4000);
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing. Set it in the deployment environment.');
}
try {
  const parsedDatabaseUrl = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) throw new Error('DATABASE_URL must use postgres:// or postgresql://.');
  if (!parsedDatabaseUrl.password) throw new Error('DATABASE_URL has no password. Add your PostgreSQL password; URL-encode special characters such as @, #, /, or %.');
} catch (error) {
  throw new Error(`Invalid DATABASE_URL: ${error.message}`);
}
const pool = new Pool({ connectionString: databaseUrl, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

// Initialize authentication before handling API routes on each Vercel instance.
let initializationPromise;
if (process.env.VERCEL) {
  app.use((req, res, next) => {
    if (!initializationPromise) initializationPromise = initializeAuth();
    initializationPromise.then(() => next()).catch(next);
  });
}

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const toMeal = row => ({ id: Number(row.id), name: row.name, category: row.category, image: row.image_url, priceAFN: Number(row.price_afn), ingredients: row.description, available: row.is_available });
const mealSelect = `SELECT m.id,m.name,c.name AS category,m.image_url,m.price_afn,m.description,m.is_available FROM menu_items m JOIN categories c ON c.id=m.category_id`;

const TOKEN_SECRET = process.env.AUTH_SECRET || 'development-only-change-this-secret';
const scrypt = (password, salt) => new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (err, key) => err ? reject(err) : resolve(key.toString('hex'))));
function makeToken(user) {
  const payload = Buffer.from(JSON.stringify({ id: Number(user.id), role: user.role, email: user.email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
async function requireAuth(req, res, next) {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return res.status(401).json({ error: 'Please sign in first.' });
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest();
    const supplied = Buffer.from(signature, 'base64url');
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return res.status(401).json({ error: 'Invalid session. Please sign in again.' });
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return res.status(401).json({ error: 'Your session expired. Please sign in again.' });
    const result = await pool.query('SELECT id,full_name,email,role FROM app_users WHERE id=$1', [data.id]);
    if (!result.rowCount) return res.status(401).json({ error: 'Account no longer exists.' });
    req.user = { id: Number(result.rows[0].id), name: result.rows[0].full_name, email: result.rows[0].email, role: result.rows[0].role };
    next();
  } catch (error) { next(error); }
}
const requireAdmin = (req, res, next) => requireAuth(req, res, error => {
  if (error) return next(error);
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access is required.' });
  next();
});
const publicUser = row => ({ id: Number(row.id), name: row.full_name, email: row.email, role: row.role });

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { name, email, phone, password } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!String(name || '').trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !String(phone || '').trim() || String(password || '').length < 8) return res.status(400).json({ error: 'Name, valid email, phone and a password of at least 8 characters are required.' });
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = await scrypt(password, salt);
  try {
    const result = await pool.query('INSERT INTO app_users(full_name,email,phone,password_salt,password_hash,role) VALUES($1,$2,$3,$4,$5,\'customer\') RETURNING id,full_name,email,role', [String(name).trim(), cleanEmail, String(phone).trim(), salt, passwordHash]);
    const user = publicUser(result.rows[0]); res.status(201).json({ user, token: makeToken(result.rows[0]) });
  } catch (error) { if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' }); throw error; }
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase(); const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const result = await pool.query('SELECT id,full_name,email,role,password_salt,password_hash FROM app_users WHERE email=$1', [email]);
  if (!result.rowCount) return res.status(401).json({ error: 'Email or password is incorrect.' });
  const row = result.rows[0]; const candidate = await scrypt(password, row.password_salt);
  const a = Buffer.from(candidate, 'hex'); const b = Buffer.from(row.password_hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ user: publicUser(row), token: makeToken(row) });
}));

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

app.get('/api/health', asyncRoute(async (_req,res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
}));

app.get('/api/categories', asyncRoute(async (_req,res) => {
  const { rows } = await pool.query('SELECT id,name,slug FROM categories WHERE is_active=true ORDER BY sort_order,name');
  res.json(rows);
}));

app.get('/api/menu', asyncRoute(async (req,res) => {
  const values=[]; let where='';
  if (req.query.available === 'true') where=' WHERE m.is_available=true';
  const { rows } = await pool.query(`${mealSelect}${where} ORDER BY m.is_featured DESC,m.id`);
  res.json(rows.map(toMeal));
}));

app.post('/api/menu', requireAdmin, asyncRoute(async (req,res) => {
  const { name, category, image, priceAFN, ingredients, available=true } = req.body || {};
  if (!String(name || '').trim() || !String(category || '').trim() || !String(ingredients || '').trim() || !Number.isFinite(Number(priceAFN)) || Number(priceAFN) <= 0) return res.status(400).json({ error: 'Name, category, ingredients and a positive price are required.' });
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const c=await client.query('SELECT id FROM categories WHERE name=$1 AND is_active=true',[category]);
    if (!c.rowCount) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Unknown menu category.' }); }
    const slugBase=String(name).trim().toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'dish';
    const slug=`${slugBase}-${crypto.randomBytes(3).toString('hex')}`;
    const result=await client.query(`INSERT INTO menu_items(category_id,name,slug,description,image_url,price_afn,is_available) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,[c.rows[0].id,String(name).trim(),slug,String(ingredients).trim(),String(image || ''),Number(priceAFN),Boolean(available)]);
    const meal=await client.query(`${mealSelect} WHERE m.id=$1`,[result.rows[0].id]);
    await client.query('COMMIT'); res.status(201).json(toMeal(meal.rows[0]));
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}));

app.put('/api/menu/:id', requireAdmin, asyncRoute(async (req,res) => {
  const id=Number(req.params.id); const { name,category,image,priceAFN,ingredients,available }=req.body || {};
  if (!Number.isSafeInteger(id) || id<1 || !String(name || '').trim() || !String(category || '').trim() || !String(ingredients || '').trim() || !Number.isFinite(Number(priceAFN)) || Number(priceAFN)<=0 || typeof available!=='boolean') return res.status(400).json({error:'Valid menu fields are required.'});
  const { rows }=await pool.query(`UPDATE menu_items m SET name=$1,category_id=c.id,image_url=$2,price_afn=$3,description=$4,is_available=$5 FROM categories c WHERE m.id=$6 AND c.name=$7 AND c.is_active=true RETURNING m.id`,[String(name).trim(),String(image || ''),Number(priceAFN),String(ingredients).trim(),available,id,category]);
  if (!rows.length) return res.status(404).json({error:'Menu item or category not found.'});
  const result=await pool.query(`${mealSelect} WHERE m.id=$1`,[id]); res.json(toMeal(result.rows[0]));
}));

app.delete('/api/menu/:id', requireAdmin, asyncRoute(async (req,res) => {
  const id=Number(req.params.id); if (!Number.isSafeInteger(id)||id<1) return res.status(400).json({error:'Invalid menu item id.'});
  const result=await pool.query('DELETE FROM menu_items WHERE id=$1 RETURNING id',[id]);
  if (!result.rowCount) return res.status(404).json({error:'Menu item not found.'});
  res.status(204).end();
}));

app.post('/api/orders', asyncRoute(async (req,res) => {
  const { name,phone,date,notes='',fulfilment='pickup',items }=req.body || {};
  if (!String(name || '').trim() || !String(phone || '').trim() || !/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !['pickup','delivery'].includes(fulfilment) || !Array.isArray(items) || !items.length || items.length>50) return res.status(400).json({error:'Please provide valid customer details, requested date, fulfilment and order items.'});
  const requestedDate=new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(requestedDate.getTime()) || requestedDate.toISOString().slice(0,10)!==date || date < new Date().toISOString().slice(0,10)) return res.status(400).json({error:'Requested date must be today or a future date.'});
  const quantities=new Map();
  for (const item of items) { const id=Number(item.id), quantity=Number(item.quantity); if (!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(quantity)||quantity<1||quantity>99) return res.status(400).json({error:'Each order item must have a valid id and quantity (1-99).'}); quantities.set(id,(quantities.get(id)||0)+quantity); }
  if ([...quantities.values()].some(q=>q>99)) return res.status(400).json({error:'Maximum quantity per dish is 99.'});
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const ids=[...quantities.keys()];
    const menu=await client.query('SELECT id,name,price_afn,is_available FROM menu_items WHERE id=ANY($1::bigint[]) FOR SHARE',[ids]);
    if (menu.rowCount!==ids.length) { await client.query('ROLLBACK'); return res.status(400).json({error:'One or more menu items no longer exist.'}); }
    if (menu.rows.some(m=>!m.is_available)) { await client.query('ROLLBACK'); return res.status(409).json({error:'One or more dishes are currently unavailable.'}); }
    const byId=new Map(menu.rows.map(m=>[Number(m.id),m]));
    const subtotal=ids.reduce((sum,id)=>sum+Number(byId.get(id).price_afn)*quantities.get(id),0);
    const fee=fulfilment==='delivery'?60:0; const total=subtotal+fee;
    const customer=await client.query('INSERT INTO customers(full_name,phone) VALUES($1,$2) RETURNING id',[String(name).trim(),String(phone).trim()]);
    const orderNumber=`AB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const order=await client.query(`INSERT INTO orders(order_number,customer_id,fulfilment,requested_for,notes,subtotal_afn,delivery_fee_afn,total_afn) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,order_number,status,subtotal_afn,delivery_fee_afn,total_afn,created_at`,[orderNumber,customer.rows[0].id,fulfilment,date,String(notes).trim(),subtotal,fee,total]);
    for (const id of ids) { const m=byId.get(id); await client.query('INSERT INTO order_items(order_id,menu_item_id,item_name_snapshot,unit_price_afn,quantity) VALUES($1,$2,$3,$4,$5)',[order.rows[0].id,id,m.name,m.price_afn,quantities.get(id)]); }
    await client.query('COMMIT');
    const o=order.rows[0]; res.status(201).json({id:Number(o.id),orderNumber:o.order_number,status:o.status,subtotalAFN:Number(o.subtotal_afn),deliveryFeeAFN:Number(o.delivery_fee_afn),totalAFN:Number(o.total_afn),createdAt:o.created_at});
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}));

app.get('/api/orders', requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(`SELECT o.id,o.order_number,o.status,o.fulfilment,o.requested_for,o.subtotal_afn,o.delivery_fee_afn,o.total_afn,o.created_at,c.full_name AS customer_name,c.phone,
    COALESCE(json_agg(json_build_object('name',oi.item_name_snapshot,'quantity',oi.quantity,'unitPriceAFN',oi.unit_price_afn) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]'::json) AS items
    FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN order_items oi ON oi.order_id=o.id GROUP BY o.id,c.full_name,c.phone ORDER BY o.created_at DESC`);
  res.json(result.rows.map(o => ({ id:Number(o.id), orderNumber:o.order_number, status:o.status, fulfilment:o.fulfilment, requestedFor:o.requested_for, customerName:o.customer_name, phone:o.phone, subtotalAFN:Number(o.subtotal_afn), deliveryFeeAFN:Number(o.delivery_fee_afn), totalAFN:Number(o.total_afn), createdAt:o.created_at, items:o.items })));
}));

app.post('/api/contact-messages', asyncRoute(async (req,res) => {
  const {name,email,message}=req.body || {};
  if (!String(name||'').trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||'')) || String(message||'').trim().length<10) return res.status(400).json({error:'A name, valid email and message of at least 10 characters are required.'});
  const {rows}=await pool.query('INSERT INTO contact_messages(full_name,email,message) VALUES($1,$2,$3) RETURNING id,created_at',[String(name).trim(),String(email).trim(),String(message).trim()]);
  res.status(201).json({id:Number(rows[0].id),message:'Message saved successfully.'});
}));

app.use((err,_req,res,_next)=>{ console.error(err); res.status(500).json({error:process.env.NODE_ENV==='production'?'Internal server error':err.message || 'Internal server error'}); });
async function initializeAuth() {
  await pool.query(`CREATE TABLE IF NOT EXISTS app_users (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    phone VARCHAR(40) NOT NULL DEFAULT '',
    password_salt VARCHAR(64) NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin','customer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '');
  if (!adminEmail || adminPassword.length < 12) throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in .env before starting the API.');
  const salt = crypto.randomBytes(16).toString('hex'); const hash = await scrypt(adminPassword, salt);
  await pool.query(`INSERT INTO app_users(full_name,email,phone,password_salt,password_hash,role) VALUES('System Administrator',$1,'',$2,$3,'admin')
    ON CONFLICT(email) DO UPDATE SET password_salt=EXCLUDED.password_salt,password_hash=EXCLUDED.password_hash,role='admin'`, [adminEmail, salt, hash]);
}
// Export the Express app so Vercel can run it as a serverless function.
export default app;

// Keep the normal local development workflow working.
if (!process.env.VERCEL) {
  initializeAuth()
    .then(() => app.listen(port, () => console.log(`Afghan Bites API listening on http://localhost:${port}`)))
    .catch(error => {
      console.error(`Could not initialize authentication: ${error.message}`);
      process.exit(1);
    });
  process.on('SIGINT', async () => { await pool.end(); process.exit(0); });
  process.on('SIGTERM', async () => { await pool.end(); process.exit(0); });
}
