DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS store_settings;
DROP TABLE IF EXISTS orders;

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '🧸',
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  subcategory TEXT,
  age_group TEXT,
  brand TEXT DEFAULT 'Happy Toys Store',
  short_description TEXT,
  full_description TEXT,
  price_pkr REAL NOT NULL,
  sale_price_pkr REAL,
  cost_price_pkr REAL,
  stock_qty INTEGER DEFAULT 0,
  availability TEXT DEFAULT 'in_stock',
  has_variants BOOLEAN DEFAULT 0,
  main_image TEXT,
  tags TEXT,
  is_published BOOLEAN DEFAULT 1,
  is_featured BOOLEAN DEFAULT 0,
  is_new_arrival BOOLEAN DEFAULT 0,
  is_best_seller BOOLEAN DEFAULT 0,
  is_special_offer BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  variant_type TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  sku TEXT,
  price_pkr REAL NOT NULL,
  sale_price_pkr REAL,
  stock_qty INTEGER DEFAULT 0,
  available BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_main BOOLEAN DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE store_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  items_json TEXT NOT NULL,
  total_pkr REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial settings
INSERT INTO store_settings (key, value) VALUES ('store_name', 'Happy Toys Store');
INSERT INTO store_settings (key, value) VALUES ('whatsapp_number', '923000000000');
INSERT INTO store_settings (key, value) VALUES ('announcement', '🎉 Welcome to Happy Toys Store! Fast Delivery Across Pakistan | Order Directly on WhatsApp');
