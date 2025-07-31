import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: ViewStyle;
  overlay?: boolean;
  backgroundColor?: string;
}

export function LoadingSpinner({
  size = 'large',
  color,
  text,
  style,
  overlay = false,
  backgroundColor,
}: LoadingSpinnerProps) {
  const colors = Colors.light;
  const spinnerColor = color || colors.primary;

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    ...(overlay && {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: backgroundColor || colors.overlay,
      zIndex: 1000,
    }),
  };

  return (
    <View style={[containerStyle, style]}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && (
        <Text style={[styles.text, { color: colors.text }]}>
          {text}
        </Text>
      )}
    </View>
  );
}

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  backgroundColor?: string;
}

export function LoadingOverlay({ visible, text, backgroundColor }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <LoadingSpinner
      overlay
      text={text}
      backgroundColor={backgroundColor}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
