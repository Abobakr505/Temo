import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Plus, Minus, ShoppingBag, MapPin, Phone, User } from 'lucide-react-native';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
} from 'react-native-reanimated';

export default function CartScreen() {
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems, isLoading } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // تحميل بيانات العميل المحفوظة
  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      // يمكنك إضافة AsyncStorage هنا لتحميل بيانات العميل السابقة
      // const savedName = await AsyncStorage.getItem('customerName');
      // if (savedName) setCustomerName(savedName);
      // ... وهكذا للبيانات الأخرى
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

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

    // التحقق من صحة رقم الهاتف
    const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
    if (!phoneRegex.test(customerPhone)) {
      Alert.alert(
        'رقم هاتف غير صحيح',
        'يرجى إدخال رقم هاتف مصري صحيح (11 رقم)'
      );
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
          items_count: getTotalItems(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // إعداد عناصر الطلب
      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        product_name: item.name_ar,
        product_type: item.type,
        quantity: item.quantity,
        price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // حفظ بيانات العميل للاستخدام المستقبلي
      // await AsyncStorage.setItem('customerName', customerName);
      // await AsyncStorage.setItem('customerPhone', customerPhone);

      Alert.alert(
        'تم تقديم الطلب بنجاح! 🎉',
        `رقم طلبك: #${orderData.id}\nسيتم الاتصال بك على ${customerPhone} لتأكيد الطلب`,
        [
          {
            text: 'حسناً',
            onPress: () => {
              clearCart();
              setCustomerAddress('');
              setNotes('');
              // الاحتفاظ بالاسم والهاتف للطلبات القادمة
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('خطأ في الطلب:', error);
      Alert.alert(
        'خطأ', 
        error.message || 'فشل في تقديم الطلب. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // إعادة تحميل البيانات إذا لزم الأمر
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getItemImage = (item: any) => {
    if (item.image_url) {
      return (
        <Image
          source={{ uri: item.image_url }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      );
    }
    
    return (
      <LinearGradient
        colors={item.type === 'drink' ? ['#E6F2FF', '#CCE5FF'] : ['#FFF5E6', '#FFE6CC']}
        style={styles.itemImage}
      >
        <Text style={styles.itemEmoji}>
          {item.type === 'drink' ? '🥤' : '🍟'}
        </Text>
      </LinearGradient>
    );
  };

  const getItemTypeText = (type: string) => {
    return type === 'drink' ? 'مشروب' : 'طعام';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#FF9500', '#FFCC00']}
          style={styles.loadingBackground}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>جاري تحميل السلة...</Text>
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
              {getTotalItems()} {getTotalItems() === 1 ? 'عنصر' : 'عناصر'}
            </Text>
          )}
        </Animated.View>
      </LinearGradient>

      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <ShoppingBag size={80} color="#E5E5EA" strokeWidth={1.5} />
          <Text style={styles.emptyCartText}>سلتك فارغة</Text>
          <Text style={styles.emptyCartSubtext}>
            ابدأ بتصفح قائمتنا وأضف بعض المنتجات اللذيذة
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/menu')}
          >
            <LinearGradient
              colors={['#FFCC00', '#FF9500']}
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
          {/* عناصر السلة */}
          <View style={styles.cartItems}>
            {cart.map((item, index) => (
              <Animated.View
                key={`${item.id}-${index}`}
                entering={FadeInRight.delay(index * 50).duration(500)}
                exiting={FadeOutLeft.duration(300)}
              >
                <View style={styles.cartItem}>
                  <View style={styles.itemImageContainer}>
                    {getItemImage(item)}
                    <View style={[
                      styles.typeBadge,
                      { backgroundColor: item.type === 'drink' ? '#007AFF' : '#FF9500' }
                    ]}>
                      <Text style={styles.typeText}>
                        {getItemTypeText(item.type)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name_ar}</Text>
                    <Text style={styles.itemPrice}>
                      {item.price.toFixed(2)} ج.م
                    </Text>
                    <Text style={styles.itemTotal}>
                      الإجمالي: {(item.price * item.quantity).toFixed(2)} ج.م
                    </Text>
                  </View>

                  <View style={styles.itemActions}>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus size={16} color="#FF9500" />
                      </TouchableOpacity>
                      <Text style={styles.quantity}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
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

          {/* زر مسح السلة */}
          {cart.length > 0 && (
            <TouchableOpacity
              style={styles.clearCartButton}
              onPress={() => {
                Alert.alert(
                  'مسح السلة',
                  'هل أنت متأكد من مسح جميع العناصر من السلة؟',
                  [
                    { text: 'إلغاء', style: 'cancel' },
                    {
                      text: 'مسح الكل',
                      style: 'destructive',
                      onPress: clearCart,
                    },
                  ]
                );
              }}
            >
              <Text style={styles.clearCartText}>مسح السلة</Text>
            </TouchableOpacity>
          )}

          {/* نموذج معلومات العميل */}
          <View style={styles.orderForm}>
            <Text style={styles.formTitle}>معلومات التوصيل</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <User size={16} color="#8E8E93" />
                <Text style={styles.inputLabel}>
                  الاسم <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="أدخل اسمك الكامل"
                value={customerName}
                onChangeText={setCustomerName}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Phone size={16} color="#8E8E93" />
                <Text style={styles.inputLabel}>
                  الهاتف <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="مثال: 01012345678"
                keyboardType="phone-pad"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                textAlign="right"
                maxLength={11}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <MapPin size={16} color="#8E8E93" />
                <Text style={styles.inputLabel}>العنوان</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="أدخل عنوان التوصيل بالتفصيل"
                multiline
                numberOfLines={3}
                value={customerAddress}
                onChangeText={setCustomerAddress}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ملاحظات إضافية</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="أي تعليمات خاصة للطلب..."
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                textAlign="right"
              />
            </View>
          </View>

          {/* ملخص الطلب */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>ملخص الطلب</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>عدد العناصر</Text>
              <Text style={styles.summaryValue}>{getTotalItems()}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
              <Text style={styles.summaryValue}>
                {getTotalPrice().toFixed(2)} ج.م
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>التوصيل</Text>
              <Text style={styles.summaryValue}>0.00 ج.م</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>الإجمالي النهائي</Text>
              <Text style={styles.totalValue}>
                {getTotalPrice().toFixed(2)} ج.م
              </Text>
            </View>
          </View>

          {/* زر تقديم الطلب */}
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              isSubmitting && styles.checkoutButtonDisabled
            ]}
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
                <>
                  <Text style={styles.checkoutText}>تقديم الطلب</Text>
                  <Text style={styles.checkoutSubtext}>
                    {getTotalPrice().toFixed(2)} ج.م
                  </Text>
                </>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#8E8E93',
    marginTop: 24,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
    lineHeight: 22,
  },
  browseButton: {
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
    width: '80%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  browseButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  browseButtonText: {
    fontSize: 18,
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
    marginBottom: 20,
  },
  cartItem: {
    flexDirection: 'row-reverse',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  itemImageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 32,
  },
  typeBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
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
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 12,
    color: '#8E8E93',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    paddingHorizontal: 16,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
  },
  clearCartButton: {
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE6E6',
  },
  clearCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  orderForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontFamily: 'IBMPlexSansArabic-Medium',
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
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
    fontSize: 18,
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutGradient: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  checkoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 4,
  },
  checkoutSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
});