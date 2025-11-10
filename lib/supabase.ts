import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

export type Category = {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  image_url: string;
  display_order: number;
  created_at: string;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
};

export type News = {
  id: string;
  title: string;
  title_ar: string;
  content: string;
  content_ar: string;
  image_url: string;
  published_date: string;
  is_active: boolean;
  created_at: string;
};

export type Offer = {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  discount_percentage: number;
  image_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  notes: string;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  created_at: string;
};

export type CartItem = MenuItem & {
  quantity: number;
};
