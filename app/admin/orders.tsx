import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react-native';
import { supabase, Order, OrderItem } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<(Order & { order_items: (OrderItem & { menu_items: any })[] })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    loadOrders();
  }, []);
const loadOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (
          name_ar,
          price
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading orders:', error);
    Toast.show({
      type: 'error',
      text1: 'خطأ',
      text2: 'فشل في تحميل الطلبات',
      position: 'bottom',
    });
  } else {
    setOrders(data || []);
  }
};
  const filteredOrders = orders.filter(order =>
    order.customer_name.includes(searchQuery) ||
    order.customer_phone.includes(searchQuery) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
const handleStatusUpdate = async (orderId: string, newStatus: string) => {
  setIsLoading(true);
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw error;

    Toast.show({
      type: 'success',
      text1: 'تم بنجاح 🎉',
      text2: 'تم تحديث حالة الطلب بنجاح',
      position: 'bottom',
    });

    await loadOrders();
  } catch (error) {
    console.error('Update error:', error);
    Toast.show({
      type: 'error',
      text1: 'خطأ',
      text2: 'فشل في تحديث حالة الطلب',
      position: 'bottom',
    });
  } finally {
    setIsLoading(false);
  }
};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
        return '#007AFF';
      case 'preparing':
        return '#5856D6';
      case 'ready':
        return '#34C759';
      case 'delivered':
        return '#30D158';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#ffffffff" />;
      case 'confirmed':
        return <CheckCircle size={16} color="#ffffffff" />;
      case 'preparing':
        return <Clock size={16} color="#ffffffff" />;
      case 'ready':
        return <CheckCircle size={16} color="#ffffffff" />;
      case 'delivered':
        return <Truck size={16} color="#ffffffff" />;
      case 'cancelled':
        return <XCircle size={16} color="#ffffffff" />;
      default:
        return <Clock size={16} color="#ffffffff" />;
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'confirmed':
        return 'تم التأكيد';
      case 'preparing':
        return 'قيد التحضير';
      case 'ready':
        return 'جاهز للتسليم';
      case 'delivered':
        return 'تم التسليم';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };
  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };
