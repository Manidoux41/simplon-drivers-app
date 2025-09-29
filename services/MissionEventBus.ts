// Système d'événements global pour les missions
class MissionEventBus {
  private listeners: Set<() => void> = new Set();

  // S'abonner aux changements de missions
  subscribe(callback: () => void) {
    this.listeners.add(callback);
  }

  // Se désabonner des changements
  unsubscribe(callback: () => void) {
    this.listeners.delete(callback);
  }

  // Notifier tous les listeners qu'une mission a changé
  notify() {
    console.log('🔄 MissionEventBus: Notification des changements de missions');
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Erreur lors de la notification d\'un listener:', error);
      }
    });
  }
}

export const missionEventBus = new MissionEventBus();