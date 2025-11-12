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
  Coffee,
  ArrowLeft,
  Camera,
  X,
} from 'lucide-react-native';
import { supabase, Drink, DrinkCategory } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export default function AdminDrinksScreen() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [categories, setCategories] = useState<DrinkCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null);
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
    size: 'medium',
    calories: '',
  });

  useEffect(() => {
    loadDrinks();
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

  const loadDrinks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('drinks')
        .select(`
          *,
          drink_categories (
            name_ar
          )
        `)
        .order('display_order');

      if (error) {
        console.error('Error loading drinks:', error);
        Alert.alert('خطأ', 'فشل في تحميل المشروبات');
      } else {
        setDrinks(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('خطأ', 'فشل في تحميل المشروبات');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('drink_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Error loading drink categories:', error);
        Alert.alert('خطأ', 'فشل في تحميل فئات المشروبات');
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('خطأ', 'فشل في تحميل فئات المشروبات');
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

  const uploadImage = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('drink-images')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('drink-images')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
        setSelectedImage(urlData.publicUrl);
      } else {
        throw new Error('لم يتم إنشاء رابط عام للصورة');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('خطأ', `فشل في رفع الصورة: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async () => {
    if (formData.image_url) {
      try {
        const fileName = formData.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('drink-images')
            .remove([fileName]);
        }
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }
    
    setSelectedImage(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const filteredDrinks = drinks.filter(drink =>
    drink.name_ar.includes(searchQuery) ||
    (drink.name_en && drink.name_en.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveDrink = async () => {
    if (!formData.name_ar || !formData.price || !formData.category_id) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setFormLoading(true);
    try {
      const drinkData = {
        name_ar: formData.name_ar,
        description_ar: formData.description_ar,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        display_order: parseInt(formData.display_order) || 0,
        image_url: formData.image_url,
        size: formData.size,
        calories: formData.calories ? parseInt(formData.calories) : null,
      };

      if (editingDrink) {
        const { error } = await supabase
          .from('drinks')
          .update(drinkData)
          .eq('id', editingDrink.id);

        if (error) throw error;
        Alert.alert('نجاح', 'تم تحديث المشروب بنجاح');
      } else {
        const { error } = await supabase
          .from('drinks')
          .insert([drinkData]);

        if (error) throw error;
        Alert.alert('نجاح', 'تم إضافة المشروب بنجاح');
      }

      resetForm();
      loadDrinks();
    } catch (error) {
      console.error('Error saving drink:', error);
      Alert.alert('خطأ', `فشل في حفظ المشروب: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (drink: Drink) => {
    setEditingDrink(drink);
    setFormData({
      name_ar: drink.name_ar,
      description_ar: drink.description_ar || '',
      price: drink.price.toString(),
      category_id: drink.category_id,
      is_available: drink.is_available,
      is_featured: drink.is_featured,
      display_order: drink.display_order.toString(),
      image_url: drink.image_url || '',
      size: drink.size || 'medium',
      calories: drink.calories?.toString() || '',
    });
    setSelectedImage(drink.image_url || null);
    setIsModalVisible(true);
  };

  const handleDelete = async (drink: Drink) => {
    Alert.alert(
      'حذف المشروب',
      `هل أنت متأكد من حذف ${drink.name_ar}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              if (drink.image_url) {
                const fileName = drink.image_url.split('/').pop();
                if (fileName) {
                  await supabase.storage
                    .from('drink-images')
                    .remove([fileName]);
                }
              }

              const { error } = await supabase
                .from('drinks')
                .delete()
                .eq('id', drink.id);

              if (error) throw error;
              Alert.alert('نجاح', 'تم حذف المشروب بنجاح');
              loadDrinks();
            } catch (error) {
              console.error('Error deleting drink:', error);
              Alert.alert('خطأ', 'فشل في حذف المشروب');
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
      size: 'medium',
      calories: '',
    });
    setEditingDrink(null);
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
          <Text style={styles.headerTitle}>إدارة المشروبات</Text>
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
            placeholder="ابحث عن المشروبات..."
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
            <Text style={styles.loadingText}>جاري تحميل المشروبات...</Text>
          </View>
        ) : filteredDrinks.length === 0 ? (
          <View style={styles.emptyState}>
            <Coffee size={80} color="#E5E5EA" />
            <Text style={styles.emptyStateText}>لا توجد مشروبات</Text>
          </View>
        ) : (
          filteredDrinks.map((drink, index) => (
            <Animated.View
              key={drink.id}
              entering={FadeInUp.delay(index * 50).duration(500)}
              style={styles.drinkCard}
            >
              <View style={styles.drinkImageContainer}>
                {drink.image_url ? (
                  <Image 
                    source={{ uri: drink.image_url }} 
                    style={styles.drinkImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderEmoji}>🥤</Text>
                  </View>
                )}
              </View>
              <View style={styles.drinkInfo}>
                <Text style={styles.drinkName}>{drink.name_ar}</Text>
                <Text style={styles.drinkCategory}>
                  {drink.drink_categories?.name_ar || 'بدون فئة'}
                </Text>
                <Text style={styles.drinkPrice}>
                  {drink.price.toFixed(2)} ج.م
                </Text>
                <View style={styles.drinkDetails}>
                  <Text style={styles.drinkSize}>{drink.size === 'small' ? 'صغير' : drink.size === 'large' ? 'كبير' : 'وسط'}</Text>
                  {drink.calories && (
                    <Text style={styles.drinkCalories}>{drink.calories} سعرة</Text>
                  )}
                </View>
                <View style={styles.drinkStatus}>
                  <Text style={[
                    styles.statusText,
                    !drink.is_available && styles.statusDisabled
                  ]}>
                    {drink.is_available ? 'متاح' : 'غير متاح'}
                  </Text>
                  {drink.is_featured && (
                    <Text style={styles.featuredText}>مميز</Text>
                  )}
                </View>
              </View>
              <View style={styles.drinkActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(drink)}
                >
                  <Edit3 size={20} color="#FF9500" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(drink)}
                >
                  <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Modal for Add/Edit Drink */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingDrink ? 'تعديل المشروب' : 'إضافة مشروب جديد'}
            </Text>

            <ScrollView style={styles.form}>
              <View style={styles.imageSection}>
                <Text style={styles.inputLabel}>صورة المشروب</Text>
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
                          <Text style={styles.uploadText}>اختر صورة للمشروب</Text>
                          <TouchableOpacity 
                            style={styles.imageButton}
                            onPress={pickImage}
                          >
                            <Text style={styles.imageButtonText}>اختر صورة</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.inputLabel}>اسم المشروب (عربي) *</Text>
              <TextInput
                style={styles.input}
                value={formData.name_ar}
                onChangeText={(text) => setFormData({ ...formData, name_ar: text })}
                placeholder="أدخل اسم المشروب بالعربية"
              />

              <Text style={styles.inputLabel}>الوصف (عربي)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description_ar}
                onChangeText={(text) => setFormData({ ...formData, description_ar: text })}
                placeholder="أدخل وصف المشروب بالعربية"
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

              <Text style={styles.inputLabel}>الحجم</Text>
              <View style={styles.sizeContainer}>
                {['small', 'medium', 'large'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      formData.size === size && styles.sizeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, size })}
                  >
                    <Text style={[
                      styles.sizeButtonText,
                      formData.size === size && styles.sizeButtonTextActive,
                    ]}>
                      {size === 'small' ? 'صغير' : size === 'large' ? 'كبير' : 'وسط'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>السعرات الحرارية</Text>
              <TextInput
                style={styles.input}
                value={formData.calories}
                onChangeText={(text) => setFormData({ ...formData, calories: text })}
                placeholder="أدخل عدد السعرات الحرارية"
                keyboardType="number-pad"
              />

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
                <Text style={styles.switchLabel}>مشروب مميز</Text>
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
                onPress={handleSaveDrink}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingDrink ? 'تحديث' : 'حفظ'}
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
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
  drinkCard: {
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
  drinkImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  drinkImage: {
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
  drinkInfo: {
    flex: 1,
  },
  drinkName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  drinkCategory: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
    marginBottom: 4,
  },
  drinkPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
    marginBottom: 4,
  },
  drinkDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  drinkSize: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  drinkCalories: {
    fontSize: 12,
    color: '#34C759',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  drinkStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  statusDisabled: {
    color: '#FF3B30',
  },
  featuredText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  drinkActions: {
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
    maxHeight: '90%',
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
    maxHeight: 500,
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
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
  },
  imageButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  sizeContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sizeButtonActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  sizeButtonTextActive: {
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