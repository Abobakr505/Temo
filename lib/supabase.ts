import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// أنواع البيانات
export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name_ar: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name_ar: string;
  description_ar?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name_ar: string;
  description_ar?: string;
  price: number;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  image_url?: string;
  ingredients_ar?: string;
  ingredients_en?: string;
  preparation_time: number;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface Offer {
  id: string;
  title_ar: string;
  description_ar?: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: string;
  title_ar: string;
  content_ar: string;
  published_date: string;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  created_at: string;
  menu_items?: MenuItem;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

// أضف هذه الأنواع إلى ملف supabase.ts
export interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  popularProducts: Array<{
    name_ar: string;
    total_quantity: number;
    total_revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  revenueByDay: Array<{
    day: string;
    revenue: number;
  }>;
  categoryStats: Array<{
    category_name: string;
    product_count: number;
    total_orders: number;
  }>;
}