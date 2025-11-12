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
  Tag,
  ArrowLeft,
} from 'lucide-react-native';
import { supabase, Category } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

export default function AdminCategoriesScreen() {
 const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name_ar: '',
    display_order: '0',
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
  try {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (error) {
      console.error('Error loading categories:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل في تحميل الفئات',
        position: 'top',
      });
    } else {
      setCategories(data || []);
    }
  } catch (error) {
    console.error('Error:', error);
    Toast.show({
      type: 'error',
      text1: 'خطأ',
      text2: 'فشل في تحميل الفئات',
      position: 'top',
    });
  } finally {
    setIsLoading(false);
  }
};


  const filteredCategories = categories.filter(category =>
    category.name_ar.includes(searchQuery)
  );

 const handleSaveCategory = async () => {
  if (!formData.name_ar) {
    Toast.show({
      type: 'error',
      text1: 'خطأ',
      text2: 'يرجى إدخال اسم الفئة بالعربية',
      position: 'top',
    });
    return;
  }

  setFormLoading(true);
  try {
    const categoryData = {
      name_ar: formData.name_ar,
      display_order: parseInt(formData.display_order) || 0,
      is_active: formData.is_active,
    };

    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', editingCategory.id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'نجاح',
        text2: 'تم تحديث الفئة بنجاح',
        position: 'top',
      });
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([categoryData]);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'نجاح',
        text2: 'تم إضافة الفئة بنجاح',
        position: 'top',
      });
    }

    resetForm();
    loadCategories();
  } catch (error) {
    console.error('Error saving category:', error);
    Toast.show({
      type: 'error',
      text1: 'خطأ',
      text2: 'فشل في حفظ الفئة',
      position: 'top',
    });
  } finally {
    setFormLoading(false);
  }
};

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name_ar: category.name_ar,
      display_order: category.display_order.toString(),
      is_active: category.is_active,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (category: Category) => {
  Toast.show({
    type: 'info',
    text1: 'تأكيد الحذف',
    text2: `هل أنت متأكد من حذف ${category.name_ar}?`,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    onPress: async () => {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', category.id);

        if (error) throw error;

        Toast.show({
          type: 'success',
          text1: 'نجاح',
          text2: 'تم حذف الفئة بنجاح',
          position: 'top',
        });

        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        Toast.show({
          type: 'error',
          text1: 'خطأ',
          text2: 'فشل في حذف الفئة',
          position: 'top',
        });
      }
    },
  });
};

  const resetForm = () => {
    setFormData({
      name_ar: '',
      display_order: '0',
      is_active: true,
    });
    setEditingCategory(null);
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
          <Text style={styles.headerTitle}>إدارة الفئات</Text>
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
        {filteredCategories.length === 0 ? (
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
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveCategory}
                disabled={isLoading}
              >
                {isLoading ? (
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
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
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

  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
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
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});