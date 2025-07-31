import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useUsers } from '../../hooks/useUsers';
import { User } from '../../lib/database';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { PhoneButton } from '../../components/ui/PhoneButton';

export default function UsersManagement() {
  const router = useRouter();
  const { users, loading, error, createUser, updateUserRole, updateUserStatus, deleteUser } = useUsers();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    licenseNumber: '',
    phoneNumber: '',
    role: 'DRIVER' as 'DRIVER' | 'ADMIN',
    password: '',
  });

  const handleCreateUser = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName || 
        !formData.licenseNumber || !formData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    console.log('🔄 Création d\'un nouvel utilisateur:', {
      ...formData,
      password: '***hidden***'
    });

    const success = await createUser(formData);
    if (success) {
      console.log('✅ Utilisateur créé avec succès');
      Alert.alert('Succès', 'Utilisateur créé avec succès');
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        licenseNumber: '',
        phoneNumber: '',
        role: 'DRIVER',
        password: '',
      });
      setShowCreateForm(false);
    }
  };

  const handleToggleRole = (user: User) => {
    const newRole = user.role === 'DRIVER' ? 'ADMIN' : 'DRIVER';
    Alert.alert(
      'Changer le rôle',
      `Voulez-vous changer le rôle de ${user.firstName} ${user.lastName} en ${newRole === 'ADMIN' ? 'Administrateur' : 'Chauffeur'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          onPress: () => updateUserRole(user.id, newRole)
        }
      ]
    );
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = !user.isActive;
    Alert.alert(
      'Changer le statut',
      `Voulez-vous ${newStatus ? 'activer' : 'désactiver'} ${user.firstName} ${user.lastName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          onPress: () => updateUserStatus(user.id, newStatus)
        }
      ]
    );
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Supprimer l\'utilisateur',
      `Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => deleteUser(user.id)
        }
      ]
    );
  };

  const getRoleColor = (role: string) => {
    return role === 'ADMIN' ? '#ef4444' : '#3b82f6';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#10b981' : '#6b7280';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec logo */}
      <Header 
        title="Gestion des Utilisateurs" 
        showLogo={true}
        style={styles.headerStyle}
      />
      
      {/* Bouton de retour et d'ajout */}
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setShowCreateForm(!showCreateForm)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={Colors.light.primary} />
          <Text style={[styles.addText, { color: Colors.light.primary }]}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Formulaire de création */}
        {showCreateForm && (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Créer un nouvel utilisateur</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Prénom *"
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Nom *"
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Numéro de permis *"
              value={formData.licenseNumber}
              onChangeText={(text) => setFormData({ ...formData, licenseNumber: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Téléphone (optionnel)"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Mot de passe *"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
            />

            {/* Sélection du rôle */}
            <View style={styles.roleSelector}>
              <Text style={styles.roleLabel}>Rôle :</Text>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'DRIVER' && styles.roleButtonActive
                ]}
                onPress={() => setFormData({ ...formData, role: 'DRIVER' })}
              >
                <Text style={[
                  styles.roleButtonText,
                  formData.role === 'DRIVER' && styles.roleButtonTextActive
                ]}>
                  Chauffeur
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'ADMIN' && styles.roleButtonActive
                ]}
                onPress={() => setFormData({ ...formData, role: 'ADMIN' })}
              >
                <Text style={[
                  styles.roleButtonText,
                  formData.role === 'ADMIN' && styles.roleButtonTextActive
                ]}>
                  Administrateur
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formButtons}>
              <Button
                title="Annuler"
                onPress={() => setShowCreateForm(false)}
                variant="ghost"
                style={styles.cancelButton}
              />
              <Button
                title="Créer"
                onPress={handleCreateUser}
                style={styles.createButton}
              />
            </View>
          </View>
        )}

        {/* Liste des utilisateurs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Utilisateurs ({users.length})
          </Text>
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {users.map((user) => (
            <View key={user.id} style={styles.userItem}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userLicense}>
                  Permis: {user.licenseNumber}
                </Text>
                {user.phoneNumber && (
                  <View style={styles.phoneContainer}>
                    <Text style={styles.userPhone}>
                      Tél: {user.phoneNumber}
                    </Text>
                    <PhoneButton phoneNumber={user.phoneNumber} size={18} />
                  </View>
                )}
                
                <View style={styles.userBadges}>
                  <View style={[styles.badge, { backgroundColor: getRoleColor(user.role) }]}>
                    <Text style={styles.badgeText}>
                      {user.role === 'ADMIN' ? 'Admin' : 'Chauffeur'}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: getStatusColor(user.isActive) }]}>
                    <Text style={styles.badgeText}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleToggleRole(user)}
                >
                  <Ionicons name="swap-horizontal" size={20} color={Colors.light.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleToggleStatus(user)}
                >
                  <Ionicons 
                    name={user.isActive ? "pause" : "play"} 
                    size={20} 
                    color={user.isActive ? "#f59e0b" : "#10b981"} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteUser(user)}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStyle: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  createForm: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  roleSelector: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  roleButton: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  roleButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  roleButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  createButton: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  userItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userLicense: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
});
