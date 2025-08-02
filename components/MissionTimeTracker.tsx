import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Button } from './ui/Button';
import { databaseService, MissionTimeEntry } from '../lib/database';

interface MissionTimeTrackerProps {
  missionId: string;
  isVisible: boolean;
  onClose: () => void;
  onTimesSaved?: () => void;
  initialTimes?: MissionTimeEntry;
}

export function MissionTimeTracker({
  missionId,
  isVisible,
  onClose,
  onTimesSaved,
  initialTimes
}: MissionTimeTrackerProps) {
  const [drivingHours, setDrivingHours] = useState('');
  const [drivingMinutes, setDrivingMinutes] = useState('');
  const [restHours, setRestHours] = useState('');
  const [restMinutes, setRestMinutes] = useState('');
  const [waitingHours, setWaitingHours] = useState('');
  const [waitingMinutes, setWaitingMinutes] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  // Charger les temps initiaux
  useEffect(() => {
    if (initialTimes) {
      if (initialTimes.drivingTimeMinutes) {
        const hours = Math.floor(initialTimes.drivingTimeMinutes / 60);
        const minutes = initialTimes.drivingTimeMinutes % 60;
        setDrivingHours(hours.toString());
        setDrivingMinutes(minutes.toString());
      }
      if (initialTimes.restTimeMinutes) {
        const hours = Math.floor(initialTimes.restTimeMinutes / 60);
        const minutes = initialTimes.restTimeMinutes % 60;
        setRestHours(hours.toString());
        setRestMinutes(minutes.toString());
      }
      if (initialTimes.waitingTimeMinutes) {
        const hours = Math.floor(initialTimes.waitingTimeMinutes / 60);
        const minutes = initialTimes.waitingTimeMinutes % 60;
        setWaitingHours(hours.toString());
        setWaitingMinutes(minutes.toString());
      }
      if (initialTimes.drivingTimeComment) {
        setComment(initialTimes.drivingTimeComment);
      }
    }
  }, [initialTimes]);

  const validateTimeInput = (hours: string, minutes: string): { isValid: boolean; totalMinutes: number } => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    
    if (h < 0 || h > 23 || m < 0 || m > 59) {
      return { isValid: false, totalMinutes: 0 };
    }
    
    return { isValid: true, totalMinutes: h * 60 + m };
  };

  const handleSave = async () => {
    // Validation des temps
    const drivingTime = validateTimeInput(drivingHours, drivingMinutes);
    const restTime = validateTimeInput(restHours, restMinutes);
    const waitingTime = validateTimeInput(waitingHours, waitingMinutes);

    if (!drivingTime.isValid) {
      Alert.alert('Erreur', 'Temps de conduite invalide (format HH:MM, max 23:59)');
      return;
    }
    if (!restTime.isValid) {
      Alert.alert('Erreur', 'Temps de repos invalide (format HH:MM, max 23:59)');
      return;
    }
    if (!waitingTime.isValid) {
      Alert.alert('Erreur', 'Temps d\'attente invalide (format HH:MM, max 23:59)');
      return;
    }

    // Vérification que au moins un temps est renseigné
    if (drivingTime.totalMinutes === 0 && restTime.totalMinutes === 0 && waitingTime.totalMinutes === 0) {
      Alert.alert('Erreur', 'Veuillez renseigner au moins un temps');
      return;
    }

    setSaving(true);
    try {
      const timeData: MissionTimeEntry = {
        drivingTimeMinutes: drivingTime.totalMinutes,
        restTimeMinutes: restTime.totalMinutes,
        waitingTimeMinutes: waitingTime.totalMinutes,
        drivingTimeComment: comment.trim() || undefined
      };

      await databaseService.updateMissionTimes(missionId, timeData);
      
      Alert.alert('Succès', 'Temps de travail enregistrés avec succès');
      onTimesSaved?.();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des temps:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer les temps de travail');
    } finally {
      setSaving(false);
    }
  };

  const formatTimeDisplay = (hours: string, minutes: string) => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const total = h * 60 + m;
    
    if (total === 0) return '';
    
    const displayHours = Math.floor(total / 60);
    const displayMinutes = total % 60;
    
    return `${displayHours}h${displayMinutes.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Temps de travail</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Temps de conduite */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car" size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Temps de conduite</Text>
              {formatTimeDisplay(drivingHours, drivingMinutes) ? (
                <Text style={styles.totalTime}>
                  {formatTimeDisplay(drivingHours, drivingMinutes)}
                </Text>
              ) : null}
            </View>
            
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Heures</Text>
                <TextInput
                  style={styles.timeInput}
                  value={drivingHours}
                  onChangeText={setDrivingHours}
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Minutes</Text>
                <TextInput
                  style={styles.timeInput}
                  value={drivingMinutes}
                  onChangeText={setDrivingMinutes}
                  placeholder="00"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>
          </View>

          {/* Temps de repos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bed" size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Temps de repos</Text>
              {formatTimeDisplay(restHours, restMinutes) ? (
                <Text style={styles.totalTime}>
                  {formatTimeDisplay(restHours, restMinutes)}
                </Text>
              ) : null}
            </View>
            
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Heures</Text>
                <TextInput
                  style={styles.timeInput}
                  value={restHours}
                  onChangeText={setRestHours}
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Minutes</Text>
                <TextInput
                  style={styles.timeInput}
                  value={restMinutes}
                  onChangeText={setRestMinutes}
                  placeholder="00"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>
          </View>

          {/* Temps d'attente */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Temps d'attente</Text>
              {formatTimeDisplay(waitingHours, waitingMinutes) ? (
                <Text style={styles.totalTime}>
                  {formatTimeDisplay(waitingHours, waitingMinutes)}
                </Text>
              ) : null}
            </View>
            
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Heures</Text>
                <TextInput
                  style={styles.timeInput}
                  value={waitingHours}
                  onChangeText={setWaitingHours}
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Minutes</Text>
                <TextInput
                  style={styles.timeInput}
                  value={waitingMinutes}
                  onChangeText={setWaitingMinutes}
                  placeholder="00"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>
          </View>

          {/* Commentaires */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Commentaires (optionnel)</Text>
            </View>
            
            <TextInput
              style={[styles.input, styles.commentInput]}
              value={comment}
              onChangeText={setComment}
              placeholder="Ajouter des commentaires sur les temps de travail..."
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Récapitulatif */}
          <View style={[styles.section, styles.summarySection]}>
            <Text style={styles.summaryTitle}>Récapitulatif</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Conduite:</Text>
              <Text style={styles.summaryValue}>
                {formatTimeDisplay(drivingHours, drivingMinutes) || '0h00'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Repos:</Text>
              <Text style={styles.summaryValue}>
                {formatTimeDisplay(restHours, restMinutes) || '0h00'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Attente:</Text>
              <Text style={styles.summaryValue}>
                {formatTimeDisplay(waitingHours, waitingMinutes) || '0h00'}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                {(() => {
                  const dTotal = validateTimeInput(drivingHours, drivingMinutes).totalMinutes;
                  const rTotal = validateTimeInput(restHours, restMinutes).totalMinutes;
                  const wTotal = validateTimeInput(waitingHours, waitingMinutes).totalMinutes;
                  const grandTotal = dTotal + rTotal + wTotal;
                  const hours = Math.floor(grandTotal / 60);
                  const minutes = grandTotal % 60;
                  return `${hours}h${minutes.toString().padStart(2, '0')}`;
                })()}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer avec boutons */}
        <View style={styles.footer}>
          <Button
            title={saving ? "Enregistrement..." : "Enregistrer"}
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  totalTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    minWidth: 60,
    backgroundColor: '#fff',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  commentInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  summarySection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  saveButton: {
    marginTop: 0,
  },
});
