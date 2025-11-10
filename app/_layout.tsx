import { Slot, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CartProvider } from "@/contexts/CartContext";
import { useFonts } from "expo-font";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { useEffect, useState } from "react";

export default function RootLayout() {
  useFrameworkReady();

  const [loaded] = useFonts({
    "IBMPlexSansArabic-Regular": require("../assets/fonts/IBMPlexSansArabic-Regular.ttf"),
    "IBMPlexSansArabic-Medium": require("../assets/fonts/IBMPlexSansArabic-Medium.ttf"),
    "IBMPlexSansArabic-Bold": require("../assets/fonts/IBMPlexSansArabic-Bold.ttf"),
    "GraphicSchool-Regular": require("../assets/fonts/GraphicSchool-Regular.ttf"),
  });

  const router = useRouter();


  return (
    <CartProvider>
      {/* Slot يجب أن يكون موجود دائمًا حتى يتم mount */}
      <Slot />
      <StatusBar style="auto" />
    </CartProvider>
  );
}
