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
  Plus,
  Search,
  Edit3,
  Trash2,
  Package,
  ArrowLeft,
} from 'lucide-react-native';
import { supabase, MenuItem, Category } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // حالة النموذج
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    price: '',
    category_id: '',
    is_available: true,
    is_featured: false,
    display_order: '0',
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, categories(name_ar)')
      .order('display_order');

    if (error) {
      Alert.alert('خطأ', 'فشل في تحميل المنتجات');
    } else {
      setProducts(data || []);
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (error) {
      Alert.alert('خطأ', 'فشل في تحميل الفئات');
    } else {
      setCategories(data || []);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name_ar.includes(searchQuery) ||
    product.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveProduct = async () => {
    if (!formData.name_ar || !formData.price || !formData.category_id) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsLoading(true);
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        display_order: parseInt(formData.display_order),
      };

      if (editingProduct) {
        // تحديث المنتج
        const { error } = await supabase
          .from('menu_items')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        Alert.alert('نجاح', 'تم تحديث المنتج بنجاح');
      } else {
        // إضافة منتج جديد
        const { error } = await supabase
          .from('menu_items')
          .insert([productData]);

        if (error) throw error;
        Alert.alert('نجاح', 'تم إضافة المنتج بنجاح');
      }

      resetForm();
      loadProducts();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ المنتج');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: MenuItem) => {
    setEditingProduct(product);
    setFormData({
      name_ar: product.name_ar,
      name_en: product.name_en || '',
      description_ar: product.description_ar || '',
      description_en: product.description_en || '',
      price: product.price.toString(),
      category_id: product.category_id,
      is_available: product.is_available,
      is_featured: product.is_featured,
      display_order: product.display_order.toString(),
    });
    setIsModalVisible(true);
  };

  const handleDelete = (product: MenuItem) => {
    Alert.alert(
      'حذف المنتج',
      `هل أنت متأكد من حذف ${product.name_ar}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('menu_items')
              .delete()
              .eq('id', product.id);

            if (error) {
              Alert.alert('خطأ', 'فشل في حذف المنتج');
            } else {
              Alert.alert('نجاح', 'تم حذف المنتج بنجاح');
              loadProducts();
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      price: '',
      category_id: '',
      is_available: true,
      is_featured: false,
      display_order: '0',
    });
    setEditingProduct(null);
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF9500', '#FF6B00']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة المنتجات</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن المنتجات..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={80} color="#E5E5EA" />
            <Text style={styles.emptyStateText}>لا توجد منتجات</Text>
          </View>
        ) : (
          filteredProducts.map((product, index) => (
            <Animated.View
              key={product.id}
              entering={FadeInUp.delay(index * 50).duration(500)}
              style={styles.productCard}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name_ar}</Text>
                <Text style={styles.productCategory}>
                  {product.categories?.name_ar}
                </Text>
                <Text style={styles.productPrice}>
                  {product.price.toFixed(2)} ج.م
                </Text>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(product)}
                >
                  <Edit3 size={20} color="#FF9500" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(product)}
                >
                  <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Modal for Add/Edit Product */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </Text>

            <ScrollView style={styles.form}>
              <Text style={styles.inputLabel}>اسم المنتج (عربي) *</Text>
              <TextInput
                style={styles.input}
                value={formData.name_ar}
                onChangeText={(text) => setFormData({ ...formData, name_ar: text })}
                placeholder="أدخل اسم المنتج بالعربية"
              />

              <Text style={styles.inputLabel}>اسم المنتج (إنجليزي)</Text>
              <TextInput
                style={styles.input}
                value={formData.name_en}
                onChangeText={(text) => setFormData({ ...formData, name_en: text })}
                placeholder="أدخل اسم المنتج بالإنجليزية"
              />

              <Text style={styles.inputLabel}>الوصف (عربي)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description_ar}
                onChangeText={(text) => setFormData({ ...formData, description_ar: text })}
                placeholder="أدخل وصف المنتج بالعربية"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>السعر *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="أدخل السعر"
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>الفئة *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      formData.category_id === category.id && styles.categoryChipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category_id: category.id })}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        formData.category_id === category.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {category.name_ar}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>متاح للطلب</Text>
                <TouchableOpacity
                  style={[
                    styles.switch,
                    formData.is_available && styles.switchActive,
                  ]}
                  onPress={() => setFormData({ ...formData, is_available: !formData.is_available })}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      formData.is_available && styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>منتج مميز</Text>
                <TouchableOpacity
                  style={[
                    styles.switch,
                    formData.is_featured && styles.switchActive,
                  ]}
                  onPress={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      formData.is_featured && styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>ترتيب العرض</Text>
              <TextInput
                style={styles.input}
                value={formData.display_order}
                onChangeText={(text) => setFormData({ ...formData, display_order: text })}
                placeholder="أدخل ترتيب العرض"
                keyboardType="number-pad"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetForm}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProduct}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingProduct ? 'تحديث' : 'حفظ'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'GraphicSchool-Regular',
  },
  addButton: {
    padding: 8,
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
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
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
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
  },
  form: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginLeft: 8,
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
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#FF9500',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});