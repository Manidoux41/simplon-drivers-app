import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  pressable?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  action?: React.ReactNode;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({
  children,
  style,
  onPress,
  pressable = false,
  variant = 'default',
  padding = 'medium',
}: CardProps) {
  const colors = Colors.light;

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: 12,
    };

    const paddingStyles: Record<string, ViewStyle> = {
      none: {},
      small: { padding: 12 },
      medium: { padding: 16 },
      large: { padding: 20 },
    };

    const variantStyles: Record<string, ViewStyle> = {
      default: {
        backgroundColor: colors.card,
      },
      elevated: {
        backgroundColor: colors.card,
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        elevation: 4,
      },
      outlined: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      },
    };

    return {
      ...baseStyle,
      ...paddingStyles[padding],
      ...variantStyles[variant],
    };
  };

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        style={[getCardStyle(), style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
}

export function CardHeader({
  title,
  subtitle,
  titleStyle,
  subtitleStyle,
  action,
}: CardHeaderProps) {
  const colors = Colors.light;

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={[styles.title, { color: colors.text }, titleStyle]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }, subtitleStyle]}>
            {subtitle}
          </Text>
        )}
      </View>
      {action && <View style={styles.headerAction}>{action}</View>}
    </View>
  );
}

export function CardContent({ children, style }: CardContentProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

export function CardFooter({ children, style }: CardFooterProps) {
  const colors = Colors.light;

  return (
    <View style={[styles.footer, { borderTopColor: colors.border }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerAction: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  content: {
    marginVertical: 8,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
