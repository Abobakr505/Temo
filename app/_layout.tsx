import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CartProvider } from "@/contexts/CartContext";
import { useFonts } from "expo-font";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { useEffect, useState } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { ActivityIndicator, View } from "react-native";
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
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
  const toastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: "#22c55e",
          borderLeftWidth: 6,
          backgroundColor: "#f0fdf4",
          borderRadius: 14,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          color: "#166534",
          textAlign: "right",
          fontFamily: "IBMPlexSansArabic-Bold",

        }}
        text2Style={{
          fontSize: 14,
          color: "#15803d",
          textAlign: "right",
          fontFamily: "IBMPlexSansArabic-Medium",

        }}
      />
    ),

    error: (props) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: "#ef4444",
          borderLeftWidth: 6,
          backgroundColor: "#fef2f2",
          borderRadius: 14,
        }}
        text1Style={{
          fontSize: 16,
          color: "#991b1b",
          textAlign: "right",
          fontFamily: "IBMPlexSansArabic-Bold",

        }}
        text2Style={{
          fontSize: 14,
          color: "#b91c1c",
          textAlign: "right",
          fontFamily: "IBMPlexSansArabic-Medium",

        }}
      />
    ),

    info: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: "#3b82f6",
          borderLeftWidth: 6,
          backgroundColor: "#eff6ff",
          borderRadius: 14,
        }}
        text1Style={{
          fontSize: 16,
          textAlign: "right",
          fontFamily: "IBMPlexSansArabic-Bold",
        }}
        text2Style={{
          fontSize: 14,
          color: "#1d4ed8",
          textAlign: "right",
          fontFamily: "IBMPlexSansArabic-Medium",
        }}
      />
    ),
  };

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
        <Toast config={toastConfig} />
        <StatusBar style="auto" />
      </CartProvider>
    </AdminAuthProvider>
  );
}