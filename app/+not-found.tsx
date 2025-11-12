import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={['#FF6B00', '#FF9500', '#FFCC00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        >
          <View style={styles.content}>
            {/* الرمز */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <AlertCircle size={80} color="#FF9500" />
              </View>
            </View>

            {/* النصوص */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>404</Text>
              <Text style={styles.subtitle}>الصفحة غير موجودة</Text>
              <Text style={styles.description}>
                عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها
              </Text>
            </View>

            {/* الأزرار */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#FFF5E6']}
                  style={styles.buttonGradient}
                >
                  <Home size={24} color="#FF9500" />
                  <Text style={styles.primaryButtonText}>العودة للرئيسية</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <View style={styles.secondaryButtonContent}>
                  <ArrowLeft size={24} color="#FFFFFF" />
                  <Text style={styles.secondaryButtonText}>العودة للخلف</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* التذييل */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>تيمو - أفضل بطاطس في بني سويف</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 80,
    color: '#FFFFFF',
    fontFamily: 'GraphicSchool-Regular',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  primaryButton: {
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  secondaryButton: {
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 18,
    color: '#FF9500',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  secondaryButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
});