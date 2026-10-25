import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db';

interface SeedDataJSON {
  currency: string;
  paintings: Array<{
    id: string;
    title: string;
    artist: string;
    description: string;
    price: number;
    imageUrl: string;
    status: 'available' | 'sold';
  }>;
  potteryItems: Array<{
    id: string;
    name: string;
  }>;
  glazes: Array<{
    id: string;
    name: string;
  }>;
  mural: {
    ratePerSqFt: number;
  };
  studioAccount: {
    email: string;
    password: string;
    role: string;
  };
}

// Fallback metadata enhancements for display richness
const GLAZE_COLORS: Record<string, { colorHex: string; finish: string; description: string }> = {
  'g-01': { colorHex: '#C0392B', finish: 'Vermilion Mineral Wash', description: 'Traditional auspicious red pigment wash derived from mineral cinnabar and clay slip.' },
  'g-02': { colorHex: '#F39C12', finish: 'Warm Turmeric Lustre', description: 'Radiant saffron and turmeric ochre pooling with golden undertones.' },
  'g-03': { colorHex: '#27AE60', finish: 'Earthy Henna Olive', description: 'Earthy sage and deep henna leaf green with soft crystalline variegation.' },
  'g-04': { colorHex: '#1F4E79', finish: 'Deep Natural Indigo', description: 'Rich royal blue made from organic indigo dyes and ash flux, evoking monsoon evening skies.' },
  'g-05': { colorHex: '#D8C7A5', finish: 'Silky Sandalwood Ash', description: 'Warm creamy bisque ground resembling fragrant crushed sandalwood paste.' },
  'g-06': { colorHex: '#2C3E50', finish: 'Matte Kiln Charcoal', description: 'High-fire smoked carbon black with a velvety smooth tactile finish.' },
};

const POTTERY_DEFAULTS: Record<string, { basePrice: number; dimensions: string; imageUrl: string; description: string }> = {
  'i-01': {
    basePrice: 150,
    dimensions: '3.5" H x 3" Dia',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    description: 'Traditional unglazed or glazed earthenware cup. Fluted conical base for tea, chai, and dessert.',
  },
  'i-02': {
    basePrice: 650,
    dimensions: '12" H x 7" Dia',
    imageUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80',
    description: 'Long-necked terracotta water vessel with rounded body engineered for evaporative cooling.',
  },
  'i-03': {
    basePrice: 450,
    dimensions: '10" H x 11" Dia',
    imageUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80',
    description: 'Classic spherical Indian clay earthen pot with broad reinforced rim, wheel-thrown with riverbed silt.',
  },
  'i-04': {
    basePrice: 200,
    dimensions: '1.5" H x 3.5" Dia (Set of 4)',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    description: 'Handcrafted festival oil lamp set with organic petal fluting and natural wick grooves.',
  },
  'i-05': {
    basePrice: 350,
    dimensions: '8" H x 9.5" Dia',
    imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
    description: 'Heavy stoneware garden planter with integrated base drainage hole and subtle stepped rim.',
  },
};

