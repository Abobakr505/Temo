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
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalCategories: 0,
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

      // إحصائيات الفئات
      const { count: categoriesCount } = await supabase
        .from('categories')
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
        totalCategories: categoriesCount || 0,
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
    {
      title: 'إدارة المنتجات',
      icon: Package,
      screen: '/admin/products',
      color: '#FF9500',
    },
    {
      title: 'إدارة الفئات',
      icon: Tag,
      screen: '/admin/categories',
      color: '#34C759',
    },
    {
      title: 'إدارة العروض',
      icon: Tag,
      screen: '/admin/offers',
      color: '#FF3B30',
    },
    {
      title: 'إدارة الأخبار',
      icon: Newspaper,
      screen: '/admin/news',
      color: '#007AFF',
    },
    {
      title: 'إدارة الطلبات',
      icon: ShoppingCart,
      screen: '/admin/orders',
      color: '#5856D6',
    },
    {
      title: 'التقارير',
      icon: BarChart3,
      screen: '/admin/reports',
      color: '#AF52DE',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF9500', '#FF6B00']}
        style={styles.header}
      >
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
          <Text style={styles.headerSubtitle}>
            مرحباً، {adminUser?.name_ar}
          </Text>
        </Animated.View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* الإحصائيات */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.statsSection}
        >
          <Text style={styles.sectionTitle}>الإحصائيات</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FF9500', '#FF6B00']}
                style={styles.statGradient}
              >
                <ShoppingCart size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>الطلبات</Text>
            </View>

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

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#007AFF', '#5856D6']}
                style={styles.statGradient}
              >
                <Tag size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>{stats.totalCategories}</Text>
              <Text style={styles.statLabel}>الفئات</Text>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#AF52DE', '#FF2D55']}
                style={styles.statGradient}
              >
                <BarChart3 size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>
                {stats.totalRevenue.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>الإيرادات (ج.م)</Text>
            </View>
          </View>
        </Animated.View>

        {/* القائمة الرئيسية */}
        <Animated.View 
          entering={FadeInUp.delay(400).duration(600)}
          style={styles.menuSection}
        >
          <Text style={styles.sectionTitle}>الإدارة</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'GraphicSchool-Regular',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
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
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
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
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
  },
});