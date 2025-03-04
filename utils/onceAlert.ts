import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Module-level variable to track shown alerts (persists across imports)
const shownAlerts = new Set<string>();
const alertsInProgress = new Set<string>();

export const showAlertOnce = (
  key: string, 
  title: string, 
  message: string,
  buttons?: any[],
  options?: any
): void => {
  // If already shown or in progress, do nothing
  if (shownAlerts.has(key) || alertsInProgress.has(key)) {
    console.log(`Alert "${key}" already shown or in progress, skipping`);
    return;
  }
  
  // Mark as in-progress and shown immediately
  alertsInProgress.add(key);
  shownAlerts.add(key);
  
  console.log(`Actually showing alert "${key}" now`);
  
  // Show the alert
  Alert.alert(title, message, buttons, options);
};

// Global singleton for alert management
class AlertManager {
  private isInitialized: boolean = false;
  
  // Force a LONGER delay between alerts (in milliseconds)
  private readonly ALERT_THROTTLE_TIME = 5000;

  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    // Prevent multiple initializations
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Load previously shown alerts from storage
    try {
      const savedAlerts = await SecureStore.getItemAsync('shown_alerts');
      if (savedAlerts) {
        const parsed = JSON.parse(savedAlerts);
        Object.keys(parsed).forEach(key => {
          shownAlerts.add(key);
        });
        console.log('Restored previously shown alerts:', shownAlerts.size);
      }
    } catch (error) {
      console.error('Error loading saved alerts:', error);
    }
  }
  
  public async showAlert(
    key: string, 
    title: string, 
    message: string, 
    buttons?: any[],
    options?: any
  ): Promise<boolean> {
    // Extra safety: if an alert with this key is in progress, skip
    if (alertsInProgress.has(key)) {
      console.log(`Alert "${key}" is already in progress, skipping duplicate`);
      return false;
    }
    
    // If this alert has been shown before, skip it
    if (shownAlerts.has(key)) {
      console.log(`Alert "${key}" has already been shown, skipping`);
      return false;
    }
    
    // Check persistent storage as well
    try {
      const hasBeenShown = await SecureStore.getItemAsync(`alert_${key}`);
      if (hasBeenShown === 'true') {
        console.log(`Alert "${key}" was shown in a previous session, skipping`);
        shownAlerts.add(key);
        return false;
      }
    } catch (error) {
      console.error('Error checking alert history:', error);
    }
    
    // Mark as in-progress before any async operations
    alertsInProgress.add(key);
    
    try {
      console.log(`Actually showing alert "${key}" now`);
      
      // Record this alert as shown immediately
      shownAlerts.add(key);
      
      // Save to persistent storage right away to prevent concurrent attempts
      try {
        await SecureStore.setItemAsync(`alert_${key}`, 'true');
        
        // Also update the collective alerts record
        const currentAlerts = await SecureStore.getItemAsync('shown_alerts') || '{}';
        const alertsObj = JSON.parse(currentAlerts);
        alertsObj[key] = Date.now();
        await SecureStore.setItemAsync('shown_alerts', JSON.stringify(alertsObj));
      } catch (storageError) {
        console.error('Error saving alert shown status:', storageError);
      }
      
      // Finally show the alert
      Alert.alert(title, message, buttons, options);
      return true;
    } finally {
      // Always remove from in-progress when done
      setTimeout(() => {
        alertsInProgress.delete(key);
      }, this.ALERT_THROTTLE_TIME); // Keep marked as in-progress for throttle period
    }
  }
  
  public resetAlert(key: string): void {
    shownAlerts.delete(key);
    try {
      SecureStore.deleteItemAsync(`alert_${key}`);
    } catch (error) {
      console.error('Error resetting alert:', error);
    }
  }
}

// Create a singleton instance
const alertManager = new AlertManager();

// Export function to reset an alert (useful for testing)
export const resetAlert = (key: string): void => {
  alertManager.resetAlert(key);
};