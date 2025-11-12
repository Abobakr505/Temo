import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Linking,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  ZoomIn,
  SlideInRight,
  SlideInLeft 
} from 'react-native-reanimated';
import { ChefHat, Shield, Sparkles, Star } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScrollView>
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* الخلفية المتدرجة */}
      <LinearGradient
        colors={['#FF9500', '#FF9500', '#FFCC00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        {/* النجوم المتحركة في الخلفية */}
        <View style={styles.starsContainer}>
          {[...Array(20)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.star,
                {
                  top: Math.random() * height,
                  left: Math.random() * width,
                },
              ]}
              entering={FadeInDown.delay(index * 100).duration(1000)}
            >
              <Sparkles size={16} color="#FFFFFF" fill="#FFFFFF" />
            </Animated.View>
          ))}
        </View>

        {/* المحتوى الرئيسي */}
        <View style={styles.content}>
          {/* الشعار والعنوان */}
          <Animated.View 
            entering={ZoomIn.duration(1000).springify()}
            style={styles.logoSection}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#FFF5E6']}
                style={styles.logoBackground}
              >
                <Image
                  source={require('@/assets/images/temo-logo.jpeg')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
            
            <Animated.Text 
              entering={FadeInDown.delay(200).duration(800)}
              style={styles.title}
            >
              Temo
            </Animated.Text>
            
            <Animated.Text 
              entering={FadeInDown.delay(400).duration(800)}
              style={styles.subtitle}
            >
              أفضل بطاطس في بني سويف
            </Animated.Text>
            
            <Animated.View 
              entering={FadeInDown.delay(600).duration(800)}
              style={styles.tagline}
            >
              <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.taglineText}>طعم لا يُنسى</Text>
              <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
            </Animated.View>
          </Animated.View>

          {/* الأزرار */}
          <Animated.View 
            entering={FadeInUp.delay(800).duration(1000).springify()}
            style={styles.buttonsContainer}
          >
            {/* زر الدخول للتطبيق */}
            <Animated.View
              entering={SlideInRight.delay(1000).duration(800)}
            >
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#FFF5E6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonContent}>
                    <ChefHat size={24} color="#FF9500" />
                    <View style={styles.buttonTextContainer}>
                      <Text style={[styles.buttonText, styles.primaryButtonText , ]}>
                        الدخول للتطبيق
                      </Text>
                      <Text style={[styles.buttonSubtext , styles.primaryButtonText ]}>
                        استعرض القائمة واطلب الآن
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* زر لوحة التحكم */}
            <Animated.View
              entering={SlideInLeft.delay(1200).duration(800)}
            >
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => router.push('/admin/login')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFCC00', '#FF9500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonContent}>
                    <Shield size={24} color="#FFFFFF" />
                    <View style={styles.buttonTextContainer}>
                      <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                        لوحة التحكم
                      </Text>
                      <Text style={[styles.buttonSubtext, styles.secondaryButtonSubtext ]}>
                        إدارة المحتوى والطلبات
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* الشعار في الأسفل */}
          <Animated.View 
            entering={FadeInUp.delay(1400).duration(800)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>
              صنع بحب ❤️ من 
            </Text>
            <TouchableOpacity
                      onPress={() => {
                        Linking.openURL('https://bakrhasan.netlify.app/');
                      }}
                    >
                      <Text style={styles.footerDev}>ابوبكر حسن </Text>
                    </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
</ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    marginBottom: 24,
    elevation: 10,
  },
  logoBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 64,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    fontFamily: 'GraphicSchool-Regular',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 22,
    color: '#FFFFFF',
    opacity: 0.95,
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginBottom: 16,
    textAlign: 'center',
  },
  tagline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8 , 
  },
  taglineText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButton: {
    height: 80,
  },
  secondaryButton: {
    height: 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonText: {
    fontSize: 20,
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 4,
  },
  primaryButtonText: {
    color: '#FF9500',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },
  buttonSubtext: {
    fontSize: 14,
    fontFamily: 'IBMPlexSansArabic-Medium',
    opacity: 0.8,
  },
  secondaryButtonSubtext: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  footer: {
    marginTop: 20,
        alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 4,
    marginBottom: 8 , 
  },
  footerText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  
  footerDev: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: "GraphicSchool-Regular"
  },
});