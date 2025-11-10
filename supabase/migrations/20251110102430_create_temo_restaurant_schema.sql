/*
  # Temo Restaurant Database Schema

  ## Overview
  This migration creates the complete database schema for the Temo restaurant app.
  
  ## New Tables
  
  ### 1. categories
  - `id` (uuid, primary key) - Unique category identifier
  - `name` (text) - Category name (e.g., "Regular Fries", "Loaded Fries")
  - `name_ar` (text) - Category name in Arabic
  - `description` (text) - Category description
  - `image_url` (text) - Category image URL
  - `display_order` (integer) - Order for displaying categories
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 2. menu_items
  - `id` (uuid, primary key) - Unique menu item identifier
  - `category_id` (uuid, foreign key) - Reference to categories table
  - `name` (text) - Item name
  - `name_ar` (text) - Item name in Arabic
  - `description` (text) - Item description
  - `description_ar` (text) - Item description in Arabic
  - `price` (numeric) - Item price
  - `image_url` (text) - Item image URL
  - `is_available` (boolean) - Availability status
  - `is_featured` (boolean) - Featured item flag
  - `display_order` (integer) - Order for displaying items
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 3. news
  - `id` (uuid, primary key) - Unique news identifier
  - `title` (text) - News title
  - `title_ar` (text) - News title in Arabic
  - `content` (text) - News content
  - `content_ar` (text) - News content in Arabic
  - `image_url` (text) - News image URL
  - `published_date` (timestamptz) - Publication date
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 4. offers
  - `id` (uuid, primary key) - Unique offer identifier
  - `title` (text) - Offer title
  - `title_ar` (text) - Offer title in Arabic
  - `description` (text) - Offer description
  - `description_ar` (text) - Offer description in Arabic
  - `discount_percentage` (numeric) - Discount percentage
  - `image_url` (text) - Offer image URL
  - `start_date` (timestamptz) - Offer start date
  - `end_date` (timestamptz) - Offer end date
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 5. orders
  - `id` (uuid, primary key) - Unique order identifier
  - `customer_name` (text) - Customer name
  - `customer_phone` (text) - Customer phone number
  - `customer_address` (text) - Delivery address
  - `total_amount` (numeric) - Total order amount
  - `status` (text) - Order status (pending, confirmed, preparing, ready, delivered)
  - `notes` (text) - Order notes
  - `created_at` (timestamptz) - Order creation timestamp
  
  ### 6. order_items
  - `id` (uuid, primary key) - Unique order item identifier
  - `order_id` (uuid, foreign key) - Reference to orders table
  - `menu_item_id` (uuid, foreign key) - Reference to menu_items table
  - `quantity` (integer) - Item quantity
  - `price` (numeric) - Item price at time of order
  - `created_at` (timestamptz) - Creation timestamp
  
  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Public read access for categories, menu_items, news, and offers
  - Authenticated access for creating orders
  - No direct updates or deletes from clients (managed through admin panel)
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text NOT NULL,
  description text DEFAULT '',
  description_ar text DEFAULT '',
  price numeric(10, 2) NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  is_available boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create news table
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ar text NOT NULL,
  content text DEFAULT '',
  content_ar text DEFAULT '',
  image_url text DEFAULT '',
  published_date timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ar text NOT NULL,
  description text DEFAULT '',
  description_ar text DEFAULT '',
  discount_percentage numeric(5, 2) DEFAULT 0,
  image_url text DEFAULT '',
  start_date timestamptz DEFAULT now(),
  end_date timestamptz DEFAULT now() + interval '30 days',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text DEFAULT '',
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for menu_items (public read)
CREATE POLICY "Anyone can view menu items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for news (public read, only active)
CREATE POLICY "Anyone can view active news"
  ON news FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- RLS Policies for offers (public read, only active)
CREATE POLICY "Anyone can view active offers"
  ON offers FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND now() BETWEEN start_date AND end_date);

-- RLS Policies for orders (anyone can create)
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies for order_items (anyone can create)
CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_featured ON menu_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Insert sample data
INSERT INTO categories (name, name_ar, description, display_order) VALUES
  ('Classic Fries', 'بطاطس كلاسيك', 'Our signature crispy fries', 1),
  ('Loaded Fries', 'بطاطس محملة', 'Topped with delicious ingredients', 2),
  ('Special Combos', 'كومبو خاص', 'Great value combo meals', 3),
  ('Drinks', 'مشروبات', 'Refreshing beverages', 4)
ON CONFLICT DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (category_id, name, name_ar, description, description_ar, price, is_available, is_featured, display_order)
SELECT 
  c.id,
  'Classic French Fries',
  'بطاطس فرنسية كلاسيك',
  'Golden crispy fries with sea salt',
  'بطاطس مقرمشة ذهبية مع ملح البحر',
  15.00,
  true,
  true,
  1
FROM categories c WHERE c.name = 'Classic Fries'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, name_ar, description, description_ar, price, is_available, is_featured, display_order)
SELECT 
  c.id,
  'Cheese Loaded Fries',
  'بطاطس بالجبنة',
  'Crispy fries topped with melted cheese',
  'بطاطس مقرمشة مع جبنة ذائبة',
  25.00,
  true,
  true,
  1
FROM categories c WHERE c.name = 'Loaded Fries'
ON CONFLICT DO NOTHING;

-- Insert sample news
INSERT INTO news (title, title_ar, content, content_ar, is_active) VALUES
  ('Grand Opening!', 'الافتتاح الكبير!', 'Welcome to Temo - the best fries in town!', 'مرحباً بكم في تيمو - أفضل بطاطس في المدينة!', true),
  ('New Menu Items', 'منتجات جديدة', 'Check out our new loaded fries collection!', 'اكتشف مجموعتنا الجديدة من البطاطس المحملة!', true)
ON CONFLICT DO NOTHING;

-- Insert sample offers
INSERT INTO offers (title, title_ar, description, description_ar, discount_percentage, is_active) VALUES
  ('Opening Special', 'عرض الافتتاح', 'Get 20% off on all orders!', 'احصل على خصم 20% على جميع الطلبات!', 20, true),
  ('Combo Deal', 'عرض الكومبو', 'Buy 2 get 1 free on selected items!', 'اشتري 2 واحصل على واحد مجاناً على منتجات مختارة!', 33, true)
ON CONFLICT DO NOTHING;