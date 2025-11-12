import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Package,
  Tag,
  Newspaper,
  ShoppingCart,
  BarChart3,
  LogOut,
  Coffee,
  GlassWater,
  Hamburger,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalDrinks: 0,
    totalCategories: 0,
    totalDrinkCategories: 0,
    totalRevenue: 0,
  });
  const router = useRouter();
  const { logout, adminUser } = useAdminAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // إحصائيات الطلبات
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // إحصائيات المنتجات
      const { count: productsCount } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true });

      // إحصائيات المشروبات
      const { count: drinksCount } = await supabase
        .from('drinks')
        .select('*', { count: 'exact', head: true });

      // إحصائيات فئات الطعام
      const { count: categoriesCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      // إحصائيات فئات المشروبات
      const { count: drinkCategoriesCount } = await supabase
        .from('drink_categories')
        .select('*', { count: 'exact', head: true });

      // إجمالي الإيرادات
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      setStats({
        totalOrders: ordersCount || 0,
        totalProducts: productsCount || 0,
        totalDrinks: drinksCount || 0,
        totalCategories: categoriesCount || 0,
        totalDrinkCategories: drinkCategoriesCount || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/admin/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    // قسم الطعام
    {
      title: 'إدارة المنتجات',
      icon: Package,
      screen: '/admin/products',
      color: '#FF9500',
      category: 'food'
    },
    {
      title: 'إدارة فئات الطعام',
      icon: Hamburger,
      screen: '/admin/categories',
      color: '#34C759',
      category: 'food'
    },
    
    // قسم المشروبات
    {
      title: 'إدارة المشروبات',
      icon: Coffee,
      screen: '/admin/drinks',
      color: '#007AFF',
      category: 'drinks'
    },
    {
      title: 'إدارة فئات المشروبات',
      icon: GlassWater,
      screen: '/admin/drink-categories',
      color: '#5856D6',
      category: 'drinks'
    },
    
    // قسم عام
    {
      title: 'إدارة العروض',
      icon: Tag,
      screen: '/admin/offers',
      color: '#FF3B30',
      category: 'general'
    },
    {
      title: 'إدارة الأخبار',
      icon: Newspaper,
      screen: '/admin/news',
      color: '#AF52DE',
      category: 'general'
    },
    {
      title: 'إدارة الطلبات',
      icon: ShoppingCart,
      screen: '/admin/orders',
      color: '#FF9500',
      category: 'general'
    },
    {
      title: 'التقارير',
      icon: BarChart3,
      screen: '/admin/reports',
      color: '#34C759',
      category: 'general'
    },
  ];

  // تجميع العناصر حسب الفئة
  const foodItems = menuItems.filter(item => item.category === 'food');
  const drinkItems = menuItems.filter(item => item.category === 'drinks');
  const generalItems = menuItems.filter(item => item.category === 'general');

  const renderMenuSection = (title: string, items: any[], delay: number) => (
    <Animated.View 
      entering={FadeInUp.delay(delay).duration(600)}
      style={styles.menuSection}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuGrid}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.screen as any)}
          >
            <LinearGradient
              colors={[item.color, `${item.color}DD`]}
              style={styles.menuIcon}
            >
              <item.icon size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF9500', '#FFCC00']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <Text style={styles.headerTitle}>لوحة التحكم</Text>
            <Text style={styles.headerSubtitle}>
              مرحباً، {adminUser?.name_ar}
            </Text>
          </Animated.View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* الإحصائيات */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.statsSection}
        >
          <Text style={styles.sectionTitle}>الإحصائيات</Text>
          <View style={styles.statsGrid}>
            {/* الطلبات */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FF9500', '#FFCC00']}
                style={styles.statGradient}
              >
                <ShoppingCart size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>الطلبات</Text>
            </View>

            {/* المنتجات */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#34C759', '#30D158']}
                style={styles.statGradient}
              >
                <Package size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>{stats.totalProducts}</Text>
              <Text style={styles.statLabel}>المنتجات</Text>
            </View>

            {/* المشروبات */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#007AFF', '#0056CC']}
                style={styles.statGradient}
              >
                <Coffee size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>{stats.totalDrinks}</Text>
              <Text style={styles.statLabel}>المشروبات</Text>
            </View>

            {/* فئات الطعام */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#AF52DE', '#FF2D55']}
                style={styles.statGradient}
              >
                <Hamburger size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>{stats.totalCategories}</Text>
              <Text style={styles.statLabel}>فئات الطعام</Text>
            </View>

            {/* فئات المشروبات */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#5856D6', '#7B61FF']}
                style={styles.statGradient}
              >
                <GlassWater size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>{stats.totalDrinkCategories}</Text>
              <Text style={styles.statLabel}>فئات المشروبات</Text>
            </View>

            {/* الإيرادات */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FF6B00', '#FF9500']}
                style={styles.statGradient}
              >
                <BarChart3 size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>
                {stats.totalRevenue.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>الإيرادات (ج.م)</Text>
            </View>
          </View>
        </Animated.View>

        {/* قسم الطعام */}
        {renderMenuSection('إدارة الطعام', foodItems, 400)}

        {/* قسم المشروبات */}
        {renderMenuSection('إدارة المشروبات', drinkItems, 500)}

        {/* قسم الإدارة العامة */}
        {renderMenuSection('الإدارة العامة', generalItems, 600)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'GraphicSchool-Regular',
    textAlign: 'left',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginTop: 4,
    textAlign: 'left',
  },
  logoutButton: {
    padding: 8,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
    lineHeight: 16,
  },
  menuSection: {
    marginBottom: 25,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
    lineHeight: 18,
  },
});