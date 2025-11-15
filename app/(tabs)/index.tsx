import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Heart, Sparkles, Newspaper, Tag, Coffee, Utensils } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase, Offer, MenuItem, Category, News, Drink, DrinkCategory } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [featuredFood, setFeaturedFood] = useState<MenuItem[]>([]);
  const [featuredDrinks, setFeaturedDrinks] = useState<Drink[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [drinkCategories, setDrinkCategories] = useState<DrinkCategory[]>([]);
  const [latestNews, setLatestNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart } = useCart();
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // تحميل جميع البيانات بشكل متوازي
      const [
        offersData, 
        featuredFoodData, 
        featuredDrinksData, 
        categoriesData, 
        drinkCategoriesData, 
        newsData
      ] = await Promise.all([
        // العروض
        supabase.from('offers').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(3),
        
        // الطعام المميز
        supabase.from('menu_items').select('*').eq('is_available', true).eq('is_featured', true).limit(4),
        
        // المشروبات المميزة
        supabase.from('drinks').select('*').eq('is_available', true).eq('is_featured', true).limit(4),
        
        // فئات الطعام
        supabase.from('categories').select('*').order('display_order').limit(6),
        
        // فئات المشروبات
        supabase.from('drink_categories').select('*').eq('is_active', true).order('display_order').limit(6),
        
        // الأخبار
        supabase.from('news').select('*').eq('is_active', true).order('published_date', { ascending: false }).limit(3)
      ]);

      if (offersData.data) setOffers(offersData.data);
      if (featuredFoodData.data) setFeaturedFood(featuredFoodData.data);
      if (featuredDrinksData.data) setFeaturedDrinks(featuredDrinksData.data);
      if (categoriesData.data) setCategories(categoriesData.data);
      if (drinkCategoriesData.data) setDrinkCategories(drinkCategoriesData.data);
      if (newsData.data) setLatestNews(newsData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openProductDetails = (item: MenuItem | Drink, type: 'food' | 'drink') => {
    router.push({
      pathname: `/product/${item.id}`,
      params: { 
        item: JSON.stringify(item),
        type: type
      },
    });
  };

  const addItemToCart = (item: MenuItem | Drink, type: 'food' | 'drink') => {
    const cartItem = {
      ...item,
      type: type
    };
    addToCart(cartItem);
          // استبدال Alert بـ Toast
          Toast.show({
            type: 'success',
            text1: 'تم الإضافة إلى السلة 🎉',
            text2: `تم إضافة ${item.name_ar} إلى السلة`,
            position: 'top',
            visibilityTime: 2500,
            onPress: () => router.push('/cart'), // لو ضغط المستخدم ينقله للسلة
          });
  };

  const getItemImage = (item: MenuItem | Drink) => {
    if (item.image_url) {
      return (
        <Image
          source={{ uri: item.image_url }}
          style={styles.productImage}
          resizeMode="cover"
        />
      );
    }
    
    // صورة افتراضية بناءً على النوع
    const isDrink = 'size' in item;
    return (
      <LinearGradient
        colors={isDrink ? ['#E6F2FF', '#CCE5FF'] : ['#FFF5E6', '#FFE6CC']}
        style={styles.imagePlaceholder}
      >
        <Text style={styles.placeholderEmoji}>
          {isDrink ? '🥤' : '🍟'}
        </Text>
      </LinearGradient>
    );
  };

  const renderFeaturedSection = (title: string, items: (MenuItem | Drink)[], type: 'food' | 'drink', icon: any) => {
    if (items.length === 0) return null;

    return (
      <Animated.View entering={FadeInUp.duration(600)} style={styles.section}>
        <TouchableOpacity onPress={() => router.push('/menu')}>
          <View style={styles.sectionHeader}>
            {icon}
            <Text style={styles.sectionTitle}>{title}</Text>
            <ChevronRight size={20} color="#8E8E93" />
          </View>
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {items.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeIn.delay(index * 100).duration(600)}
            >
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => openProductDetails(item, type)}
                activeOpacity={0.8}
              >
                <View style={styles.productImageContainer}>
                  {getItemImage(item)}
                  {'is_featured' in item && item.is_featured && (
                    <View style={[
                      styles.featuredBadge,
                      { backgroundColor: type === 'food' ? '#FF9500' : '#007AFF' }
                    ]}>
                      <Sparkles size={12} color="#FFFFFF" />
                      <Text style={styles.featuredText}>مميز</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name_ar}
                  </Text>
                  
                  {/* معلومات إضافية للمشروبات */}
                  {'size' in item && item.size && (
                    <Text style={styles.drinkSize}>
                      {item.size === 'small' ? 'صغير' : 
                       item.size === 'medium' ? 'وسط' : 'كبير'}
                    </Text>
                  )}
                  
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>
                      {item.price.toFixed(2)} ج.م
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        { backgroundColor: type === 'food' ? '#FF9500' : '#007AFF' }
                      ]}
                      onPress={() => addItemToCart(item, type)}
                    >
                      <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderCategoriesSection = (title: string, categories: (Category | DrinkCategory)[], type: 'food' | 'drink', icon: any) => {
    if (categories.length === 0) return null;

    return (
      <Animated.View entering={FadeInUp.duration(600)} style={styles.section}>
        <TouchableOpacity onPress={() => router.push('/menu')}>
          <View style={styles.sectionHeader}>
            {icon}
            <Text style={styles.sectionTitle}>{title}</Text>
            <ChevronRight size={20} color="#8E8E93" />
          </View>
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {categories.map((category, index) => (
            <Animated.View
              key={category.id}
              entering={FadeIn.delay(index * 100).duration(600)}
            >
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => router.push('/menu')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={type === 'food' ? ['#FFF5E6', '#FFE6CC'] : ['#E6F2FF', '#CCE5FF']}
                  style={styles.categoryImage}
                >
                  <Text style={styles.categoryEmoji}>
                    {type === 'food' ? '🍟' : '🥤'}
                  </Text>
                </LinearGradient>
                <Text style={styles.categoryName}>{category.name_ar}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#FF9500', '#FFCC00']}
          style={styles.loadingBackground}
        >
          <Animated.View entering={FadeInDown.duration(600)} style={styles.loadingContent}>
            <Image
              source={require('@/assets/images/temo-logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>Temo</Text>
            <Text style={styles.heroSubtitle}>أفضل بطاطس في بني سويف</Text>
            <ActivityIndicator size="large" color="#FFFFFF" style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
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
      {/* الهيدر */}
      <LinearGradient
        colors={['#FF9500', '#FFCC00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View entering={FadeInDown.duration(600)} style={styles.heroContent}>
          <Image
            source={require('@/assets/images/temo-logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Temo</Text>
          <Text style={styles.heroSubtitle}>أفضل بطاطس في بني سويف</Text>
        </Animated.View>
      </LinearGradient>

      {/* العروض الخاصة */}
      {offers.length > 0 && (
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.section}>
          <TouchableOpacity onPress={() => router.push('/events')}>
            <View style={styles.sectionHeader}>
              <Tag size={24} color="#FF9500" />
              <Text style={styles.sectionTitle}>العروض الخاصة</Text>
              <ChevronRight size={20} color="#8E8E93" />
            </View>
          </TouchableOpacity>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {offers.map((offer, index) => (
              <Animated.View
                key={offer.id}
                entering={FadeIn.delay(300 + index * 100).duration(600)}
              >
                <TouchableOpacity style={styles.offerCard}>
                  <LinearGradient
                    colors={['#FF9500', '#FF6B00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.offerGradient}
                  >
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        {offer.discount_percentage}% خصم
                      </Text>
                    </View>
                    <Text style={styles.offerTitle}>{offer.title_ar}</Text>
                    <Text style={styles.offerDescription}>
                      {offer.description_ar || offer.description}
                    </Text>
                    <Text style={styles.offerDate}>
                      حتى {formatDate(offer.end_date)}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* الطعام المميز */}
      {renderFeaturedSection(
        'الطعام المميز', 
        featuredFood, 
        'food', 
        <Utensils size={24} color="#FF9500" />
      )}

      {/* المشروبات المميزة */}
      {renderFeaturedSection(
        'المشروبات المميزة', 
        featuredDrinks, 
        'drink', 
        <Coffee size={24} color="#007AFF" />
      )}

      {/* فئات الطعام */}
      {renderCategoriesSection(
        'فئات الطعام',
        categories,
        'food',
        <Utensils size={24} color="#FF9500" />
      )}

      {/* فئات المشروبات */}
      {renderCategoriesSection(
        'فئات المشروبات',
        drinkCategories,
        'drink',
        <Coffee size={24} color="#007AFF" />
      )}

      {/* الأخبار */}
      {latestNews.length > 0 && (
        <Animated.View entering={FadeInUp.duration(600)} style={styles.section}>
          <TouchableOpacity onPress={() => router.push('/news')}>
            <View style={styles.sectionHeader}>
              <Newspaper size={24} color="#FF9500" />
              <Text style={styles.sectionTitle}>أحدث الأخبار</Text>
              <ChevronRight size={20} color="#8E8E93" />
            </View>
          </TouchableOpacity>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {latestNews.map((news, index) => (
              <Animated.View
                key={news.id}
                entering={FadeIn.delay(index * 100).duration(600)}
              >
                <TouchableOpacity
                  style={styles.newsCard}
                  onPress={() => router.push('/events')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FFCC00', '#FF9500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.newsGradient}
                  >
                    <Text style={styles.newsDate}>{formatDate(news.published_date)}</Text>
                    <Text style={styles.newsTitle}>{news.title_ar}</Text>
                    <Text style={styles.newsDescription} numberOfLines={3}>
                      {news.content_ar}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* الفوتر */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>صنع بحب  </Text>
        <Heart size={20} color="#FF9500" fill="#FF9500" />
        <Text style={styles.footerText}>  من </Text>
        <TouchableOpacity
          onPress={() => {
            Linking.openURL('https://bakrhasan.netlify.app/');
          }}
        >
          <Text style={styles.footerDev}>ابوبكر حسن </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingSpinner: {
    marginTop: 30,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroContent: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
  },
  heroTitle: {
    fontSize: 48,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: "GraphicSchool-Regular"
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.95,
    fontFamily: "IBMPlexSansArabic-Medium"
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#1C1C1E',
    flex: 1,
    fontFamily: "IBMPlexSansArabic-Bold"
  },
  horizontalScroll: {
    gap: 16,
  },
  offerCard: {
    width: width * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  offerGradient: {
    padding: 24,
    minHeight: 160,
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    fontSize: 14,
    color: '#FF9500',
    fontFamily: "IBMPlexSansArabic-Bold"
  },
  offerTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: "IBMPlexSansArabic-Bold"
  },
  offerDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: "IBMPlexSansArabic-Medium",
    marginBottom: 8,
    lineHeight: 20,
  },
  offerDate: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  productCard: {
    width: width * 0.6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 8,
    fontFamily: "IBMPlexSansArabic-Bold",
    lineHeight: 20,
  },
  drinkSize: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 8,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    color: '#FF9500',
    fontFamily: "IBMPlexSansArabic-Bold",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  categoryCard: {
    width: width * 0.35,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 14,
    color: '#1C1C1E',
    fontFamily: "IBMPlexSansArabic-Bold",
    textAlign: 'center',
    lineHeight: 18,
  },
  newsCard: {
    width: width * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  newsGradient: {
    padding: 20,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  newsDate: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  newsTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: "IBMPlexSansArabic-Bold",
    lineHeight: 24,
  },
  newsDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: "IBMPlexSansArabic-Medium",
    lineHeight: 20,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 2,
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: "IBMPlexSansArabic-Medium"
  },
  footerDev: {
    fontSize: 15,
    color: '#FF9500',
    fontFamily: "GraphicSchool-Regular"
  },
});