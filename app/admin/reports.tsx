import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Calendar,
  Download,
  PieChart,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 400; 
type ReportData = {
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
};

export default function ReportsScreen() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const router = useRouter();

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      // الإيرادات الإجمالية
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered');

      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      // إجمالي الطلبات
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // العملاء الفريدين
      const { data: customersData } = await supabase
        .from('orders')
        .select('customer_phone')
        .not('customer_phone', 'is', null);

      const uniqueCustomers = new Set(customersData?.map(order => order.customer_phone)).size;

      // متوسط قيمة الطلب
      const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

      // المنتجات الأكثر مبيعاً
      const { data: popularProducts } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          menu_items (
            name_ar
          )
        `)
        .limit(5);

      const productStats = popularProducts?.reduce((acc: any, item) => {
        const productName = item.menu_items?.name_ar || 'منتج غير معروف';
        if (!acc[productName]) {
          acc[productName] = {
            name_ar: productName,
            total_quantity: 0,
            total_revenue: 0,
          };
        }
        acc[productName].total_quantity += item.quantity;
        acc[productName].total_revenue += item.quantity * item.price;
        return acc;
      }, {});

      // الطلبات حسب الحالة
      const { data: statusData } = await supabase
        .from('orders')
        .select('status');

      const statusCount = statusData?.reduce((acc: any, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const ordersByStatus = Object.entries(statusCount || {}).map(([status, count]) => ({
        status,
        count: count as number,
      }));

      // إحصائيات الفئات
      const { data: categoriesData } = await supabase
        .from('categories')
        .select(`
          name_ar,
          menu_items (
            id
          )
        `);

      const categoryStats = categoriesData?.map(category => ({
        category_name: category.name_ar,
        product_count: category.menu_items?.length || 0,
        total_orders: Math.floor(Math.random() * 50), // سيتم استبدالها ببيانات حقيقية
      })) || [];

      setReportData({
        totalRevenue,
        totalOrders: totalOrders || 0,
        totalCustomers: uniqueCustomers,
        averageOrderValue,
        popularProducts: Object.values(productStats || {}),
        ordersByStatus,
        revenueByDay: generateSampleRevenueData(),
        categoryStats,
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleRevenueData = () => {
    const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    return days.map(day => ({
      day,
      revenue: Math.floor(Math.random() * 1000) + 500,
    }));
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'confirmed': 'تم التأكيد',
      'preparing': 'قيد التحضير',
      'ready': 'جاهز للتسليم',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'pending': '#FF9500',
      'confirmed': '#007AFF',
      'preparing': '#5856D6',
      'ready': '#34C759',
      'delivered': '#30D158',
      'cancelled': '#FF3B30',
    };
    return colorMap[status] || '#8E8E93';
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = '#FF9500',
    format = 'number'
  }: {
    title: string;
    value: number;
    icon: any;
    color?: string;
    format?: 'number' | 'currency';
  }) => (
    <Animated.View 
      entering={FadeInDown.duration(600)}
      style={styles.statCard}
    >
      <LinearGradient
        colors={[color, `${color}DD`]}
        style={styles.statGradient}
      >
        <Icon size={24} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>
          {format === 'currency' ? `${value.toFixed(2)} ج.م` : value.toLocaleString()}
        </Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
        <Text style={styles.loadingText}>جاري تحميل التقارير...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF9500', '#FFCC00']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>التقارير والإحصائيات</Text>
          <TouchableOpacity style={styles.downloadButton}>
            <Download size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* فترة التقرير */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}>
                {period === 'week' ? 'أسبوع' : period === 'month' ? 'شهر' : 'سنة'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* البطاقات الإحصائية */}
        <View style={styles.statsGrid}>
          <StatCard
            title="إجمالي الإيرادات"
            value={reportData?.totalRevenue || 0}
            icon={DollarSign}
            color="#34C759"
            format="currency"
          />
          <StatCard
            title="إجمالي الطلبات"
            value={reportData?.totalOrders || 0}
            icon={ShoppingCart}
            color="#007AFF"
          />
          <StatCard
            title="عدد العملاء"
            value={reportData?.totalCustomers || 0}
            icon={Users}
            color="#5856D6"
          />
          <StatCard
            title="متوسط قيمة الطلب"
            value={reportData?.averageOrderValue || 0}
            icon={TrendingUp}
            color="#FF9500"
            format="currency"
          />
        </View>

        {/* المنتجات الأكثر مبيعاً */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <BarChart3 size={24} color="#FF9500" />
            <Text style={styles.sectionTitle}>المنتجات الأكثر مبيعاً</Text>
          </View>
          <View style={styles.productsList}>
            {reportData?.popularProducts.map((product, index) => (
              <View key={index} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name_ar}</Text>
                  <Text style={styles.productSales}>
                    {product.total_quantity} مبيع
                  </Text>
                </View>
                <Text style={styles.productRevenue}>
                  {product.total_revenue.toFixed(2)} ج.م
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* الطلبات حسب الحالة */}
        <Animated.View 
          entering={FadeInUp.delay(400).duration(600)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <PieChart size={24} color="#FF9500" />
            <Text style={styles.sectionTitle}>الطلبات حسب الحالة</Text>
          </View>
          <View style={styles.statusGrid}>
            {reportData?.ordersByStatus.map((status, index) => (
              <View key={index} style={styles.statusItem}>
                <View style={styles.statusHeader}>
                  <View 
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(status.status) }
                    ]} 
                  />
                  <Text style={styles.statusName}>
                    {getStatusText(status.status)}
                  </Text>
                </View>
                <Text style={styles.statusCount}>{status.count}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* الإيرادات اليومية */}
        <Animated.View 
          entering={FadeInUp.delay(600).duration(600)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color="#FF9500" />
            <Text style={styles.sectionTitle}>الإيرادات اليومية</Text>
          </View>
          <View style={styles.revenueChart}>
            {reportData?.revenueByDay.map((day, index) => (
              <View key={index} style={styles.revenueBarContainer}>
                <View style={styles.revenueBarWrapper}>
                  <View 
                    style={[
                      styles.revenueBar,
                      { 
                        height: (day.revenue / 1500) * 100,
                        backgroundColor: day.revenue > 1000 ? '#34C759' : '#FF9500'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.revenueDay}>{day.day}</Text>
                <Text style={styles.revenueValue}>{day.revenue} ج.م</Text>
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'GraphicSchool-Regular',
  },
  downloadButton: {
    padding: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  periodButtonTextActive: {
    color: '#FF9500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  productsList: {
    gap: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginBottom: 2,
  },
  productSales: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: isSmallScreen ? 'center' : 'space-between',
  },
  statusItem: {
    width: (width - 80) / 2,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  statusCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  revenueChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingVertical: 20,
  },
  revenueBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  revenueBarWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  revenueBar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  revenueDay: {
    fontSize: 10,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (width - 80) / 2,
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryStat: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  performanceSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  performanceItem: {
    width: (width - 80) / 2,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginBottom: 4,
    textAlign: 'center',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});