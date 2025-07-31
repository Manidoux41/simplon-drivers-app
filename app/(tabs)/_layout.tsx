import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useAuth } from '../../hooks/useAuth-local';
import { Colors } from '../../constants/Colors';

// Composant pour les icônes temporaires
function TabBarIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

export default function TabLayout() {
  const { user } = useAuth();
  const colors = Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau de bord',
          tabBarIcon: ({ color }) => (
            <TabBarIcon emoji="🏠" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'Missions',
          tabBarIcon: ({ color }) => (
            <TabBarIcon emoji="🚌" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color }) => (
            <TabBarIcon emoji="📋" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <TabBarIcon emoji="👤" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Administration',
          tabBarIcon: ({ color }) => (
            <TabBarIcon emoji="⚙️" color={color} />
          ),
          href: user?.role === 'ADMIN' ? '/admin' : null,
        }}
      />
    </Tabs>
  );
}
