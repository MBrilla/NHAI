import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

import { HapticTab } from '@/components/haptic-tab';
import { useNailScanColors } from '@/hooks/use-nailscan-colors';

export default function TabLayout() {
  const colors = useNailScanColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0F62FE',
        tabBarInactiveTintColor: '#8AA2C9',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <BlurView 
            intensity={90} 
            tint="light" 
            style={StyleSheet.absoluteFill} 
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          borderTopWidth: 1,
          borderTopColor: '#EAF2FF',
          backgroundColor: '#FFFFFF',
          height: 86,
          paddingBottom: 22,
          paddingTop: 12,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "time" : "time-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "information-circle" : "information-circle-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
