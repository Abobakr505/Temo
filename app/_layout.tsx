import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CartProvider } from "@/contexts/CartContext";
import { useFonts } from "expo-font";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { useEffect, useState } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { ActivityIndicator, View } from "react-native";

function RouteProtection() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (isLoading) return;

    const inAdminGroup = segments[0] === 'admin';
    
    if (inAdminGroup && !isAuthenticated) {
      // Redirect to login if not authenticated and trying to access admin routes
      router.replace('/admin/login');
    } else if (isAuthenticated && segments[0] === 'admin' && segments[1] === 'login') {
      // Redirect to dashboard if already authenticated and trying to access login
      router.replace('/admin/dashboard');
    }
  }, [segments, isAuthenticated, isLoading]);

  return null;
}

export default function RootLayout() {
  useFrameworkReady();

  const [loaded] = useFonts({
    "IBMPlexSansArabic-Regular": require("../assets/fonts/IBMPlexSansArabic-Regular.ttf"),
    "IBMPlexSansArabic-Medium": require("../assets/fonts/IBMPlexSansArabic-Medium.ttf"),
    "IBMPlexSansArabic-Bold": require("../assets/fonts/IBMPlexSansArabic-Bold.ttf"),
    "GraphicSchool-Regular": require("../assets/fonts/GraphicSchool-Regular.ttf"),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF9500" />
      </View>
    );
  }

  return (
    <AdminAuthProvider>
      <CartProvider>
        <RouteProtection />
        <Slot />
        <StatusBar style="auto" />
      </CartProvider>
    </AdminAuthProvider>
  );
}