const handleDeleteOrder = async (orderId: string) => {
  Alert.alert(
    'تأكيد الحذف',
    'هل أنت متأكد أنك تريد حذف هذا الطلب؟',
    [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            const { error } = await supabase
              .from('orders')
              .delete()
              .eq('id', orderId);

            if (error) throw error;

            Toast.show({
              type: 'success',
              text1: 'تم بنجاح 🎉',
              text2: 'تم حذف الطلب بنجاح',
              position: 'bottom',
            });

            await loadOrders();
          } catch (error) {
            console.error('Delete error:', error);
            Toast.show({
              type: 'error',
              text1: 'خطأ',
              text2: 'فشل في حذف الطلب',
              position: 'bottom',
            });
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]
  );
};

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
          <Text style={styles.headerTitle}>إدارة الطلبات</Text>
        </View>
        <View style={styles.searchContainer}>
          <Search size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث في الطلبات..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>
      <ScrollView style={styles.content}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Truck size={80} color="#E5E5EA" />
            <Text style={styles.emptyStateText}>لا توجد طلبات</Text>
          </View>
        ) : (
          filteredOrders.map((order, index) => (
            <Animated.View
              key={order.id}
              entering={FadeInUp.delay(index * 50).duration(500)}
              style={styles.orderCard}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>طلب #{order.id.slice(-8)}</Text>
                  <Text style={styles.customerName}>{order.customer_name}</Text>
                  <Text style={styles.customerPhone}>{order.customer_phone}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  {getStatusIcon(order.status)}
                  <Text style={styles.statusText}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.orderDetails}>
                <Text style={styles.orderTotal}>
                  الإجمالي: {order.total_amount.toFixed(2)} ج.م
                </Text>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString('ar-SA')}
                </Text>
              </View>
              <View style={styles.orderActions}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => viewOrderDetails(order)}
                >
                  <Eye size={16} color="#007AFF" />
                  <Text style={styles.viewButtonText}>عرض التفاصيل</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteOrder(order.id)}
                  disabled={isLoading}
                >
                  <XCircle size={16} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.statusActions}>
                  {order.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={[styles.statusButton, styles.confirmButton]}
                        onPress={() => handleStatusUpdate(order.id, 'confirmed')}
                        disabled={isLoading}
                      >
                        <Text style={styles.statusButtonText}>تأكيد</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.statusButton, styles.cancelButton]}
                        onPress={() => handleStatusUpdate(order.id, 'cancelled')}
                        disabled={isLoading}
                      >
                        <Text style={styles.statusButtonText}>إلغاء</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <TouchableOpacity
                      style={[styles.statusButton, styles.prepareButton]}
                      onPress={() => handleStatusUpdate(order.id, 'preparing')}
                      disabled={isLoading}
                    >
                      <Text style={styles.statusButtonText}>بدء التحضير</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'preparing' && (
                    <TouchableOpacity
                      style={[styles.statusButton, styles.readyButton]}
                      onPress={() => handleStatusUpdate(order.id, 'ready')}
                      disabled={isLoading}
                    >
                      <Text style={styles.statusButtonText}>جاهز</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'ready' && (
                    <TouchableOpacity
                      style={[styles.statusButton, styles.deliverButton]}
                      onPress={() => handleStatusUpdate(order.id, 'delivered')}
                      disabled={isLoading}
                    >
                      <Text style={styles.statusButtonText}>تم التسليم</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
      {/* Order Details Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <Text style={styles.modalTitle}>تفاصيل الطلب</Text>
               
                <ScrollView style={styles.orderDetailsContent}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>معلومات العميل</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>الاسم:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.customer_name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>الهاتف:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.customer_phone}</Text>
                    </View>
                    {selectedOrder.customer_address && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>العنوان:</Text>
                        <Text style={styles.detailValue}>{selectedOrder.customer_address}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>عناصر الطلب</Text>
                    {selectedOrder.order_items.map((item: any, index: number) => (
                      <View key={index} style={styles.orderItem}>
                        <Text style={styles.itemName}>
                          {item.menu_items?.name_ar || 'منتج'}
                        </Text>
                        <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                        <Text style={styles.itemPrice}>
                          {(item.price * item.quantity).toFixed(2)} ج.م
                        </Text>
                      </View>
                    ))}
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>المجموع:</Text>
                      <Text style={styles.totalAmount}>
                        {selectedOrder.total_amount.toFixed(2)} ج.م
                      </Text>
                    </View>
                  </View>
                  {selectedOrder.notes && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>ملاحظات</Text>
                      <Text style={styles.notesText}>{selectedOrder.notes}</Text>
                    </View>
                  )}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>معلومات الطلب</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>رقم الطلب:</Text>
                      <Text style={styles.detailValue}>#{selectedOrder.id.slice(-8)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>التاريخ:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedOrder.created_at).toLocaleString('ar-SA')}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>الحالة:</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                        {getStatusIcon(selectedOrder.status)}
                        <Text style={styles.statusText}>
                          {getStatusText(selectedOrder.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>إغلاق</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    color: '#FFFFFF',
    fontFamily: 'GraphicSchool-Regular',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginTop: 16,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  orderTotal: {
    fontSize: 16,
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  orderDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap:2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  deleteButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FF3B30',
  borderRadius: 8,
  paddingHorizontal: 8,
  paddingVertical: 8,
  marginLeft: 2,
},


  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  prepareButton: {
    backgroundColor: '#5856D6',
  },
  readyButton: {
    backgroundColor: '#FF9500',
  },
  deliverButton: {
    backgroundColor: '#30D158',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    color: '#1C1C1E',
    marginBottom: 20,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
  },
  orderDetailsContent: {
    maxHeight: 400,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 12,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  detailValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
    flex: 1,
    textAlign: 'right',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginHorizontal: 8,
  },
  itemPrice: {
    fontSize: 14,
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  totalLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  totalAmount: {
    fontSize: 18,
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  notesText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});