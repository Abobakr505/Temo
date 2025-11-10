import { Tabs } from 'expo-router';
import { Home, ShoppingCart, Newspaper, ClipboardList, BadgeInfo, BadgeAlert } from 'lucide-react-native';
import { useCart } from '@/contexts/CartContext';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function CustomTabIcon({ Icon, focused, color, size, badge, label }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const labelScale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, { damping: 10 });
    opacity.value = withSpring(focused ? 1 : 0.7, { damping: 15 });
    labelScale.value = withSpring(focused ? 1 : 0.8, { damping: 12 });
  }, [focused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: labelScale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={animatedIconStyle}>
        <Icon size={size} color={color} />
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, animatedLabelStyle, { color }]}>
        {label}
      </Animated.Text>
      {badge > 0 && (
        <Animated.View
          entering={withSpring({ damping: 15 })}
          style={styles.badge}
        >
          <Text style={styles.badgeText}>{badge}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { getTotalItems } = useCart();
  const cartItemsCount = getTotalItems();

  const tabs = [
    { name: 'index', Icon: Home, label: 'الرئيسية' },
    { name: 'menu', Icon: ClipboardList, label: 'المنيو' },
    { name: 'cart', Icon: ShoppingCart, label: 'السلة', badge: cartItemsCount },
    { name: 'news', Icon: Newspaper, label: 'الأخبار' },
    { name: 'about', Icon: BadgeInfo, label: 'من نحن' },
  ];

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === state.routes.indexOf(route);

        const tab = tabs.find(t => t.name === route.name);
        if (!tab) return null; // ← تجنب أي undefined

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const color = isFocused ? '#FF9500' : '#8E8E93';

        return (
          <TouchableOpacity
            key={route.name}
            onPress={onPress}
            style={styles.tabItem}
          >
            <CustomTabIcon
              Icon={tab.Icon}
              focused={isFocused}
              color={color}
              size={24}
              badge={tab.badge || 0}
              label={tab.label}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="news" />
      <Tabs.Screen name="about" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 80 : 70,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#FFB400',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    fontFamily: 'GraphicSchool-Regular',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});