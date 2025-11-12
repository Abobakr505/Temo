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
  Newspaper,
  ArrowLeft,
  Calendar,
} from 'lucide-react-native';
import { supabase, News } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';

export default function AdminNewsScreen() {
  const [news, setNews] = useState<News[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

 const loadNews = async () => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('published_date', { ascending: false });

  if (error) {
    Toast.show({
      type: 'error',
      text1: 'خطأ',
      text2: 'فشل في تحميل الأخبار',
      position: 'top',
    });
  } else {
    setNews(data || []);
  }
};

const handleSaveNews = async () => {
  if (!formData.title_ar || !formData.content_ar) {
    Toast.show({
      type: 'error',
      text1: 'خطأ',
      text2: 'يرجى ملء جميع الحقول المطلوبة',
      position: 'top',
    });
    return;
  }

  setIsLoading(true);
  try {
    const newsData = {
      ...formData,
      published_date: formData.published_date.toISOString().split('T')[0],
    };

    if (editingNews) {
      const { error } = await supabase
        .from('news')
        .update(newsData)
        .eq('id', editingNews.id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'تم التحديث 🎉',
        text2: 'تم تحديث الخبر بنجاح',
        position: 'top',
      });
    } else {
      const { error } = await supabase
        .from('news')
        .insert([newsData]);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'تم الإضافة 🎉',
        text2: 'تم إضافة الخبر بنجاح',
        position: 'top',
      });
    }

    resetForm();
    loadNews();
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'خطأ',
      text2: 'فشل في حفظ الخبر',
      position: 'top',
    });
  } finally {
    setIsLoading(false);
  }
};

const handleDelete = (newsItem: News) => {
  Alert.alert(
    'حذف الخبر',
    `هل أنت متأكد من حذف ${newsItem.title_ar}؟`,
    [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', newsItem.id);

          if (error) {
            Toast.show({
              type: 'error',
              text1: 'خطأ',
              text2: 'فشل في حذف الخبر',
              position: 'top',
            });
          } else {
            Toast.show({
              type: 'success',
              text1: 'تم الحذف 🎉',
              text2: 'تم حذف الخبر بنجاح',
              position: 'top',
            });
            loadNews();
          }
        },
      },
    ]
  );
};

  const resetForm = () => {
    setFormData({
      title_ar: '',
      content_ar: '',
      published_date: new Date(),
      is_active: true,
    });
    setEditingNews(null);
    setIsModalVisible(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA');
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
          <Text style={styles.headerTitle}>إدارة الأخبار</Text>
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
            placeholder="ابحث عن الأخبار..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {filteredNews.length === 0 ? (
          <View style={styles.emptyState}>
            <Newspaper size={80} color="#E5E5EA" />
            <Text style={styles.emptyStateText}>لا توجد أخبار</Text>
          </View>
        ) : (
          filteredNews.map((newsItem, index) => (
            <Animated.View
              key={newsItem.id}
              entering={FadeInUp.delay(index * 50).duration(500)}
              style={styles.newsCard}
            >
              <LinearGradient
                colors={['#FFCC00', '#FF9500']}
                style={styles.newsGradient}
              >
                <View style={styles.newsHeader}>
                  <Text style={styles.newsDate}>
                    {new Date(newsItem.published_date).toLocaleDateString('ar-SA')}
                  </Text>
                </View>
                <Text style={styles.newsTitle}>{newsItem.title_ar}</Text>
                <Text style={styles.newsContent} numberOfLines={2}>
                  {newsItem.content_ar}
                </Text>
                <View style={styles.newsActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(newsItem)}
                  >
                    <Edit3 size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(newsItem)}
                  >
                    <Trash2 size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Modal for Add/Edit News */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingNews ? 'تعديل الخبر' : 'إضافة خبر جديد'}
            </Text>

            <ScrollView style={styles.form}>
              <Text style={styles.inputLabel}>عنوان الخبر (عربي) *</Text>
              <TextInput
                style={styles.input}
                value={formData.title_ar}
                onChangeText={(text) => setFormData({ ...formData, title_ar: text })}
                placeholder="أدخل عنوان الخبر بالعربية"
              />


              <Text style={styles.inputLabel}>محتوى الخبر (عربي) *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.content_ar}
                onChangeText={(text) => setFormData({ ...formData, content_ar: text })}
                placeholder="أدخل محتوى الخبر بالعربية"
                multiline
                numberOfLines={6}
              />



              <Text style={styles.inputLabel}>تاريخ النشر</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color="#8E8E93" />
                <Text style={styles.dateText}>
                  {formatDate(formData.published_date)}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.published_date}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setFormData({ ...formData, published_date: date });
                    }
                  }}
                />
              )}

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>خبر نشط</Text>
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
                onPress={handleSaveNews}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingNews ? 'تحديث' : 'حفظ'}
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
  newsCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  newsGradient: {
    padding: 20,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  newsDate: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  newsTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  newsContent: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 12,
  },
  newsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    maxHeight: 500,
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    justifyContent: 'flex-end',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
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