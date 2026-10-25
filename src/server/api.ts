import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from './db';
import { requireAuth, requireAdmin, generateToken } from './auth';
import { runSeed } from './seed';

export const apiRouter = Router();

// ============================================================================
// 1. AUTHENTICATION & USERS
// ============================================================================

/**
 * Customer Registration (Public)
 * SECURITY RULE: Public registration form MUST NEVER assign the admin role.
 * Role is strictly hardcoded to 'customer'.
 */
apiRouter.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !email.includes('@') || !password || password.length < 6 || !name) {
      res.status(400).json({
        error: 'Validation failed: valid email, password (min 6 chars), and full name are required.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check existing email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      res.status(409).json({
        error: 'An account with this email address already exists. Please sign in.',
        code: 'EMAIL_CONFLICT',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    // HARDCODED: 'customer' role strictly enforced on server
    const role = 'customer';

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, normalizedEmail, passwordHash, name.trim(), role, phone?.trim() || null, now);

    const user = {
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      role: 'customer' as const,
      phone: phone?.trim() || undefined,
      createdAt: now,
    };

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to complete registration.', details: err.message });
  }
});

/**
 * User Sign In
 */
apiRouter.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Email and password are required.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as any;

    if (!userRow) {
      res.status(401).json({
        error: 'Invalid credentials. Please verify your email and password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!isMatch) {
      res.status(401).json({
        error: 'Invalid credentials. Please verify your email and password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const user = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role === 'studio' ? 'admin' : userRow.role,
      phone: userRow.phone || undefined,
      createdAt: userRow.created_at,
    };

    const token = generateToken(user);
    res.json({ user, token });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to authenticate user.', details: err.message });
  }
});

/**
 * Get Current User Profile
 */
apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response): void => {
  const userRow = db.prepare('SELECT id, email, name, role, phone, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!userRow) {
    res.status(404).json({ error: 'User profile not found.', code: 'NOT_FOUND' });
    return;
  }

  res.json({
    user: {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role === 'studio' ? 'admin' : userRow.role,
      phone: userRow.phone || undefined,
      createdAt: userRow.created_at,
    },
  });
});

// ============================================================================
// 2. ASSIGNMENT SERVICE 1: PAINTINGS & ORDERS
// Rules:
// 1. Each painting can be purchased only once.
// 2. Customers can cancel their own orders, making the painting available again.
// 3. Admins can add or edit paintings only while they are available.
// Order statuses: 'placed', 'cancelled'.
// ============================================================================

/**
 * List all paintings
 */
apiRouter.get('/paintings', (_req: Request, res: Response): void => {
  const rows = db.prepare('SELECT * FROM paintings ORDER BY featured DESC, id ASC').all() as any[];
  const paintings = rows.map((p) => ({
    id: p.id,
    title: p.title,
    artist: p.artist,
    price: p.price,
    imageUrl: p.image_url,
    status: p.status,
    description: p.description,
    category: p.category,
    year: p.year,
    medium: p.medium,
    dimensions: p.dimensions,
    featured: Boolean(p.featured),
  }));
  res.json({ paintings });
});

/**
 * Get single painting
 */
apiRouter.get('/paintings/:id', (req: Request, res: Response): void => {
  const p = db.prepare('SELECT * FROM paintings WHERE id = ?').get(req.params.id) as any;
  if (!p) {
    res.status(404).json({ error: 'Painting not found in inventory.', code: 'NOT_FOUND' });
    return;
  }
  res.json({
    painting: {
      id: p.id,
      title: p.title,
      artist: p.artist,
      price: p.price,
      imageUrl: p.image_url,
      status: p.status,
      description: p.description,
      category: p.category,
      year: p.year,
      medium: p.medium,
      dimensions: p.dimensions,
      featured: Boolean(p.featured),
    },
  });
});

/**
 * Add painting (Admin only)
 */
