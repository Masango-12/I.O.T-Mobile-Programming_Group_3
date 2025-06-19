import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

type PrivacySettingKey = 'backgroundMonitoring' | 'shareAnonymousData' | 'saveLocationHistory';
type PrivacySettings = Record<PrivacySettingKey, boolean>;

// Backend URL and user ID
const BACKEND_URL = 'https://backend-1-5ynd.onrender.com/api/privacy-settings';
const USER_ID = 'demo-user-123'; // Replace with real user ID in production

const defaultSettings: PrivacySettings = {
  backgroundMonitoring: true,
  shareAnonymousData: false,
  saveLocationHistory: true,
};

const PrivacySettingsScreen = () => {
  const [settings, setSettings] = useState<PrivacySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/${USER_ID}`);
        if (res.ok) {
          const data = await res.json();
          setSettings({
            backgroundMonitoring: !!data.backgroundMonitoring,
            shareAnonymousData: !!data.shareAnonymousData,
            saveLocationHistory: !!data.saveLocationHistory
          });
        } else {
          throw new Error('Failed to fetch settings');
        }
      } catch (error) {
        Alert.alert('Error', 'Could not load privacy settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Save updated settings
  const saveSettings = async (updated: PrivacySettings) => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/${USER_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not save your settings.');
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle
  const toggleSetting = (key: PrivacySettingKey) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveSettings(updated);
  };

  const privacyOptions: {
    title: string;
    description: string;
    icon: keyof typeof Icon.glyphMap;
    setting: PrivacySettingKey;
  }[] = [
    {
      title: 'Background Monitoring',
      description: 'Allow the app to monitor network quality in the background.',
      icon: 'chart-line',
      setting: 'backgroundMonitoring'
    },
    {
      title: 'Share Anonymous Usage Data',
      description: 'Help us improve by sharing anonymized usage statistics.',
      icon: 'chart-pie',
      setting: 'shareAnonymousData'
    },
    {
      title: 'Save Location History',
      description: 'Store GPS data with test results to show accurate history.',
      icon: 'map-marker',
      setting: 'saveLocationHistory'
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Privacy and Data Control Settings</Text>

      {privacyOptions.map(option => (
        <View key={option.setting} style={styles.optionContainer}>
          <View style={styles.optionIcon}>
            <Icon name={option.icon} size={24} color="#3B82F6" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </View>
          <Switch
            value={settings[option.setting]}
            onValueChange={() => toggleSetting(option.setting)}
            trackColor={{ false: '#767577', true: '#3B82F6' }}
            thumbColor="#fff"
            disabled={saving}
          />
        </View>
      ))}

      <View style={styles.infoBox}>
        <Icon name="information" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          Your preferences are saved securely and can be updated anytime.
        </Text>
      </View>

      {saving && (
        <View style={styles.saving}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    padding: 20
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15
  },
  optionIcon: {
    marginRight: 15
  },
  optionText: {
    flex: 1
  },
  optionTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4
  },
  optionDescription: {
    fontSize: 13,
    color: '#aaa'
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    gap: 12
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#aaa'
  },
  loadingText: {
    color: '#fff',
    marginTop: 12
  },
  saving: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14
  },
  savingText: {
    color: '#3B82F6',
    marginLeft: 10
  }
});

export default PrivacySettingsScreen;
