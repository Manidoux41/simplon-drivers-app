import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { MissionPdfActions } from './MissionPdfActions';
import { Mission } from '../lib/database';

interface MissionPdfMenuProps {
  mission: Mission;
  companyName?: string;
  driverName?: string;
  vehicleInfo?: string;
  triggerStyle?: any;
  iconSize?: number;
}

export function MissionPdfMenu({
  mission,
  companyName = 'Entreprise inconnue',
  driverName = 'Chauffeur non assigné',
  vehicleInfo = 'Véhicule non assigné',
  triggerStyle,
  iconSize = 20
}: MissionPdfMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const colors = Colors.light;

  const pdfData = {
    mission,
    companyName,
    driverName,
    vehicleInfo
  };

  const showMenu = () => setIsVisible(true);
  const hideMenu = () => setIsVisible(false);

  return (
    <>
      {/* Bouton déclencheur */}
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.info }, triggerStyle]}
        onPress={showMenu}
      >
        <Ionicons name="document-text" size={iconSize} color={colors.textOnPrimary} />
      </TouchableOpacity>

      {/* Modal avec options PDF */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideMenu}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={hideMenu}
        >
          <View style={[styles.menu, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.menuHeader}
              activeOpacity={1}
            >
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Exporter la mission
              </Text>
              <TouchableOpacity onPress={hideMenu}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>

            <View style={styles.menuContent}>
              <Text style={[styles.missionTitle, { color: colors.text }]}>
                {mission.title}
              </Text>
              <Text style={[styles.missionSubtitle, { color: colors.textSecondary }]}>
                {companyName}
              </Text>

              <MissionPdfActions
                missionData={pdfData}
                style={styles.pdfActions}
                showLabels={true}
                iconSize={18}
              />

              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                💡 Le PDF contiendra tous les détails de la mission pour archivage ou transmission.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menu: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuContent: {
    padding: 20,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  missionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  pdfActions: {
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});
