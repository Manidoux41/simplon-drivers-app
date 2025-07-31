import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth-local';
import { Input, SecureInput } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { LoadingOverlay } from '../../components/ui/LoadingSpinner';
import { Logo } from '../../components/ui/Logo';
import { Colors } from '../../constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const colors = Colors.light;

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Erreur de connexion',
        error instanceof Error ? error.message : 'Une erreur est survenue lors de la connexion',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header avec logo */}
          <View style={styles.header}>
            <Logo size="large" showText={true} style={styles.logoContainer} />
            
            <Text style={[styles.title, { color: colors.text }]}>
              Connexion Conducteur
            </Text>
            
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Connectez-vous pour accéder à vos missions
            </Text>
          </View>

          {/* Formulaire de connexion */}
          <Card variant="elevated" style={styles.formCard}>
            <CardContent>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="votre.email@exemple.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                required
                containerStyle={styles.inputContainer}
              />

              <SecureInput
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                autoComplete="password"
                error={errors.password}
                required
                containerStyle={styles.inputContainer}
              />

              <Button
                title="Se connecter"
                onPress={handleLogin}
                loading={loading}
                disabled={!email || !password}
                style={styles.loginButton}
              />
            </CardContent>
          </Card>

          {/* Informations supplémentaires */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Vous n'avez pas de compte ?
            </Text>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Contactez votre administrateur pour créer un compte.
            </Text>
            
            <View style={styles.supportInfo}>
              <Text style={[styles.supportText, { color: colors.textSecondary }]}>
                Support: support@simplon-drivers.fr
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} text="Connexion en cours..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  loginButton: {
    marginTop: 10,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  supportInfo: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
  },
  supportText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
