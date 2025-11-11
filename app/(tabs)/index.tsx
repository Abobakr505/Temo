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
import { ChevronRight, Heart, Sparkles, Newspaper, Tag } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase, Offer, MenuItem, Category, News } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
      const [offersData, featuredData, categoriesData, newsData] = await Promise.all([
        supabase.from('offers').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(3),
        supabase.from('menu_items').select('*').eq('is_featured', true).eq('is_available', true).limit(4),
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('news').select('*').eq('is_active', true).order('published_date', { ascending: false }).limit(3)
      ]);

      if (offersData.data) setOffers(offersData.data);
      if (featuredData.data) setFeaturedItems(featuredData.data);
      if (categoriesData.data) setCategories(categoriesData.data);
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

  const openProductDetails = (item: MenuItem) => {
    router.push({
      pathname: `/product/${item.id}`,
      params: { item: JSON.stringify(item) },
    });
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
          <TouchableOpacity onPress={() => navigation.navigate('news')}>
            <View style={styles.sectionHeader}>
              <Tag size={24} color="#FF9500" />
              <Text style={styles.sectionTitle}>العروض الخاصة</Text>
              <ChevronRight size={20} color="#8E8E93" />
            </View>
          </TouchableOpacity>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.offersScroll}
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

      {/* المنتجات المميزة */}
      {featuredItems.length > 0 && (
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.section}>
          <TouchableOpacity onPress={() => navigation.navigate('menu')}>
            <View style={styles.sectionHeader}>
              <Ionicons name="fast-food-outline" size={24} color="#FF9500" />
              <Text style={styles.sectionTitle}>المنتجات المميزة</Text>
              <ChevronRight size={20} color="#8E8E93" />
            </View>
          </TouchableOpacity>
          <View style={styles.featuredGrid}>
            {featuredItems.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeIn.delay(500 + index * 100).duration(600)}
                style={styles.featuredItemContainer}
              >
                <TouchableOpacity
                  style={styles.featuredItem}
                  onPress={() => openProductDetails(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.featuredItemImage}>
                    <LinearGradient
                      colors={['#FFF5E6', '#FFE6CC']}
                      style={styles.imagePlaceholder}
                    >
                      <Text style={styles.placeholderEmoji}>🍟</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.featuredItemInfo}>
                    <Text style={styles.featuredItemName} numberOfLines={2}>
                      {item.name_ar}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.featuredItemPrice}>
                        {item.price.toFixed(2)} ج.م
                      </Text>
                      <TouchableOpacity
                         style={styles.addToCartButton}
                         onPress={() => addToCart(item)}
                      >
                        <View style={styles.addButton}>
                          <Text style={styles.addButtonText}>+</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* الأقسام */}
      {categories.length > 0 && (
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.section}>
          <TouchableOpacity onPress={() => navigation.navigate('menu')}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الأقسام</Text>
              <ChevronRight size={20} color="#8E8E93" />
            </View>
          </TouchableOpacity>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((category, index) => (
              <Animated.View
                key={category.id}
                entering={FadeIn.delay(700 + index * 100).duration(600)}
              >
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() => navigation.navigate('menu', { categoryId: category.id })}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FFF5E6', '#FFE6CC']}
                    style={styles.categoryImage}
                  >
                    <Text style={styles.categoryEmoji}>🍔</Text>
                  </LinearGradient>
                  <Text style={styles.categoryName}>{category.name_ar}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* الأخبار */}
      {latestNews.length > 0 && (
        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.section}>
          <TouchableOpacity onPress={() => navigation.navigate('news')}>
            <View style={styles.sectionHeader}>
              <Newspaper size={24} color="#FF9500" />
              <Text style={styles.sectionTitle}>أحدث الأخبار</Text>
              <ChevronRight size={20} color="#8E8E93" />
            </View>
          </TouchableOpacity>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newsScroll}
          >
            {latestNews.map((news, index) => (
              <Animated.View
                key={news.id}
                entering={FadeIn.delay(900 + index * 100).duration(600)}
              >
                <TouchableOpacity
                  style={styles.newsCard}
                  onPress={() => navigation.navigate('news')}
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
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: "GraphicSchool-Regular"
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: "IBMPlexSansArabic-Bold"
  },
  offersScroll: {
    paddingRight: 20,
  },
  offerCard: {
    width: width * 0.75,
    marginRight: 16,
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
    minHeight: 180,
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
    fontWeight: '800',
    color: '#FF9500',
    fontFamily: "IBMPlexSansArabic-Bold"
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: '700',
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
  },
  offerDate: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featuredItemContainer: {
    width: (width - 56) / 2,
  },
  featuredItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredItemImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#FFF5E6',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  featuredItemInfo: {
    padding: 12,
  },
  featuredItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    fontFamily: "IBMPlexSansArabic-Bold"
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredItemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9500',
    fontFamily: "IBMPlexSansArabic-Medium"
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoriesScroll: {
    paddingRight: 20,
    gap: 16,
  },
  categoryCard: {
    width: width * 0.4,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 40,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: "IBMPlexSansArabic-Bold",
    textAlign: 'center',
  },
  newsScroll: {
    paddingRight: 20,
  },
  newsCard: {
    width: width * 0.75,
    marginRight: 16,
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
    minHeight: 180,
    justifyContent: 'space-between',
  },
  newsDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  newsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: "IBMPlexSansArabic-Bold",
  },
  newsDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: "IBMPlexSansArabic-Medium",
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