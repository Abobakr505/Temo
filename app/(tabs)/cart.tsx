import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
} from 'react-native-reanimated';

export default function CartScreen() {
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalPrice } =
    useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert(
        'معلومات مفقودة',
        'يرجى إدخال اسمك ورقم هاتفك'
      );
      return;
    }

    if (cart.length === 0) {
      Alert.alert('سلة فارغة', 'يرجى إضافة عناصر إلى سلتك أولاً');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          total_amount: getTotalPrice(),
          status: 'pending',
          notes: notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      Alert.alert(
        'تم تقديم الطلب بنجاح!',
        'شكراً لطلبك. سنتصل بك قريباً.',
        [
          {
            text: 'حسناً',
            onPress: () => {
              clearCart();
              setCustomerName('');
              setCustomerPhone('');
              setCustomerAddress('');
              setNotes('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('خطأ في الطلب:', error);
      Alert.alert('خطأ', 'فشل في تقديم الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // يمكنك إضافة أي تحديث للبيانات هنا إذا لزم الأمر
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#FF9500', '#FFCC00']}
          style={styles.loadingBackground}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF9500', '#FFCC00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.headerTitle}>السلة</Text>
          {cart.length > 0 && (
            <Text style={styles.itemCount}>
              {cart.length} {cart.length === 1 ? 'عنصر' : 'عناصر'}
            </Text>
          )}
        </Animated.View>
      </LinearGradient>

      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <ShoppingBag size={80} color="#E5E5EA" strokeWidth={1.5} />
          <Text style={styles.emptyCartText}>سلتك فارغة</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => window.location.href = '/menu'}
          >
            <LinearGradient
              colors={['#FF9500', '#FF6B00']}
              style={styles.browseButtonGradient}
            >
              <Text style={styles.browseButtonText}>تصفح المنتجات</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF9500']}
              tintColor="#FF9500"
            />
          }
        >
          <View style={styles.cartItems}>
            {cart.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInRight.delay(index * 50).duration(500)}
                exiting={FadeOutLeft.duration(300)}
              >
                <View style={styles.cartItem}>
                  <View style={styles.itemImageContainer}>
                    <LinearGradient
                      colors={['#FFF5E6', '#FFE6CC']}
                      style={styles.itemImage}
                    >
                      <Text style={styles.itemEmoji}>🍟</Text>
                    </LinearGradient>
                  </View>

                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name_ar}</Text>
                    <Text style={styles.itemPrice}>
                      {item.price.toFixed(2)} ج.م
                    </Text>
                  </View>

                  <View style={styles.itemActions}>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus size={16} color="#FF9500" />
                      </TouchableOpacity>
                      <Text style={styles.quantity}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus size={16} color="#FF9500" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <Trash2 size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          <View style={styles.orderForm}>
            <Text style={styles.formTitle}>معلومات التوصيل</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                الاسم <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل اسمك"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                الهاتف <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل رقم هاتفك"
                keyboardType="phone-pad"
                value={customerPhone}
                onChangeText={setCustomerPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>العنوان</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="أدخل عنوان التوصيل"
                multiline
                numberOfLines={3}
                value={customerAddress}
                onChangeText={setCustomerAddress}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ملاحظات</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="تعليمات خاصة..."
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
              <Text style={styles.summaryValue}>
                {getTotalPrice().toFixed(2)} ج.م
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>الإجمالي</Text>
              <Text style={styles.totalValue}>
                {getTotalPrice().toFixed(2)} ج.م
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleSubmitOrder}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF9500', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkoutGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.checkoutText}>تقديم الطلب</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  },
  loadingBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: "GraphicSchool-Regular",
    textAlign: 'center',
  },
  itemCount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCartText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 24,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
  },
  browseButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    width: '80%',
  },
  browseButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  cartItems: {
    gap: 12,
    marginBottom: 24,
  },
  cartItem: {
    flexDirection: 'row-reverse',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 40,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    paddingHorizontal: 12,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  removeButton: {
    padding: 4,
  },
  orderForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  checkoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  checkoutGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  checkoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});