import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search } from 'lucide-react-native';
import { supabase, Category, MenuItem } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

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
    const matchesSearch = !searchQuery || item.name_ar.includes(searchQuery);
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
            <Search size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث عن العناصر..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
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
                style={styles.menuItemContainer}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => openProductDetails(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuItemImage}>
                    <LinearGradient
                      colors={['#FFF5E6', '#FFE6CC']}
                      style={styles.imagePlaceholder}
                    >
                      <Text style={styles.placeholderEmoji}>🍟</Text>
                    </LinearGradient>
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
                        onPress={() => addToCart(item)}
                      >
                        <LinearGradient
                          colors={['#FF9500', '#FF6B00']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.addToCartGradient}
                        >
                          <Text style={styles.addToCartText}>+ أضف</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  categoriesScroll: {
    maxHeight: 60,
    backgroundColor: '#F9F9F9',
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    flexDirection: 'row-reverse',
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    gap: 16,
  },
  menuItemContainer: {
    width: (width - 56) / 2,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  menuItemImage: {
    width: '100%',
    height: 160,
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
    padding: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 16,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  addToCartButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addToCartGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
});