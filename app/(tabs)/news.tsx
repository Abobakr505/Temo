import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock } from 'lucide-react-native';
import { supabase, News } from '@/lib/supabase';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function NewsScreen() {
  const [news, setNews] = useState<News[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    const { data } = await supabase
      .from('news')
      .select('*')
      .eq('is_active', true)
      .order('published_date', { ascending: false });

    if (data) setNews(data);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF9500', '#FFCC00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.headerTitle}>الأخبار و العروض</Text>
          <Text style={styles.headerDescription}>
            كن على اطلاع بآخر أخبارنا
          </Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {news.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>لا توجد أخبار</Text>
          </View>
        ) : (
          news.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInUp.delay(index * 100).duration(600)}
            >
              <TouchableOpacity
                style={styles.newsCard}
                onPress={() => toggleExpanded(item.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    index % 3 === 0
                      ? ['#FF9500', '#FF6B00']
                      : index % 3 === 1
                      ? ['#FFCC00', '#FF9500']
                      : ['#FF6B00', '#FF4500']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.newsGradient}
                >
                  <View style={styles.newsHeader}>
                    <View style={styles.dateContainer}>
                      <Calendar size={16} color="#FFFFFF" />
                      <Text style={styles.dateText}>
                        {formatDate(item.published_date)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.newsTitle}>{item.title_ar}</Text>

                  {expandedId === item.id && (
                    <Animated.View
                      entering={FadeInDown.duration(300)}
                      style={styles.newsContent}
                    >
                      <View style={styles.contentDivider} />
                      <Text style={styles.newsText}>{item.content_ar}</Text>
                    </Animated.View>
                  )}

                  <Text style={styles.readMore}>
                    {expandedId === item.id ? 'عرض أقل' : 'اقرأ المزيد'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))
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
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },    
  headerTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: "GraphicSchool-Regular",
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 20,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
  },
  newsCard: {
    marginBottom: 16,
    borderRadius: 20,
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
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  newsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  newsContent: {
    marginTop: 12,
  },
  contentDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 12,
  },
  newsText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textDecorationLine: 'underline',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
});