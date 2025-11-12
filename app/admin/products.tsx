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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Package,
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  X,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from "expo-file-system/legacy";

type Category = {
  id: string;
  name_ar: string;
  name_en?: string;
  display_order: number;
  image_url?: string;
  created_at: string;
};

type MenuItem = {
  id: string;
  name_ar: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  price: number;
  category_id: string;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  image_url?: string;
  created_at: string;
  categories?: Category;
};

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name_ar: '',
    description_ar: '',
    price: '',
    category_id: '',
    is_available: true,
    is_featured: false,
    display_order: '0',
    image_url: '',
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted' || cameraStatus.status !== 'granted') {
      Alert.alert('خطأ في الصلاحيات', 'يجب منح صلاحية الوصول إلى الصور والكاميرا');
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          categories (
            name_ar
          )
        `)
        .order('display_order');

      if (error) {
        console.error('Error loading products:', error);
        Alert.alert('خطأ', 'فشل في تحميل المنتجات');
      } else {
        setProducts(data || []);
        console.log('Products loaded:', data?.length);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('خطأ', 'فشل في تحميل المنتجات');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) {
        console.error('Error loading categories:', error);
        Alert.alert('خطأ', 'فشل في تحميل الفئات');
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('خطأ', 'فشل في تحميل الفئات');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('خطأ', 'فشل في اختيار الصورة');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('خطأ', 'فشل في التقاط الصورة');
    }
  };

  const uploadImage = async (imageUri: string) => {
  try {
    setUploadingImage(true);

    const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = fileName;

    // 🔹 قراءة الملف كـ Blob (يعمل على الويب والجوال)
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // 🔹 رفع الصورة إلى Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // 🔹 الحصول على الرابط العام للصورة
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    if (urlData?.publicUrl) {
      setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      setSelectedImage(urlData.publicUrl);
      Alert.alert("نجاح", "تم رفع الصورة بنجاح");
      console.log("✅ Image uploaded:", urlData.publicUrl);
    } else {
      throw new Error("لم يتم إنشاء رابط عام للصورة");
    }

  } catch (error: any) {
    console.error("Error uploading image:", error);
    Alert.alert("خطأ", `فشل في رفع الصورة: ${error.message}`);
  } finally {
    setUploadingImage(false);
  }
};


  const removeImage = async () => {
    if (formData.image_url) {
      try {
        // استخراج اسم الملف من الرابط
        const fileName = formData.image_url.split('/').pop();
        if (fileName) {
          const { error } = await supabase.storage
            .from('product-images')
            .remove([fileName]);
          
          if (error) {
            console.error('Error deleting image from storage:', error);
          }
        }
      } catch (error) {
        console.error('Error removing image:', error);
      }
    }
    
    setSelectedImage(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const filteredProducts = products.filter(product =>
    product.name_ar.includes(searchQuery) ||
    (product.name_en && product.name_en.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveProduct = async () => {
    if (!formData.name_ar || !formData.price || !formData.category_id) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setFormLoading(true);
    try {
      const productData = {
        name_ar: formData.name_ar,
        description_ar: formData.description_ar,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        display_order: parseInt(formData.display_order) || 0,
        image_url: formData.image_url,
      };

      console.log('Saving product with data:', productData);

      if (editingProduct) {
        const { error } = await supabase
          .from('menu_items')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        Alert.alert('نجاح', 'تم تحديث المنتج بنجاح');
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([productData]);

        if (error) throw error;
        Alert.alert('نجاح', 'تم إضافة المنتج بنجاح');
      }

      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('خطأ', `فشل في حفظ المنتج: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (product: MenuItem) => {
    setEditingProduct(product);
    setFormData({
      name_ar: product.name_ar,
      description_ar: product.description_ar || '',
      price: product.price.toString(),
      category_id: product.category_id,
      is_available: product.is_available,
      is_featured: product.is_featured,
      display_order: product.display_order.toString(),
      image_url: product.image_url || '',
    });
    setSelectedImage(product.image_url || null);
    setIsModalVisible(true);
  };

  const handleDelete = async (product: MenuItem) => {
    Alert.alert(
      'حذف المنتج',
      `هل أنت متأكد من حذف ${product.name_ar}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              // حذف الصورة من Storage إذا كانت موجودة
              if (product.image_url) {
                const fileName = product.image_url.split('/').pop();
                if (fileName) {
                  await supabase.storage
                    .from('product-images')
                    .remove([fileName]);
                }
              }

              const { error } = await supabase
                .from('menu_items')
                .delete()
                .eq('id', product.id);

              if (error) throw error;
              Alert.alert('نجاح', 'تم حذف المنتج بنجاح');
              loadProducts();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('خطأ', 'فشل في حذف المنتج');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name_ar: '',
      description_ar: '',
      price: '',
      category_id: '',
      is_available: true,
      is_featured: false,
      display_order: '0',
      image_url: '',
    });
    setEditingProduct(null);
    setSelectedImage(null);
    setIsModalVisible(false);
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9500" />
            <Text style={styles.loadingText}>جاري تحميل المنتجات...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
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
              <View style={styles.productImageContainer}>
                {product.image_url ? (
                  <Image 
                    source={{ uri: product.image_url }} 
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderEmoji}>🍟</Text>
                  </View>
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name_ar}</Text>
                <Text style={styles.productCategory}>
                  {product.categories?.name_ar || 'بدون فئة'}
                </Text>
                <Text style={styles.productPrice}>
                  {product.price.toFixed(2)} ج.م
                </Text>
                <View style={styles.productStatus}>
                  <Text style={[
                    styles.statusText,
                    !product.is_available && styles.statusDisabled
                  ]}>
                    {product.is_available ? 'متاح' : 'غير متاح'}
                  </Text>
                  {product.is_featured && (
                    <Text style={styles.featuredText}>مميز</Text>
                  )}
                </View>
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
              {/* قسم الصورة */}
              <View style={styles.imageSection}>
                <Text style={styles.inputLabel}>صورة المنتج</Text>
                <View style={styles.imageUploadContainer}>
                  {selectedImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image 
                        source={{ uri: selectedImage }} 
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={removeImage}
                      >
                        <X size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      {uploadingImage ? (
                        <ActivityIndicator size="small" color="#FF9500" />
                      ) : (
                        <>
                          <Camera size={40} color="#8E8E93" />
                          <Text style={styles.uploadText}>اختر صورة للمنتج</Text>
                          <View style={styles.imageButtons}>
                            <TouchableOpacity 
                              style={styles.imageButton}
                              onPress={pickImage}
                            >
                              <Text style={styles.imageButtonText}>من المعرض</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.imageButton}
                              onPress={takePhoto}
                            >
                              <Text style={styles.imageButtonText}>التقاط صورة</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.inputLabel}>اسم المنتج (عربي) *</Text>
              <TextInput
                style={styles.input}
                value={formData.name_ar}
                onChangeText={(text) => setFormData({ ...formData, name_ar: text })}
                placeholder="أدخل اسم المنتج بالعربية"
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
                contentContainerStyle={styles.categoriesContent}
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
                disabled={formLoading}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProduct}
                disabled={formLoading}
              >
                {formLoading ? (
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
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Medium',


  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Medium'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Medium'
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
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 24,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Bold'
  },
  productCategory: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Medium'
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Medium'
  },
  productStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium'
  },
  statusDisabled: {
    color: '#FF3B30',
  },
  featuredText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium'
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
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Bold'
  },
  form: {
    maxHeight: 400,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageUploadContainer: {
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    padding: 16,
  },
  uploadText: {
    marginTop: 8,
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Medium'
  },
  imageButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  imageButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Medium'
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
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Medium'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    fontFamily: 'IBMPlexSansArabic-Medium'
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContent: {
    flexDirection: 'row-reverse',
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
    fontFamily: 'IBMPlexSansArabic-Medium'
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
    fontFamily: 'IBMPlexSansArabic-Medium'
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
    fontFamily: 'IBMPlexSansArabic-Medium'
  },
});