export async function runSeed(): Promise<{
  success: boolean;
  paintingsCount: number;
  potteryItemsCount: number;
  glazesCount: number;
  muralRate: number;
  usersCount: number;
  ordersCount: number;
  message: string;
}> {
  initDatabase();

  // Find seed.json path
  const candidatePaths = [
    path.resolve(process.cwd(), 'seedData/seed.json'),
    path.resolve(process.cwd(), 'public/seedData/seed.json'),
  ];

  let seedFilePath = '';
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      seedFilePath = p;
      break;
    }
  }

  if (!seedFilePath) {
    throw new Error('Could not find seedData/seed.json in workspace.');
  }

  const rawJson = fs.readFileSync(seedFilePath, 'utf-8');
  const seedData: SeedDataJSON = JSON.parse(rawJson);

  const now = new Date().toISOString();

  // 1. Studio Settings
  const upsertSetting = db.prepare(`
    INSERT INTO studio_settings (key, value, updated_at) 
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;
  `);

  upsertSetting.run('currency', seedData.currency || 'INR', now);
  upsertSetting.run('wall_mural_rate_per_sqft', String(seedData.mural?.ratePerSqFt || 150), now);

  // 2. Users (Admin Studio Account & Demo Customer)
  const upsertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, phone, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET 
      password_hash = excluded.password_hash,
      name = excluded.name,
      role = excluded.role,
      phone = excluded.phone;
  `);

  const adminPasswordHash = await bcrypt.hash(seedData.studioAccount.password || 'Studio@123', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@123', 10);

  // Seed Studio Admin Account
  upsertUser.run(
    'usr-studio-admin',
    seedData.studioAccount.email.toLowerCase(),
    adminPasswordHash,
    'Art Studio Lead Curator',
    'admin',
    '+91 80 2345 6789',
    now
  );

  // Seed Demo Customer Account
  upsertUser.run(
    'usr-customer-saiesh',
    'saieshyeligeti123@gmail.com',
    customerPasswordHash,
    'Saiesh Yeligeti',
    'customer',
    '+91 98765 43210',
    now
  );

  // 3. Pottery Items
  const upsertItem = db.prepare(`
    INSERT INTO pottery_items (id, name, description, base_price, dimensions, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      base_price = excluded.base_price,
      dimensions = excluded.dimensions,
      image_url = excluded.image_url;
  `);

  for (const item of seedData.potteryItems) {
    const meta = POTTERY_DEFAULTS[item.id] || {
      basePrice: 250,
      dimensions: 'Standard Studio Craft',
      imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      description: 'Handcrafted ceramic ware from local riverbed clay.',
    };

    upsertItem.run(item.id, item.name, meta.description, meta.basePrice, meta.dimensions, meta.imageUrl);
  }

  // 4. Glazes
  const upsertGlaze = db.prepare(`
    INSERT INTO pottery_glazes (id, name, color_hex, finish, description)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      color_hex = excluded.color_hex,
      finish = excluded.finish,
      description = excluded.description;
  `);

  for (const glaze of seedData.glazes) {
    const meta = GLAZE_COLORS[glaze.id] || {
      colorHex: '#888888',
      finish: 'Studio Finish',
      description: 'Artisan mineral glaze formulation.',
    };

    upsertGlaze.run(glaze.id, glaze.name, meta.colorHex, meta.finish, meta.description);
  }

  // 5. Paintings
  const upsertPainting = db.prepare(`
    INSERT INTO paintings (id, title, artist, price, image_url, status, description, category, year, medium, dimensions, featured, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      artist = excluded.artist,
      price = excluded.price,
      image_url = excluded.image_url,
      status = excluded.status,
      description = excluded.description,
      category = excluded.category,
      year = excluded.year,
      medium = excluded.medium,
      dimensions = excluded.dimensions,
      featured = excluded.featured,
      updated_at = excluded.updated_at;
  `);

  for (const p of seedData.paintings) {
    // Normalise image path to serve via web route
    const imgUrl = p.imageUrl.startsWith('/') ? p.imageUrl : `/seedData/${p.imageUrl}`;
    
    // Extract style/medium hints from description
    let category = 'Traditional Indian Art';
    if (p.description.includes('Madhubani')) category = 'Madhubani Style';
    else if (p.description.includes('Warli')) category = 'Warli Style';
    else if (p.description.includes('Tanjore')) category = 'Tanjore Style';
    else if (p.description.includes('Pattachitra')) category = 'Pattachitra Style';
    else if (p.description.includes('Kalamkari')) category = 'Kalamkari Style';
    else if (p.description.includes('Gond')) category = 'Gond Style';
    else if (p.description.includes('Cheriyal')) category = 'Cheriyal Style';
    else if (p.description.includes('Miniature')) category = 'Rajasthani Miniature';
    else if (p.description.includes('Pichwai')) category = 'Pichwai Style';
    else if (p.description.includes('Nirmal')) category = 'Nirmal Style';
    else if (p.description.includes('Kerala mural')) category = 'Kerala Mural Style';
    else if (p.description.includes('Oil on canvas')) category = 'Oil on Canvas';

    const featured = ['p-001', 'p-003', 'p-005', 'p-008', 'p-012'].includes(p.id) ? 1 : 0;

    // Check if an active order exists in database so re-running seed does not corrupt placed orders
    const activeOrder = db.prepare("SELECT id FROM painting_orders WHERE painting_id = ? AND status = 'placed'").get(p.id);
    const finalStatus = activeOrder ? 'sold' : p.status;

    upsertPainting.run(
      p.id,
      p.title,
      p.artist,
      p.price,
      imgUrl,
      finalStatus,
      p.description,
      category,
      2025,
      p.description.split('.')[1]?.trim() || p.description,
      'Standard Studio Canvas',
      featured,
      now,
      now
    );
  }

  // 6. Ensure sold paintings from seedData have corresponding initial placed orders
  const upsertInitialOrder = db.prepare(`
    INSERT OR IGNORE INTO painting_orders (id, painting_id, customer_id, shipping_address, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `);

  const soldPaintings = seedData.paintings.filter((p) => p.status === 'sold');
  for (const sp of soldPaintings) {
    upsertInitialOrder.run(
      `ord-init-${sp.id}`,
      sp.id,
      'usr-customer-saiesh',
      'Plot 42, Jubilee Hills, Hyderabad, Telangana 500033',
      'placed',
      now,
      now
    );
  }

  // Verification counts
  const paintingCount = (db.prepare('SELECT COUNT(*) as c FROM paintings').get() as any).c;
  const potteryItemCount = (db.prepare('SELECT COUNT(*) as c FROM pottery_items').get() as any).c;
  const glazeCount = (db.prepare('SELECT COUNT(*) as c FROM pottery_glazes').get() as any).c;
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const orderCount = (db.prepare('SELECT COUNT(*) as c FROM painting_orders').get() as any).c;

  return {
    success: true,
    paintingsCount: paintingCount,
    potteryItemsCount: potteryItemCount,
    glazesCount: glazeCount,
    muralRate: seedData.mural?.ratePerSqFt || 150,
    usersCount: userCount,
    ordersCount: orderCount,
    message: `Imported ${paintingCount} paintings, ${potteryItemCount} pottery items, ${glazeCount} glazes, and ${userCount} accounts into SQLite.`,
  };
}

// Allow standalone execution: npx tsx src/server/seed.ts
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then((res) => {
      console.log('✅ Seed Import Success:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed Import Failed:', err);
      process.exit(1);
    });
}
