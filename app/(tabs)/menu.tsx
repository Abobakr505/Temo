import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search } from 'lucide-react-native';
import { supabase, Category, MenuItem } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 400; // عتبة للهواتف الصغيرة، يمكن تعديلها إذا لزم الأمر

export default function MenuScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesData, menuItemsData] = await Promise.all([
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('menu_items').select('*').eq('is_available', true).order('display_order')
      ]);
      if (categoriesData.data) setCategories(categoriesData.data);
      if (menuItemsData.data) setMenuItems(menuItemsData.data);
    } catch (error) {
      console.error('Error loading menu data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch = !searchQuery || item.name_ar.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>جاري تحميل المنيو...</Text>
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
          <Text style={styles.headerTitle}>المنيو</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث عن العناصر..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Search size={20} color="#8E8E93" style={styles.searchIcon} />
          </View>
        </Animated.View>
      </LinearGradient>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
            الكل
          </Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive,
              ]}
            >
              {category.name_ar}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={styles.menuContent}
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
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            {searchQuery ? (
              <>
                <Search size={80} color="#E5E5EA" />
                <Text style={styles.emptyStateText}>لا توجد نتائج للبحث</Text>
                <Text style={styles.emptyStateSubtext}>
                  حاول البحث بكلمات أخرى
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.placeholderEmoji}>🍽️</Text>
                <Text style={styles.emptyStateText}>لا توجد عناصر</Text>
                <Text style={styles.emptyStateSubtext}>
                  سيتم إضافة المزيد من المنتجات قريباً
                </Text>
              </>
            )}
          </View>
        ) : (
          <View style={styles.menuGrid}>
            {filteredItems.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeIn.delay(index * 50).duration(500)}
                style={[
                  styles.menuItemContainer,
                  { width: isSmallScreen ? width - 40 : (width - 56) / 2 }
                ]}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => openProductDetails(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemImageContainer}>
                    {item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.menuItemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={['#FFF5E6', '#FFE6CC']}
                        style={styles.imagePlaceholder}
                      >
                        <Text style={styles.placeholderEmoji}>🍟</Text>
                      </LinearGradient>
                    )}
                  </View>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemName} numberOfLines={2}>
                      {item.name_ar}
                    </Text>
                    {item.description_ar && (
                      <Text style={styles.menuItemDescription} numberOfLines={2}>
                        {item.description_ar}
                      </Text>
                    )}
                    <View style={styles.menuItemFooter}>
                      <Text style={styles.menuItemPrice}>
                        {item.price.toFixed(2)} ج.م
                      </Text>
                      <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                      >
                        <LinearGradient
                          colors={['#FF9500', '#FF6B00']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.addToCartGradient}
                        >
                          <Text style={styles.addToCartText}>+</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
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
    fontSize: 50,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    fontFamily: 'GraphicSchool-Regular',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  categoriesScroll: {
    maxHeight: 60,
    backgroundColor: '#F9F9F9',
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    flexDirection: 'row-reverse',
    alignItems:'center'
  },
  categoryChip: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginTop:8 , 
  },
  categoryChipActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    padding: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: isSmallScreen ? 'center' : 'space-between',
    gap: 16,
  },
  menuItemContainer: {
    // العرض يتم تعيينه ديناميكيًا في المكون
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  menuItemImageContainer: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  menuItemImage: {
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
    fontSize: 72,
  },
  menuItemInfo: {
    padding: 16,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 18,
    fontFamily: 'IBMPlexSansArabic-Regular',
    textAlign: 'right',
  },
  menuItemFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  addToCartButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  addToCartText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Regular',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
});