import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { Colors } from '../../constants/Colors';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: any;
}

export function Logo({ size = 'medium', showText = true, style }: LogoProps) {
  const getLogoSize = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40 };
      case 'medium':
        return { width: 60, height: 60 };
      case 'large':
        return { width: 120, height: 120 };
      default:
        return { width: 60, height: 60 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 18;
      case 'large':
        return 24;
      default:
        return 18;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.logoWrapper, getLogoSize()]}>
        <Image
          source={require('../../assets/images/logo-simplon.jpg')}
          style={[styles.logo, getLogoSize()]}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <Text style={[styles.text, { fontSize: getTextSize() }]}>
          Simplon Drivers
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    borderRadius: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    borderRadius: 12,
  },
  text: {
    fontWeight: '600',
    color: Colors.light.primary,
    marginTop: 8,
    textAlign: 'center',
  },
});
