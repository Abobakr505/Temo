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
  Tag,
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  X,
} from 'lucide-react-native';
import { supabase, DrinkCategory } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export default function AdminDrinkCategoriesScreen() {
  const [categories, setCategories] = useState<DrinkCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DrinkCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name_ar: '',
    description_ar: '',
    display_order: '0',
    is_active: true,
    image_url: '',
  });

  useEffect(() => {
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

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('drink_categories')
        .select('*')
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
    } finally {
      setIsLoading(false);
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
        .from('drink-category-images')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('drink-category-images')
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
            .from('drink-category-images')
            .remove([fileName]);
        }
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }
    
    setSelectedImage(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const filteredCategories = categories.filter(category =>
    category.name_ar.includes(searchQuery)
  );

  const handleSaveCategory = async () => {
    if (!formData.name_ar) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الفئة بالعربية');
      return;
    }

    setFormLoading(true);
    try {
      const categoryData = {
        name_ar: formData.name_ar,
        description_ar: formData.description_ar,
        display_order: parseInt(formData.display_order) || 0,
        is_active: formData.is_active,
        image_url: formData.image_url,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('drink_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        Alert.alert('نجاح', 'تم تحديث الفئة بنجاح');
      } else {
        const { error } = await supabase
          .from('drink_categories')
          .insert([categoryData]);

        if (error) throw error;
        Alert.alert('نجاح', 'تم إضافة الفئة بنجاح');
      }

      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Error saving drink category:', error);
      Alert.alert('خطأ', 'فشل في حفظ الفئة');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: DrinkCategory) => {
    setEditingCategory(category);
    setFormData({
      name_ar: category.name_ar,
      description_ar: category.description_ar || '',
      display_order: category.display_order.toString(),
      is_active: category.is_active,
      image_url: category.image_url || '',
    });
    setSelectedImage(category.image_url || null);
    setIsModalVisible(true);
  };

  const handleDelete = async (category: DrinkCategory) => {
    Alert.alert(
      'حذف الفئة',
      `هل أنت متأكد من حذف ${category.name_ar}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              if (category.image_url) {
                const fileName = category.image_url.split('/').pop();
                if (fileName) {
                  await supabase.storage
                    .from('drink-category-images')
                    .remove([fileName]);
                }
              }

              const { error } = await supabase
                .from('drink_categories')
                .delete()
                .eq('id', category.id);

              if (error) throw error;
              Alert.alert('نجاح', 'تم حذف الفئة بنجاح');
              loadCategories();
            } catch (error) {
              console.error('Error deleting drink category:', error);
              Alert.alert('خطأ', 'فشل في حذف الفئة');
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
      display_order: '0',
      is_active: true,
      image_url: '',
    });
    setEditingCategory(null);
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
          <Text style={styles.headerTitle}>إدارة فئات المشروبات</Text>
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
            placeholder="ابحث عن الفئات..."
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
            <Text style={styles.loadingText}>جاري تحميل الفئات...</Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <Tag size={80} color="#E5E5EA" />
            <Text style={styles.emptyStateText}>لا توجد فئات</Text>
          </View>
        ) : (
          filteredCategories.map((category, index) => (
            <Animated.View
              key={category.id}
              entering={FadeInUp.delay(index * 50).duration(500)}
              style={styles.categoryCard}
            >
              <View style={styles.categoryImageContainer}>

                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderEmoji}>🥤</Text>
                  </View>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name_ar}</Text>
                {category.description_ar && (
                  <Text style={styles.categoryDescription}>
                    {category.description_ar}
                  </Text>
                )}
                <Text style={styles.categoryOrder}>
                  ترتيب العرض: {category.display_order}
                </Text>
                <Text style={[
                  styles.statusText,
                  !category.is_active && styles.statusDisabled
                ]}>
                  {category.is_active ? 'نشطة' : 'غير نشطة'}
                </Text>
              </View>
              <View style={styles.categoryActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(category)}
                >
                  <Edit3 size={20} color="#FF9500" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(category)}
                >
                  <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Modal for Add/Edit Category */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
            </Text>

            <ScrollView style={styles.form}>

              <Text style={styles.inputLabel}>اسم الفئة (عربي) *</Text>
              <TextInput
                style={styles.input}
                value={formData.name_ar}
                onChangeText={(text) => setFormData({ ...formData, name_ar: text })}
                placeholder="أدخل اسم الفئة بالعربية"
              />

              <Text style={styles.inputLabel}>الوصف (عربي)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description_ar}
                onChangeText={(text) => setFormData({ ...formData, description_ar: text })}
                placeholder="أدخل وصف الفئة بالعربية"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>ترتيب العرض</Text>
              <TextInput
                style={styles.input}
                value={formData.display_order}
                onChangeText={(text) => setFormData({ ...formData, display_order: text })}
                placeholder="أدخل ترتيب العرض"
                keyboardType="number-pad"
              />

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>فئة نشطة</Text>
                <TouchableOpacity
                  style={[
                    styles.switch,
                    formData.is_active && styles.switchActive,
                  ]}
                  onPress={() => setFormData({ ...formData, is_active: !formData.is_active })}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      formData.is_active && styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
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
                onPress={handleSaveCategory}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingCategory ? 'تحديث' : 'حفظ'}
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
  categoryCard: {
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
  categoryImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  categoryImage: {
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
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
    marginBottom: 4,
  },
  categoryOrder: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
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
  categoryActions: {
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