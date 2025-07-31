import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Logo } from './Logo';
import { Colors } from '../../constants/Colors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  style?: any;
}

export function Header({ title, subtitle, showLogo = false, style }: HeaderProps) {
  const colors = Colors.light;

  return (
    <View style={[styles.header, { backgroundColor: colors.surface }, style]}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      {showLogo && (
        <Logo size="small" showText={false} style={styles.logo} />
      )}
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  logo: {
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