apiRouter.post('/paintings', requireAuth, requireAdmin, (req: Request, res: Response): void => {
  try {
    const { title, artist, price, imageUrl, description, category, medium, dimensions, featured } = req.body;

    if (!title || !artist || !price || Number(price) <= 0 || !imageUrl || !description) {
      res.status(400).json({
        error: 'Title, artist, positive price, imageUrl, and description are required.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const id = `paint-${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO paintings (id, title, artist, price, image_url, status, description, category, year, medium, dimensions, featured, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'available', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      artist.trim(),
      Number(price),
      imageUrl.trim(),
      description.trim(),
      category?.trim() || 'Original Artwork',
      new Date().getFullYear(),
      medium?.trim() || 'Mixed Media',
      dimensions?.trim() || 'Custom Canvas',
      featured ? 1 : 0,
      now,
      now
    );

    const painting = db.prepare('SELECT * FROM paintings WHERE id = ?').get(id) as any;
    res.status(201).json({
      painting: {
        id: painting.id,
        title: painting.title,
        artist: painting.artist,
        price: painting.price,
        imageUrl: painting.image_url,
        status: painting.status,
        description: painting.description,
        category: painting.category,
        year: painting.year,
        medium: painting.medium,
        dimensions: painting.dimensions,
        featured: Boolean(painting.featured),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to catalog painting.', details: err.message });
  }
});

/**
 * Edit painting (Admin only)
 * Rule: Admins can add or edit paintings only while they are available.
 */
apiRouter.put('/paintings/:id', requireAuth, requireAdmin, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM paintings WHERE id = ?').get(id) as any;

    if (!existing) {
      res.status(404).json({ error: 'Painting not found.', code: 'NOT_FOUND' });
      return;
    }

    // RULE: Edit allowed ONLY while painting is available
    if (existing.status === 'sold') {
      res.status(400).json({
        error: 'Cannot edit sold paintings. Per studio rules, paintings can only be edited while they are available.',
        code: 'PAINTING_SOLD_LOCKED',
      });
      return;
    }

    const { title, artist, price, imageUrl, description, category, medium, dimensions, featured } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE paintings SET
        title = COALESCE(?, title),
        artist = COALESCE(?, artist),
        price = COALESCE(?, price),
        image_url = COALESCE(?, image_url),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        medium = COALESCE(?, medium),
        dimensions = COALESCE(?, dimensions),
        featured = COALESCE(?, featured),
        updated_at = ?
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      artist ? artist.trim() : null,
      price ? Number(price) : null,
      imageUrl ? imageUrl.trim() : null,
      description ? description.trim() : null,
      category ? category.trim() : null,
      medium ? medium.trim() : null,
      dimensions ? dimensions.trim() : null,
      featured !== undefined ? (featured ? 1 : 0) : null,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM paintings WHERE id = ?').get(id) as any;
    res.json({
      painting: {
        id: updated.id,
        title: updated.title,
        artist: updated.artist,
        price: updated.price,
        imageUrl: updated.image_url,
        status: updated.status,
        description: updated.description,
        category: updated.category,
        year: updated.year,
        medium: updated.medium,
        dimensions: updated.dimensions,
        featured: Boolean(updated.featured),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update painting.', details: err.message });
  }
});

/**
 * Purchase a painting (Customer or Admin)
 * Rule 1: Each painting can be purchased only once.
 */
apiRouter.post('/paintings/:id/purchase', requireAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { shippingAddress } = req.body;

  if (!shippingAddress || !shippingAddress.trim()) {
    res.status(400).json({ error: 'Shipping address is required to place an order.', code: 'VALIDATION_ERROR' });
    return;
  }

  // Execute purchase in database transaction
  db.exec('BEGIN TRANSACTION;');
  try {
    const painting = db.prepare('SELECT * FROM paintings WHERE id = ?').get(id) as any;

    if (!painting) {
      db.exec('ROLLBACK;');
      res.status(404).json({ error: 'Painting not found in inventory.', code: 'NOT_FOUND' });
      return;
    }

    // Enforce single purchase constraint
    if (painting.status === 'sold') {
      db.exec('ROLLBACK;');
      res.status(409).json({
        error: 'This original artwork has already been purchased. Each painting can only be acquired once.',
        code: 'PAINTING_ALREADY_SOLD',
      });
      return;
    }

    // Check if an active order exists
    const activeOrder = db.prepare("SELECT id FROM painting_orders WHERE painting_id = ? AND status = 'placed'").get(id);
    if (activeOrder) {
      db.exec('ROLLBACK;');
      res.status(409).json({
        error: 'An active order for this artwork already exists in processing.',
        code: 'ORDER_CONFLICT',
      });
      return;
    }

    const orderId = `ord-${Date.now()}`;
    const now = new Date().toISOString();

    // Insert order
    db.prepare(`
      INSERT INTO painting_orders (id, painting_id, customer_id, shipping_address, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'placed', ?, ?)
    `).run(orderId, id, req.user!.id, shippingAddress.trim(), now, now);

    // Update painting to sold
    db.prepare(`
      UPDATE paintings SET status = 'sold', updated_at = ? WHERE id = ?
    `).run(now, id);

    db.exec('COMMIT;');

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        paintingId: painting.id,
        paintingTitle: painting.title,
        paintingPrice: painting.price,
        paintingImageUrl: painting.image_url,
        customerId: req.user!.id,
        customerName: req.user!.name,
        customerEmail: req.user!.email,
        orderDate: now,
        status: 'placed',
        shippingAddress: shippingAddress.trim(),
      },
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Purchase transaction failure:', err);
    res.status(500).json({ error: 'Transaction failed during artwork purchase.', details: err.message });
  }
});

/**
 * Get Painting Orders (Role-filtered)
 */
apiRouter.get('/orders', requireAuth, (req: Request, res: Response): void => {
  const isAdmin = req.user!.role === 'admin' || (req.user!.role as any) === 'studio';

  const query = isAdmin
    ? `
      SELECT o.*, p.title as painting_title, p.price as painting_price, p.image_url as painting_image_url,
             u.name as customer_name, u.email as customer_email
      FROM painting_orders o
      JOIN paintings p ON o.painting_id = p.id
      JOIN users u ON o.customer_id = u.id
      ORDER BY o.created_at DESC
    `
    : `
      SELECT o.*, p.title as painting_title, p.price as painting_price, p.image_url as painting_image_url,
             u.name as customer_name, u.email as customer_email
      FROM painting_orders o
      JOIN paintings p ON o.painting_id = p.id
      JOIN users u ON o.customer_id = u.id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `;

  const rows = isAdmin ? (db.prepare(query).all() as any[]) : (db.prepare(query).all(req.user!.id) as any[]);

  const orders = rows.map((r) => ({
    id: r.id,
    paintingId: r.painting_id,
    paintingTitle: r.painting_title,
    paintingPrice: r.painting_price,
    paintingImageUrl: r.painting_image_url,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    orderDate: r.created_at,
    status: r.status,
    shippingAddress: r.shipping_address,
  }));

  res.json({ orders });
});

/**
 * Cancel a painting order
 * Rule 2: Customers can cancel their own orders, making the painting available again.
 * Security: Customers accessing other customers' orders receive 404 (not 403).
 */
apiRouter.post('/orders/:id/cancel', requireAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const isAdmin = req.user!.role === 'admin' || (req.user!.role as any) === 'studio';

  const order = db.prepare('SELECT * FROM painting_orders WHERE id = ?').get(id) as any;
  if (!order) {
    res.status(404).json({ error: 'Order not found.', code: 'NOT_FOUND' });
    return;
  }

  // Cross-customer access isolation: must return 404 per assignment specification!
  if (!isAdmin && order.customer_id !== req.user!.id) {
    res.status(404).json({ error: 'Order not found.', code: 'NOT_FOUND' });
    return;
  }

  if (order.status === 'cancelled') {
    res.status(400).json({ error: 'This order is already cancelled.', code: 'ALREADY_CANCELLED' });
    return;
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    const now = new Date().toISOString();

    // 1. Mark order cancelled
    db.prepare("UPDATE painting_orders SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now, id);

    // 2. Return painting to available status
    db.prepare("UPDATE paintings SET status = 'available', updated_at = ? WHERE id = ?").run(now, order.painting_id);

    db.exec('COMMIT;');
    res.json({ success: true, message: 'Order successfully cancelled. The artwork is now available in the gallery again.' });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: 'Failed to cancel order.', details: err.message });
  }
});

// ============================================================================
// 3. ASSIGNMENT SERVICE 2: WALL PAINTING BOOKINGS
// Rules:
// 1. Customers select date 7-90 days from today.
// 2. Wall size 10-500 sq ft.
// 3. Address provided.
// 4. Only ONE active booking allowed per date (requested or confirmed).
// 5. Studio can confirm or decline bookings.
// 6. Customers can cancel until 3 days before scheduled date.
// 7. Total price = wallSize * rate (rate: ₹150 / sq ft).
// Statuses: 'requested', 'confirmed', 'declined', 'cancelled'.
// ============================================================================

/**
 * List wall mural bookings
 */
apiRouter.get('/murals', requireAuth, (req: Request, res: Response): void => {
  const isAdmin = req.user!.role === 'admin' || (req.user!.role as any) === 'studio';

  const query = isAdmin
    ? `
      SELECT b.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM wall_bookings b
      JOIN users u ON b.customer_id = u.id
      ORDER BY b.scheduled_date ASC
    `
    : `
      SELECT b.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM wall_bookings b
      JOIN users u ON b.customer_id = u.id
      WHERE b.customer_id = ?
      ORDER BY b.scheduled_date ASC
    `;

  const rows = isAdmin ? (db.prepare(query).all() as any[]) : (db.prepare(query).all(req.user!.id) as any[]);

  const bookings = rows.map((b) => ({
    id: b.id,
    customerId: b.customer_id,
    customerName: b.customer_name,
    customerEmail: b.customer_email,
    customerPhone: b.customer_phone || undefined,
    scheduledDate: b.scheduled_date,
    wallSizeSqFt: b.wall_size_sqft,
    ratePerSqFt: b.rate_per_sqft,
    totalPrice: b.total_price,
    address: b.address,
    city: b.city,
    stateZip: b.state_zip,
    stylePreference: b.style_preference,
    notes: b.notes || undefined,
    status: b.status,
    createdAt: b.created_at,
    adminResponseNote: b.admin_response_note || undefined,
  }));

  res.json({ bookings });
});

/**
 * Create wall painting booking
 */
apiRouter.post('/murals', requireAuth, (req: Request, res: Response): void => {
  try {
    const { scheduledDate, wallSizeSqFt, address, city, stateZip, stylePreference, notes } = req.body;

    // Rule 1: Scheduled date 7-90 days from today
    if (!scheduledDate) {
      res.status(400).json({ error: 'Scheduled date is required.', code: 'VALIDATION_ERROR' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingDate = new Date(scheduledDate + 'T00:00:00');
    if (isNaN(bookingDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.', code: 'INVALID_DATE' });
      return;
    }

    const diffDays = Math.ceil((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7 || diffDays > 90) {
      res.status(400).json({
        error: 'Mural bookings must be scheduled between 7 and 90 days from today.',
        code: 'DATE_OUT_OF_RANGE',
      });
      return;
    }

    // Rule 2: Wall size 10 to 500 sq ft
    const size = Number(wallSizeSqFt);
    if (!size || size < 10 || size > 500) {
      res.status(400).json({
        error: 'Wall size must be between 10 and 500 square feet.',
        code: 'SIZE_OUT_OF_RANGE',
      });
      return;
    }

    // Rule 3: Address provided
    if (!address?.trim() || !city?.trim() || !stateZip?.trim()) {
      res.status(400).json({
        error: 'Complete street address, city, and state/ZIP code are required.',
        code: 'ADDRESS_REQUIRED',
      });
      return;
    }

    // Rule 4: Only ONE active booking allowed per date
    const existingActive = db.prepare(`
      SELECT id FROM wall_bookings 
      WHERE scheduled_date = ? AND status IN ('requested', 'confirmed')
    `).get(scheduledDate);

    if (existingActive) {
      res.status(409).json({
        error: `The studio already has an active mural booking scheduled on ${scheduledDate}. Only one active booking is allowed per date.`,
        code: 'DATE_ALREADY_BOOKED',
      });
      return;
    }

    // Fetch verified rate from studio settings
    const rateRow = db.prepare("SELECT value FROM studio_settings WHERE key = 'wall_mural_rate_per_sqft'").get() as any;
    const rate = rateRow ? Number(rateRow.value) : 150.0;
    const totalPrice = size * rate;

    const id = `mural-${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO wall_bookings (
        id, customer_id, scheduled_date, wall_size_sqft, rate_per_sqft, total_price,
        address, city, state_zip, style_preference, notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested', ?, ?)
    `).run(
      id,
      req.user!.id,
      scheduledDate,
      size,
      rate,
      totalPrice,
      address.trim(),
      city.trim(),
      stateZip.trim(),
      stylePreference?.trim() || 'Folk Art Traditional',
      notes?.trim() || null,
      now,
      now
    );

    const created = db.prepare(`
      SELECT b.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM wall_bookings b
      JOIN users u ON b.customer_id = u.id
      WHERE b.id = ?
    `).get(id) as any;

    res.status(201).json({
      booking: {
        id: created.id,
        customerId: created.customer_id,
        customerName: created.customer_name,
        customerEmail: created.customer_email,
        customerPhone: created.customer_phone || undefined,
        scheduledDate: created.scheduled_date,
        wallSizeSqFt: created.wall_size_sqft,
        ratePerSqFt: created.rate_per_sqft,
        totalPrice: created.total_price,
        address: created.address,
        city: created.city,
        stateZip: created.state_zip,
        stylePreference: created.style_preference,
        notes: created.notes || undefined,
        status: created.status,
        createdAt: created.created_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create mural booking.', details: err.message });
  }
});

/**
 * Cancel wall booking
 * Rule 6: Customers can cancel until three days before the scheduled date.
 * Security: Cross-customer access returns 404.
 */
apiRouter.post('/murals/:id/cancel', requireAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const isAdmin = req.user!.role === 'admin' || (req.user!.role as any) === 'studio';

  const booking = db.prepare('SELECT * FROM wall_bookings WHERE id = ?').get(id) as any;
  if (!booking) {
    res.status(404).json({ error: 'Mural booking not found.', code: 'NOT_FOUND' });
    return;
  }

  // Cross-customer access isolation: return 404
  if (!isAdmin && booking.customer_id !== req.user!.id) {
    res.status(404).json({ error: 'Mural booking not found.', code: 'NOT_FOUND' });
    return;
  }

  if (booking.status === 'cancelled') {
    res.status(400).json({ error: 'Booking is already cancelled.', code: 'ALREADY_CANCELLED' });
    return;
  }

  // Rule 6: 3-day cutoff window
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = new Date(booking.scheduled_date + 'T00:00:00');
  const diffDays = Math.ceil((scheduled.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) {
    res.status(400).json({
      error: 'Bookings cannot be cancelled within 3 days of the scheduled date.',
      code: 'CANCELLATION_DEADLINE_PASSED',
    });
    return;
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE wall_bookings SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now, id);

  res.json({ success: true, message: 'Mural booking cancelled.' });
});

/**
 * Update wall booking status (Admin only: confirm or decline)
 */
apiRouter.put('/murals/:id/status', requireAuth, requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  if (!status || !['confirmed', 'declined'].includes(status)) {
    res.status(400).json({ error: "Status must be 'confirmed' or 'declined'.", code: 'VALIDATION_ERROR' });
    return;
  }

  const booking = db.prepare('SELECT * FROM wall_bookings WHERE id = ?').get(id) as any;
  if (!booking) {
    res.status(404).json({ error: 'Booking not found.', code: 'NOT_FOUND' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE wall_bookings 
    SET status = ?, admin_response_note = ?, updated_at = ? 
    WHERE id = ?
  `).run(status, adminNote?.trim() || null, now, id);

  res.json({ success: true, status, message: `Booking marked as ${status}.` });
});

// ============================================================================
// 4. ASSIGNMENT SERVICE 3: CUSTOM POTTERY COMMISSIONS
// Rules:
// 1. Item and glaze from supplied seed data.
// 2. Quantity 1 to 12.
// 3. Required date at least 14 days away.
// 4. Studio can accept or decline requests.
// 5. Customers can edit or cancel requests only while status is 'requested'.
// Statuses: 'requested', 'accepted', 'declined', 'cancelled'.
// ============================================================================

/**
 * Get pottery catalog (Items & Glazes)
 */
apiRouter.get('/pottery/catalog', (_req: Request, res: Response): void => {
  const items = db.prepare('SELECT * FROM pottery_items ORDER BY id ASC').all() as any[];
  const glazes = db.prepare('SELECT * FROM pottery_glazes ORDER BY id ASC').all() as any[];
  const rateRow = db.prepare("SELECT value FROM studio_settings WHERE key = 'wall_mural_rate_per_sqft'").get() as any;

  res.json({
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      basePrice: i.base_price,
      dimensions: i.dimensions,
      imageUrl: i.image_url,
    })),
    glazes: glazes.map((g) => ({
      id: g.id,
      name: g.name,
      colorHex: g.color_hex,
      finish: g.finish,
      description: g.description,
    })),
    wallMuralRate: rateRow ? Number(rateRow.value) : 150.0,
  });
});

/**
 * List pottery requests
 */
apiRouter.get('/pottery', requireAuth, (req: Request, res: Response): void => {
  const isAdmin = req.user!.role === 'admin' || (req.user!.role as any) === 'studio';

  const query = isAdmin
    ? `
      SELECT r.*, i.name as item_name, g.name as glaze_name,
             u.name as customer_name, u.email as customer_email
      FROM pottery_requests r
      JOIN pottery_items i ON r.item_id = i.id
      JOIN pottery_glazes g ON r.glaze_id = g.id
      JOIN users u ON r.customer_id = u.id
      ORDER BY r.created_at DESC
    `
    : `
      SELECT r.*, i.name as item_name, g.name as glaze_name,
             u.name as customer_name, u.email as customer_email
      FROM pottery_requests r
      JOIN pottery_items i ON r.item_id = i.id
      JOIN pottery_glazes g ON r.glaze_id = g.id
      JOIN users u ON r.customer_id = u.id
      WHERE r.customer_id = ?
      ORDER BY r.created_at DESC
    `;

  const rows = isAdmin ? (db.prepare(query).all() as any[]) : (db.prepare(query).all(req.user!.id) as any[]);

  const requests = rows.map((r) => ({
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    itemId: r.item_id,
    itemName: r.item_name,
    glazeId: r.glaze_id,
    glazeName: r.glaze_name,
    quantity: r.quantity,
    estimatedPrice: r.estimated_price,
    requiredDate: r.required_date,
    specialNotes: r.special_notes || undefined,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    adminResponseNote: r.admin_response_note || undefined,
  }));

  res.json({ requests });
});

/**
 * Create custom pottery request
 */
apiRouter.post('/pottery', requireAuth, (req: Request, res: Response): void => {
  try {
    const { itemId, glazeId, quantity, requiredDate, specialNotes } = req.body;

    // Rule 2: Quantity 1 to 12
    const qty = Number(quantity);
    if (!qty || qty < 1 || qty > 12) {
      res.status(400).json({
        error: 'Quantity must be between 1 and 12 pieces.',
        code: 'QUANTITY_OUT_OF_RANGE',
      });
      return;
    }

    // Rule 3: Required date at least 14 days away
    if (!requiredDate) {
      res.status(400).json({ error: 'Required date is required.', code: 'VALIDATION_ERROR' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(requiredDate + 'T00:00:00');
    if (isNaN(targetDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.', code: 'INVALID_DATE' });
      return;
    }

    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 14) {
      res.status(400).json({
        error: 'Custom pottery requests require at least 14 days curing and kiln turnaround time.',
        code: 'DATE_UNDER_14_DAYS',
      });
      return;
    }

    // Rule 1: Item and glaze from supplied seed data
    const item = db.prepare('SELECT * FROM pottery_items WHERE id = ?').get(itemId) as any;
    const glaze = db.prepare('SELECT * FROM pottery_glazes WHERE id = ?').get(glazeId) as any;

    if (!item || !glaze) {
      res.status(400).json({
        error: 'Selected pottery item or glaze is not found in the studio catalog.',
        code: 'INVALID_SPECIFICATION',
      });
      return;
    }

    const estimatedPrice = item.base_price * qty;
    const id = `pot-req-${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO pottery_requests (
        id, customer_id, item_id, glaze_id, quantity, estimated_price,
        required_date, special_notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'requested', ?, ?)
    `).run(id, req.user!.id, item.id, glaze.id, qty, estimatedPrice, requiredDate, specialNotes?.trim() || null, now, now);

    res.status(201).json({
      request: {
        id,
        customerId: req.user!.id,
        customerName: req.user!.name,
        customerEmail: req.user!.email,
        itemId: item.id,
        itemName: item.name,
        glazeId: glaze.id,
        glazeName: glaze.name,
        quantity: qty,
        estimatedPrice,
        requiredDate,
        specialNotes: specialNotes?.trim() || undefined,
        status: 'requested',
        createdAt: now,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit pottery request.', details: err.message });
  }
});

/**
 * Edit custom pottery request
 * Rule 5: Customers can edit or cancel requests only while status is 'requested'.
 * Security: Cross-customer access returns 404.
 */
apiRouter.put('/pottery/:id', requireAuth, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const isAdmin = req.user!.role === 'admin' || (req.user!.role as any) === 'studio';

    const existing = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Pottery request not found.', code: 'NOT_FOUND' });
      return;
    }

    // Isolation check: 404 for cross-customer
    if (!isAdmin && existing.customer_id !== req.user!.id) {
      res.status(404).json({ error: 'Pottery request not found.', code: 'NOT_FOUND' });
      return;
    }

    // Rule 5: Lock edit if status !== 'requested'
    if (existing.status !== 'requested') {
      res.status(400).json({
        error: `Cannot edit request because it has already been processed with status "${existing.status}". Requests can only be edited while in "requested" status.`,
        code: 'REQUEST_STATUS_LOCKED',
      });
      return;
    }

    const { itemId, glazeId, quantity, requiredDate, specialNotes } = req.body;

    const qty = Number(quantity);
    if (!qty || qty < 1 || qty > 12) {
      res.status(400).json({ error: 'Quantity must be between 1 and 12 pieces.', code: 'QUANTITY_OUT_OF_RANGE' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(requiredDate + 'T00:00:00');
    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 14) {
      res.status(400).json({ error: 'Required date must be at least 14 days in advance.', code: 'DATE_UNDER_14_DAYS' });
      return;
    }

    const item = db.prepare('SELECT * FROM pottery_items WHERE id = ?').get(itemId) as any;
    const glaze = db.prepare('SELECT * FROM pottery_glazes WHERE id = ?').get(glazeId) as any;

    if (!item || !glaze) {
      res.status(400).json({ error: 'Invalid pottery item or glaze selection.', code: 'INVALID_SPECIFICATION' });
      return;
    }

    const estimatedPrice = item.base_price * qty;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE pottery_requests SET
        item_id = ?,
        glaze_id = ?,
        quantity = ?,
        estimated_price = ?,
        required_date = ?,
        special_notes = ?,
        updated_at = ?
      WHERE id = ?
    `).run(item.id, glaze.id, qty, estimatedPrice, requiredDate, specialNotes?.trim() || null, now, id);

    res.json({
      request: {
        id,
        customerId: existing.customer_id,
        itemId: item.id,
        itemName: item.name,
        glazeId: glaze.id,
        glazeName: glaze.name,
        quantity: qty,
        estimatedPrice,
        requiredDate,
        specialNotes: specialNotes?.trim() || undefined,
        status: existing.status,
        updatedAt: now,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update pottery request.', details: err.message });
  }
});

/**
 * Cancel custom pottery request
 * Rule 5: Customers can edit or cancel requests only while status is 'requested'.
 * Security: Cross-customer access returns 404.
 */
apiRouter.post('/pottery/:id/cancel', requireAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const isAdmin = req.user!.role === 'admin' || (req.user!.role as any) === 'studio';

  const existing = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Pottery request not found.', code: 'NOT_FOUND' });
    return;
  }

  // Cross-customer access returns 404
  if (!isAdmin && existing.customer_id !== req.user!.id) {
    res.status(404).json({ error: 'Pottery request not found.', code: 'NOT_FOUND' });
    return;
  }

  // Rule 5: Cancel allowed ONLY in 'requested' status
  if (existing.status !== 'requested') {
    res.status(400).json({
      error: `Cannot cancel request because it has already been processed with status "${existing.status}". Requests can only be cancelled while in "requested" status.`,
      code: 'REQUEST_STATUS_LOCKED',
    });
    return;
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE pottery_requests SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now, id);

  res.json({ success: true, message: 'Pottery commission request cancelled.' });
});

/**
 * Update pottery request status (Admin only: accept or decline)
 */
apiRouter.put('/pottery/:id/status', requireAuth, requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  if (!status || !['accepted', 'declined'].includes(status)) {
    res.status(400).json({ error: "Status must be 'accepted' or 'declined'.", code: 'VALIDATION_ERROR' });
    return;
  }

  const existing = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Pottery request not found.', code: 'NOT_FOUND' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE pottery_requests 
    SET status = ?, admin_response_note = ?, updated_at = ? 
    WHERE id = ?
  `).run(status, adminNote?.trim() || null, now, id);

  res.json({ success: true, status, message: `Pottery commission marked as ${status}.` });
});

// ============================================================================
// 5. SEED MANAGEMENT & AUDIT UTILITIES
// ============================================================================

/**
 * Seed data stats & audit endpoint
 */
apiRouter.get('/seed/status', (_req: Request, res: Response): void => {
  const paintingCount = (db.prepare('SELECT COUNT(*) as c FROM paintings').get() as any).c;
  const availablePaintings = (db.prepare("SELECT COUNT(*) as c FROM paintings WHERE status = 'available'").get() as any).c;
  const soldPaintings = (db.prepare("SELECT COUNT(*) as c FROM paintings WHERE status = 'sold'").get() as any).c;
  const potteryItemsCount = (db.prepare('SELECT COUNT(*) as c FROM pottery_items').get() as any).c;
  const glazesCount = (db.prepare('SELECT COUNT(*) as c FROM pottery_glazes').get() as any).c;
  const usersCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const ordersCount = (db.prepare('SELECT COUNT(*) as c FROM painting_orders').get() as any).c;
  const muralsCount = (db.prepare('SELECT COUNT(*) as c FROM wall_bookings').get() as any).c;
  const potteryRequestsCount = (db.prepare('SELECT COUNT(*) as c FROM pottery_requests').get() as any).c;
  const rateRow = db.prepare("SELECT value FROM studio_settings WHERE key = 'wall_mural_rate_per_sqft'").get() as any;

  res.json({
    database: 'SQLite (node:sqlite)',
    dbPath: 'data/artstudio.db',
    stats: {
      totalPaintings: paintingCount,
      availablePaintings,
      soldPaintings,
      potteryItemsCount,
      glazesCount,
      muralRate: rateRow ? Number(rateRow.value) : 150.0,
      usersCount,
      paintingOrdersCount: ordersCount,
      wallMuralsCount: muralsCount,
      potteryRequestsCount,
    },
  });
});

/**
 * Reset / Re-run seed importer (Admin only)
 */
apiRouter.post('/admin/reset-seed', requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await runSeed();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset seed data.', details: err.message });
  }
});
