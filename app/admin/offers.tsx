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
  Percent,
  ArrowLeft,
  Calendar,
} from 'lucide-react-native';
import { supabase, Offer } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AdminOffersScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    discount_percentage: '',
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
    is_active: true,
  });

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('خطأ', 'فشل في تحميل العروض');
    } else {
      setOffers(data || []);
    }
  };

  const filteredOffers = offers.filter(offer =>
    offer.title_ar.includes(searchQuery) ||
    offer.title_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveOffer = async () => {
    if (!formData.title_ar || !formData.discount_percentage) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.start_date >= formData.end_date) {
      Alert.alert('خطأ', 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }

    setIsLoading(true);
    try {
      const offerData = {
        ...formData,
        discount_percentage: parseFloat(formData.discount_percentage),
        start_date: formData.start_date.toISOString().split('T')[0],
        end_date: formData.end_date.toISOString().split('T')[0],
      };

      if (editingOffer) {
        const { error } = await supabase
          .from('offers')
          .update(offerData)
          .eq('id', editingOffer.id);

        if (error) throw error;
        Alert.alert('نجاح', 'تم تحديث العرض بنجاح');
      } else {
        const { error } = await supabase
          .from('offers')
          .insert([offerData]);

        if (error) throw error;
        Alert.alert('نجاح', 'تم إضافة العرض بنجاح');
      }

      resetForm();
      loadOffers();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ العرض');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title_ar: offer.title_ar,
      title_en: offer.title_en || '',
      description_ar: offer.description_ar || '',
      description_en: offer.description_en || '',
      discount_percentage: offer.discount_percentage.toString(),
      start_date: new Date(offer.start_date),
      end_date: new Date(offer.end_date),
      is_active: offer.is_active,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (offer: Offer) => {
    Alert.alert(
      'حذف العرض',
      `هل أنت متأكد من حذف ${offer.title_ar}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('offers')
              .delete()
              .eq('id', offer.id);

            if (error) {
              Alert.alert('خطأ', 'فشل في حذف العرض');
            } else {
              Alert.alert('نجاح', 'تم حذف العرض بنجاح');
              loadOffers();
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      title_ar: '',
      title_en: '',
      description_ar: '',
      description_en: '',
      discount_percentage: '',
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      is_active: true,
    });
    setEditingOffer(null);
    setIsModalVisible(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA');
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
          <Text style={styles.headerTitle}>إدارة العروض</Text>
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
            placeholder="ابحث عن العروض..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {filteredOffers.length === 0 ? (
          <View style={styles.emptyState}>
            <Percent size={80} color="#E5E5EA" />
            <Text style={styles.emptyStateText}>لا توجد عروض</Text>
          </View>
        ) : (
          filteredOffers.map((offer, index) => (
            <Animated.View
              key={offer.id}
              entering={FadeInUp.delay(index * 50).duration(500)}
              style={styles.offerCard}
            >
              <LinearGradient
                colors={['#FF9500', '#FF6B00']}
                style={styles.offerGradient}
              >
                <View style={styles.offerHeader}>
                  <Text style={styles.offerTitle}>{offer.title_ar}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {offer.discount_percentage}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.offerDescription}>
                  {offer.description_ar}
                </Text>
                <View style={styles.offerDates}>
                  <Text style={styles.dateText}>
                    من {new Date(offer.start_date).toLocaleDateString('ar-SA')}
                  </Text>
                  <Text style={styles.dateText}>
                    إلى {new Date(offer.end_date).toLocaleDateString('ar-SA')}
                  </Text>
                </View>
                <View style={styles.offerActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(offer)}
                  >
                    <Edit3 size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(offer)}
                  >
                    <Trash2 size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Modal for Add/Edit Offer */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
            </Text>

            <ScrollView style={styles.form}>
              <Text style={styles.inputLabel}>عنوان العرض (عربي) *</Text>
              <TextInput
                style={styles.input}
                value={formData.title_ar}
                onChangeText={(text) => setFormData({ ...formData, title_ar: text })}
                placeholder="أدخل عنوان العرض بالعربية"
              />

              <Text style={styles.inputLabel}>عنوان العرض (إنجليزي)</Text>
              <TextInput
                style={styles.input}
                value={formData.title_en}
                onChangeText={(text) => setFormData({ ...formData, title_en: text })}
                placeholder="أدخل عنوان العرض بالإنجليزية"
              />

              <Text style={styles.inputLabel}>الوصف (عربي)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description_ar}
                onChangeText={(text) => setFormData({ ...formData, description_ar: text })}
                placeholder="أدخل وصف العرض بالعربية"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>نسبة الخصم (%) *</Text>
              <TextInput
                style={styles.input}
                value={formData.discount_percentage}
                onChangeText={(text) => setFormData({ ...formData, discount_percentage: text })}
                placeholder="أدخل نسبة الخصم"
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>تاريخ البداية</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Calendar size={20} color="#8E8E93" />
                <Text style={styles.dateText}>
                  {formatDate(formData.start_date)}
                </Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>تاريخ النهاية</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Calendar size={20} color="#8E8E93" />
                <Text style={styles.dateText}>
                  {formatDate(formData.end_date)}
                </Text>
              </TouchableOpacity>

              {showStartDatePicker && (
                <DateTimePicker
                  value={formData.start_date}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartDatePicker(false);
                    if (date) {
                      setFormData({ ...formData, start_date: date });
                    }
                  }}
                />
              )}

              {showEndDatePicker && (
                <DateTimePicker
                  value={formData.end_date}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndDatePicker(false);
                    if (date) {
                      setFormData({ ...formData, end_date: date });
                    }
                  }}
                />
              )}

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>عرض نشط</Text>
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
                onPress={handleSaveOffer}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingOffer ? 'تحديث' : 'حفظ'}
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
  offerCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  offerGradient: {
    padding: 20,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
    flex: 1,
    textAlign: 'right',
  },
  discountBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  offerDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
    marginBottom: 12,
  },
  offerDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  offerActions: {
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
    fontWeight: '700',
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