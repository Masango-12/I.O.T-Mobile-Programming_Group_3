import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type SupportOption = {
  title: string;
  description: string;
  icon: keyof typeof Icon.glyphMap;
  color: string;
  action: () => void;
};

type EmergencyContact = {
  title: string;
  number: string;
  icon: keyof typeof Icon.glyphMap;
  action: () => void;
};

const supportOptions: SupportOption[] = [
  {
    title: '24/7 Customer Support',
    description: 'Get immediate help from our support team',
    icon: 'headset',
    color: '#FF6B6B',
    action: () => Linking.openURL('mailto:support@networkinsights.com'),
  },
];

const emergencyContacts: EmergencyContact[] = [
  {
    title: 'MTN Customer Care',
    number: '8403',
    icon: 'phone',
    action: () => Linking.openURL('tel:8403'),
  },
  {
    title: 'Orange Assistance',
    number: '8000',
    icon: 'phone',
    action: () => Linking.openURL('tel:8000'),
  },
  {
    title: 'WhatsApp Support',
    number: '+237 6 5052 8787',
    icon: 'whatsapp',
    action: () => Linking.openURL('https://wa.me/237650528787'),
  },
];

const SupportScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a']}
        style={styles.headerContainer}
      >
        <Text style={styles.header}>Support Center</Text>
        <Text style={styles.subHeader}>We're here to help you with any issues</Text>
      </LinearGradient>
      
      <View style={styles.optionsContainer}>
        {supportOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionCard, { borderLeftColor: option.color }]}
            onPress={option.action}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
              <Icon name={option.icon} size={24} color={option.color} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.emergencySection}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <Text style={styles.sectionDescription}>
          Direct lines to your network operators for immediate assistance
        </Text>
        {emergencyContacts.map((contact, index) => (
          <TouchableOpacity
            key={index}
            style={styles.emergencyButton}
            onPress={contact.action}
            activeOpacity={0.7}
          >
            <View style={styles.emergencyIcon}>
              <Icon name={contact.icon} size={20} color="#fff" />
            </View>
            <View style={styles.emergencyTextContainer}>
              <Text style={styles.emergencyTitle}>{contact.title}</Text>
              <Text style={styles.emergencyNumber}>{contact.number}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  headerContainer: {
    padding: 25,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 16,
    color: '#aaa',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 3,
  },
  optionDescription: {
    fontSize: 13,
    color: '#aaa',
  },
  emergencySection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  emergencyIcon: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  emergencyNumber: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 3,
  },
});

export default SupportScreen;