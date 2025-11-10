import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCart } from '@/contexts/CartContext';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const item = params.item ? JSON.parse(params.item as string) : null;

  if (!item) return <Text>لا يوجد منتج</Text>;

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#FFF5E6', '#FFE6CC']}
        style={styles.imageContainer}
      >
        <Text style={styles.placeholderEmoji}>🍟</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.name}>{item.name_ar}</Text>
        {item.description_ar && (
          <Text style={styles.description}>{item.description_ar}</Text>
        )}
        <Text style={styles.price}>{item.price.toFixed(2)} ج.م</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addToCart(item)}
        >
          <LinearGradient
            colors={['#FF9500', '#FF6B00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>+ أضف إلى السلة</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>عودة للمنيو</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  imageContainer: {
    width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: { fontSize: 120 },
  content: { padding: 20 },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF9500',
    marginBottom: 20,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  addButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  addButtonGradient: { paddingVertical: 14, paddingHorizontal: 20 },
  addButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  backButton: { alignItems: 'center', paddingVertical: 12 },
  backButtonText: { color: '#FF9500', fontSize: 16, fontWeight: '600' , fontFamily: 'IBMPlexSansArabic-Medium'},
});
