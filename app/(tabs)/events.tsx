import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, Tag, Newspaper, ArrowLeft } from 'lucide-react-native';
import { supabase, News, Offer } from '@/lib/supabase';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

type TabType = 'news' | 'offers';

export default function NewsScreen() {
  const [news, setNews] = useState<News[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('news');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [newsData, offersData] = await Promise.all([
        supabase.from('news').select('*').eq('is_active', true).order('published_date', { ascending: false }),
        supabase.from('offers').select('*').eq('is_active', true).order('created_at', { ascending: false })
      ]);

      if (newsData.data) setNews(newsData.data);
      if (offersData.data) setOffers(offersData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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

  const renderNewsContent = () => (
    <ScrollView 
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
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
      {news.length === 0 ? (
        <View style={styles.emptyState}>
          <Newspaper size={80} color="#E5E5EA" />
          <Text style={styles.emptyStateText}>لا توجد أخبار حالياً</Text>
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
  );

  const renderOffersContent = () => (
    <ScrollView 
      style={styles.content}
      contentContainerStyle={styles.offersContentContainer}
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
      {offers.length === 0 ? (
        <View style={styles.emptyState}>
          <Tag size={80} color="#E5E5EA" />
          <Text style={styles.emptyStateText}>لا توجد عروض حالياً</Text>
        </View>
      ) : (
        <View style={styles.offersGrid}>
          {offers.map((offer, index) => (
            <Animated.View
              key={offer.id}
              entering={FadeInUp.delay(index * 100).duration(600)}
              style={styles.offerCard}
            >
              <LinearGradient
                colors={['#FF9500', '#FF6B00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.offerGradient}
              >
                <View style={styles.offerHeader}>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {offer.discount_percentage}% خصم
                    </Text>
                  </View>
                  <View style={styles.dateContainer}>
                    <Calendar size={14} color="#FFFFFF" />
                    <Text style={styles.dateText}>
                      حتى {formatDate(offer.end_date)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.offerTitle}>{offer.title_ar}</Text>
                <Text style={styles.offerDescription}>
                  {offer.description_ar || offer.description}
                </Text>

                <View style={styles.offerFooter}>
                  <Text style={styles.offerPeriod}>
                    من {formatDate(offer.start_date)} إلى {formatDate(offer.end_date)}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#FF9500', '#FFCC00']}
          style={styles.loadingBackground}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
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
        <View style={styles.headerContent}>
          <Animated.View entering={FadeInDown.duration(500)}>
            <Text style={styles.headerTitle}>الأخبار والعروض</Text>
            <Text style={styles.headerDescription}>
              كن على اطلاع بآخر أخبارنا وعروضنا
            </Text>
          </Animated.View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'news' && styles.activeTab]}
            onPress={() => setActiveTab('news')}
          >
            <Newspaper size={20} color={activeTab === 'news' ? '#FF9500' : '#FFFFFF'} />
            <Text style={[styles.tabText, activeTab === 'news' && styles.activeTabText]}>
              الأخبار
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'offers' && styles.activeTab]}
            onPress={() => setActiveTab('offers')}
          >
            <Tag size={20} color={activeTab === 'offers' ? '#FF9500' : '#FFFFFF'} />
            <Text style={[styles.tabText, activeTab === 'offers' && styles.activeTabText]}>
              العروض
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {activeTab === 'news' ? renderNewsContent() : renderOffersContent()}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: "GraphicSchool-Regular",
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  activeTabText: {
    color: '#FF9500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  offersContentContainer: {
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
    color: '#8E8E93',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
    marginTop: 16,
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
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  newsTitle: {
    fontSize: 20,
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
    color: '#FFFFFF',
    marginTop: 8,
    textDecorationLine: 'underline',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  offersGrid: {
    gap: 16,
  },
  offerCard: {
    borderRadius: 20,
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  discountBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    fontSize: 14,
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  offerTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  offerDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 12,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  offerPeriod: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
});