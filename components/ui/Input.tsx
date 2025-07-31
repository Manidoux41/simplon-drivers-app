import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  required?: boolean;
  disabled?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  variant = 'outlined',
  size = 'medium',
  required = false,
  disabled = false,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const colors = Colors.light;

  const getContainerStyle = (): ViewStyle => {
    const sizeStyles: Record<string, ViewStyle> = {
      small: { minHeight: 36 },
      medium: { minHeight: 44 },
      large: { minHeight: 52 },
    };

    const variantStyles: Record<string, ViewStyle> = {
      default: {
        borderBottomWidth: 1,
        borderBottomColor: error 
          ? colors.error 
          : isFocused 
            ? colors.primary 
            : colors.border,
      },
      filled: {
        backgroundColor: disabled ? colors.disabled : colors.surface,
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: error 
          ? colors.error 
          : isFocused 
            ? colors.primary 
            : 'transparent',
      },
      outlined: {
        borderWidth: 1,
        borderColor: error 
          ? colors.error 
          : isFocused 
            ? colors.primary 
            : colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: disabled ? colors.surface : colors.background,
      },
    };

    return {
      flexDirection: 'row',
      alignItems: 'center',
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getInputStyle = (): TextStyle => {
    const sizeStyles: Record<string, TextStyle> = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    return {
      flex: 1,
      color: disabled ? colors.textSecondary : colors.text,
      ...sizeStyles[size],
    };
  };

  return (
    <View style={containerStyle}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }, labelStyle]}>
            {label}
            {required && <Text style={{ color: colors.error }}> *</Text>}
          </Text>
        </View>
      )}

      <View style={getContainerStyle()}>
        {leftIcon && (
          <View style={styles.leftIcon}>{leftIcon}</View>
        )}

        <TextInput
          style={[getInputStyle(), inputStyle]}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          editable={!disabled}
          placeholderTextColor={colors.textSecondary}
          {...textInputProps}
        />

        {rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}

      {hint && !error && (
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          {hint}
        </Text>
      )}
    </View>
  );
}

interface SecureInputProps extends Omit<InputProps, 'rightIcon'> {
  showPasswordIcon?: React.ReactNode;
  hidePasswordIcon?: React.ReactNode;
}

export function SecureInput({
  showPasswordIcon,
  hidePasswordIcon,
  ...props
}: SecureInputProps) {
  const [isSecure, setIsSecure] = useState(true);
  const colors = Colors.light;

  const defaultShowIcon = (
    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>👁️</Text>
  );
  const defaultHideIcon = (
    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>🙈</Text>
  );

  const toggleSecure = () => setIsSecure(!isSecure);

  return (
    <Input
      {...props}
      secureTextEntry={isSecure}
      rightIcon={
        <TouchableOpacity onPress={toggleSecure} style={styles.toggleButton}>
          {isSecure 
            ? (showPasswordIcon || defaultShowIcon)
            : (hidePasswordIcon || defaultHideIcon)
          }
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
  },
  toggleButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '400',
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '400',
  },
});
