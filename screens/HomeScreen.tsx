import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, StatusBar } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

type MenuItem = {
  title: string;
  subtitle: string;
  icon: keyof typeof Icon.glyphMap;
  route: string;
  color: string;
};

const menuItems: MenuItem[] = [
  { 
    title: 'Speed Test', 
    subtitle: 'Measure your current network performance', 
    icon: 'speedometer', 
    route: 'SpeedTest',
    color: '#4C9AFF'
  },
  { 
    title: 'Network Alerts', 
    subtitle: 'Real-time outage notifications', 
    icon: 'alert-octagram', 
    route: 'NetworkAlerts',
    color: '#FF5630'
  },
  { 
    title: 'Submit Feedback', 
    subtitle: 'Report network issues', 
    icon: 'message-alert', 
    route: 'Feedback',
    color: '#6554C0'
  },
  { 
    title: 'Privacy Settings', 
    subtitle: 'Control your data preferences', 
    icon: 'shield-lock', 
    route: 'PrivacySettings',
    color: '#00B8D9'
  },
  { 
    title: 'Support Center', 
    subtitle: '24/7 customer assistance', 
    icon: 'headset', 
    route: 'Support',
    color: '#36B37E'
  },
  { 
    title: 'Test History', 
    subtitle: 'View past performance metrics', 
    icon: 'chart-line', 
    route: 'TestHistory',
    color: '#FFAB00'
  },
];

const HomeScreen = () => {
  const navigation = useNavigation();

  // Example: Setting options as an object (not an array)
  React.useEffect(() => {
    navigation.setOptions?.({ title: 'Home' });
  }, [navigation]);

  return (
    <ImageBackground 
      source={require('../assets/network-bg.jpg')} 
      style={styles.background}
      blurRadius={2}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['rgba(13,13,13,0.9)', 'rgba(13,13,13,0.7)']}
        style={styles.gradient}
      >
        <ScrollView style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Your</Text>
            <Text style={styles.appTitle}>CHECK-IN</Text>
            <Text style={styles.appSubtitle}>Your complete network diagnostics tool</Text>
          </View>

          <View style={styles.cardsContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[styles.card, { borderLeftColor: item.color }]}
                onPress={() => navigation.navigate(item.route as never)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <Icon name={item.icon} size={24} color={item.color} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Last updated: Today at 14:30</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 5,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  cardsContainer: {
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26,26,26,0.8)',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
    borderLeftWidth: 4,
    borderRightWidth: 0.5,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderRightColor: '#333',
    borderTopColor: '#333',
    borderBottomColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: '#aaa',
  },
  footer: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});

export default HomeScreen;