import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { supabase, Category, DrinkCategory } from '@/lib/supabase';
import { Heart, Share2, Clock, Star, ArrowLeft, Minus, Plus, Leaf, BadgeCheck, HeartPlus } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

type ProductType = 'food' | 'drink';

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, cart } = useCart();
  
  const item = params.item ? JSON.parse(params.item as string) : null;
  const type = (params.type as ProductType) || 'food';
  
  const [category, setCategory] = useState<Category | DrinkCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (item?.category_id) {
      loadCategory();
    }
  }, [item, type]);

  const loadCategory = async () => {
    try {
      const tableName = type === 'food' ? 'categories' : 'drink_categories';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', item.category_id)
        .single();

      if (data) {
        setCategory(data);
      }
    } catch (error) {
      console.error('Error loading category:', error);
    }
  };

  const handleAddToCart = () => {
  const cartItem = {
    ...item,
    type: type // إضافة النوع للسلة
  };

  for (let i = 0; i < quantity; i++) {
    addToCart(cartItem);
  }

  // استبدال Alert بـ Toast
  Toast.show({
    type: 'success',
    text1: 'تم الإضافة إلى السلة 🎉',
    text2: `تم إضافة ${quantity} من ${item.name_ar} إلى السلة`,
    position: 'top',
    visibilityTime: 2500,
    onPress: () => router.push('/cart'), // لو ضغط المستخدم ينقله للسلة
  });
};

  const handleShare = async () => {
    try {
      await Share.share({
        message: `جرب ${item.name_ar} من Temo - ${item.price.toFixed(2)} ج.م\n${item.description_ar || 'أفضل طعم في بني سويف'}`,
        url: 'https://temo.com',
        title: item.name_ar,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };


  const getCartQuantity = () => {
    const cartItem = cart.find(cartItem => cartItem.id === item.id);
    return cartItem ? cartItem.quantity : 0;
  };

  // تحديد الألوان بناءً على النوع
  const getColors = () => {
    return type === 'food' 
      ? { primary: '#FF9500', secondary: '#FFCC00', light: '#FFF5E6' }
      : { primary: '#007AFF', secondary: '#0056CC', light: '#E6F2FF' };
  };

  const colors = getColors();

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>المنتج غير موجود</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>عودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* الهيدر */}
      <LinearGradient
        colors={[colors.primary, colors.primary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()} >
            <ArrowLeft size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تفاصيل المنتج</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <Share2 size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* صورة المنتج */}
        <Animated.View 
          entering={ZoomIn.duration(600)}
          style={styles.imageSection}
        >
          {item.image_url ? (
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.imageContainer}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[colors.light, colors.light]}
              style={styles.imageContainer}
            >
              <Text style={styles.placeholderEmoji}>
                {type === 'food' ? '🍟' : '🥤'}
              </Text>
            </LinearGradient>
          )}
          
          {/* الشارات */}
          <View style={styles.badgesContainer}>
            {item.is_featured && (
              <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
                <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.featuredText}>مميز</Text>
              </View>
            )}
            {type === 'drink' && item.size && (
              <View style={[styles.sizeBadge, { backgroundColor: colors.secondary }]}>
                <Text style={styles.sizeText}>
                  {item.size === 'small' ? 'صغير' : 
                   item.size === 'medium' ? 'وسط' : 'كبير'}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* معلومات المنتج */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.detailsSection}
        >
          <View style={styles.titleRow}>
            <Text style={styles.name}>{item.name_ar}</Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: colors.primary }]}>{item.price.toFixed(2)}</Text>
              <Text style={[styles.currency, { color: colors.primary }]}>ج.م</Text>
            </View>
          </View>

          {category && (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{category.name_ar}</Text>
            </View>
          )}

          {/* معلومات إضافية للمشروبات */}
          {type === 'drink' && (
            <View style={styles.drinkInfo}>
              {item.size && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>الحجم:</Text>
                  <Text style={styles.infoValue}>
                    {item.size === 'small' ? 'صغير' : 
                     item.size === 'medium' ? 'وسط' : 'كبير'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* الوصف */}
          {item.description_ar && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>الوصف</Text>
              <Text style={styles.description}>{item.description_ar}</Text>
            </View>
          )}

          {/* المميزات */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>المميزات</Text>
            <View style={styles.featuresGrid}>
              {type === 'food' ? (
                <>
                  <View style={styles.featureItem}>
                    <Leaf size={16} color="#34C759" />
                    <Text style={styles.featureText}>مكونات طبيعية</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <BadgeCheck size={16} color={colors.primary} />
                    <Text style={styles.featureText}>طازج يومياً</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <HeartPlus size={16} color="#34C759" />
                    <Text style={styles.featureText}>خالي من المواد الحافظة</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.featureItem}>
                    <Leaf size={16} color="#34C759" />
                    <Text style={styles.featureText}>طبيعي 100%</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <BadgeCheck size={16} color={colors.primary} />
                    <Text style={styles.featureText}>منعش</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <HeartPlus size={16} color="#34C759" />
                    <Text style={styles.featureText}>صحي</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* الكمية في السلة */}
          {getCartQuantity() > 0 && (
            <View style={[styles.cartInfo, { backgroundColor: colors.light }]}>
              <Text style={[styles.cartInfoText, { color: colors.primary }]}>
                لديك {getCartQuantity()} من هذا المنتج في السلة
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* التذييل مع أزرار الإضافة */}
      <Animated.View 
        entering={FadeInUp.delay(400).duration(600)}
        style={styles.footer}
      >
        <View style={styles.quantitySelector}>
          <Text style={styles.quantityLabel}>الكمية:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus size={20} color={quantity <= 1 ? '#C7C7CC' : colors.primary} />
            </TouchableOpacity>
            
            <Text style={styles.quantity}>{quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddToCart}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.addButtonText}>
                    أضف إلى السلة
                  </Text>
                  <Text style={styles.addButtonSubtext}>
                    {((item.price || 0) * quantity).toFixed(2)} ج.م
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9F9F9' 
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  },
  headerTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'GraphicSchool-Regular',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    padding: 20,
  },
  imageContainer: {
    width: width - 40,
    height: 250,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  placeholderEmoji: { 
    fontSize: 100 
  },
  badgesContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  featuredText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  sizeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sizeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  detailsSection: {
    padding: 20,
    paddingTop: 0,
  },
  titleRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: 12,

  },
  name: {
    fontSize: 24,
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Bold',
    lineHeight: 30,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 12,
  },
  price: {
    fontSize: 28,
    fontFamily: 'IBMPlexSansArabic-Bold',
        textAlign: 'left',
  },
  currency: {
    fontSize: 16,
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginRight: 4,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  drinkInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  infoValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1C1C1E',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 24,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginTop: 4,
    textAlign: 'center',
  },
  cartInfo: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  cartInfoText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  quantitySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: '#1C1C1E',
    paddingHorizontal: 16,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 2,
  },
  addButtonSubtext: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
});