import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Heart,
  UserStar 
} from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';

export default function AboutScreen() {
  const openPhone = () => {
    Linking.openURL('tel:+201150019897');
  };

  const openEmail = () => {
    Linking.openURL('mailto:info@temo.sa');
  };

  const openTiktok = () => {
    Linking.openURL('https://www.tiktok.com/@temofries');
  };
   const openTimor = () => {
    Linking.openURL('https://www.tiktok.com/@timo0r');
  };

  const openLocation = () => {
    Linking.openURL('https://maps.google.com');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#FF9500', '#FFCC00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.heroContent}>
          <Image
            source={require('@/assets/images/temo-logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Temo</Text>
          <Text style={styles.headerSubtitle}>من نحن</Text>
        </Animated.View>
      </LinearGradient>

      <Animated.View
        entering={FadeInUp.delay(200).duration(600)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>قصتنا</Text>
        <Text style={styles.storyText}>
          مرحباً بكم في تيمو، حيث نقدم ألذ وأطيب بطاطس مقرمشة في  
          بني سويف . شغفنا هو إدخال البهجة على كل عميل من خلال قائمتنا المُعدة
          بعناية، باستخدام أجود المكونات والوصفات الأصيلة.
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(300).duration(600)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>اتصل بنا</Text>

        <View style={styles.contactGrid}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={openLocation}
            activeOpacity={0.8}
          >
            <View style={styles.contactIcon}>
              <MapPin size={24} color="#FF9500" />
            </View>
            <Text style={styles.contactLabel}>الموقع</Text>
            <Text style={styles.contactValue}> بني سويف - الحي الأول</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={openPhone}
            activeOpacity={0.8}
          >
            <View style={styles.contactIcon}>
              <Phone size={24} color="#FF9500" />
            </View>
            <Text style={styles.contactLabel}>الهاتف</Text>
            <Text style={styles.contactValue}>01150019897</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={openEmail}
            activeOpacity={0.8}
          >
            <View style={styles.contactIcon}>
              <Mail size={24} color="#FF9500" />
            </View>
            <Text style={styles.contactLabel}>البريد الإلكتروني</Text>
            <Text style={styles.contactValue}>info@temo.sa</Text>
          </TouchableOpacity>

          <View style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Clock size={24} color="#FF9500" />
            </View>
            <Text style={styles.contactLabel}>ساعات العمل</Text>
            <Text style={styles.contactValue}>يومياً</Text>
            <Text style={styles.contactValueSmall}>10 صباحاً - 2 صباحاً</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(400).duration(600)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>تابعنا</Text>

        <View style={styles.socialGrid}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={openTiktok}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#000000', '#0f0f0fff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.socialGradient}
            >
              <Ionicons name="logo-tiktok" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.socialLabel}>تيك توك</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={openTimor}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFA500', '#FFB400']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.socialGradient}
            >
              <UserStar   size={28} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.socialLabel}> تيمور </Text>
          </TouchableOpacity>
         
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(500).duration(600)}
        style={styles.footer}
      >
                <Text style={styles.footerText}>صنع بحب  </Text>
                 <Heart size={20} color="#FF9500" fill="#FF9500" />
                <Text style={styles.footerText}>  من </Text>
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL('https://bakrhasan.netlify.app/');
                  }}
                >
                  <Text style={styles.footerDev}>ابوبكر حسن </Text>
                </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'GraphicSchool-Regular',
  },
  headerSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.95,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  storyText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#8E8E93',
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  contactGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  contactValueSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  socialGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    alignItems: 'center',
  },
  socialGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  socialLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  footer: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 2,
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: "IBMPlexSansArabic-Medium"
  },
  footerDev: {
    fontSize: 15,
    color: '#FF9500',
    fontFamily: "GraphicSchool-Regular"
  },
  footerVersion: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 8,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
  },
});