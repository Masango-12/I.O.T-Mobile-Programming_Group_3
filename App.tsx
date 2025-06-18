import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {
  createStackNavigator,
  StackCardStyleInterpolator,
  StackNavigationOptions,
} from '@react-navigation/stack';
import {
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  View,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './screens/HomeScreen';
import SpeedTestScreen from './screens/SpeedTestScreen';
import NetworkAlertsScreen from './screens/NetworkAlertsScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';
import SupportScreen from './screens/SupportScreen';
import TestHistoryScreen from './screens/TestHistoryScreen';

// Define screen params type
type RootStackParamList = {
  Home: undefined;
  SpeedTest: undefined;
  NetworkAlerts: undefined;
  Feedback: undefined;
  PrivacySettings: undefined;
  Support: undefined;
  TestHistory: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function CenteredHeaderTitle() {
  return (
    <Text style={styles.headerTitle}>
      Welcome to <Text style={styles.headerHighlight}>CheckIn</Text>
    </Text>
  );
}

function CustomBackIcon() {
  return (
    <Ionicons
      name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
      size={24}
      color="#fff"
      style={{ marginLeft: 16 }}
    />
  );
}

function GlobalNotificationBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

const linking = {
  prefixes: ['checkin://', 'https://checkin.app'],
  config: {
    screens: {
      Home: '',
      SpeedTest: 'speed',
      NetworkAlerts: 'alerts',
      Feedback: 'feedback',
      PrivacySettings: 'privacy',
      Support: 'support',
      TestHistory: 'history',
    },
  },
};

function AppNavigator() {
  const colorScheme =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : undefined;

  // Example: notification message
  const notificationMessage = '';
  
  // Custom horizontal slide transition
  const forSlide: StackCardStyleInterpolator = ({ current, next, layouts }) => {
    const progress = current.progress;
    const translateX = Animated.multiply(
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [layouts.screen.width, 0],
      }),
      next 
        ? next.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -layouts.screen.width],
          })
        : 1
    );

    return {
      cardStyle: {
        transform: [{ translateX }],
      },
      overlayStyle: {
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  };

  const screenOptions: StackNavigationOptions = {
    headerStyle: {
      backgroundColor: '#1a1a1a',
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTintColor: '#fff',
    headerTitleAlign: 'center',
    headerTitleStyle: { fontWeight: 'bold' },
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    cardStyleInterpolator: forSlide,
    headerBackImage: CustomBackIcon,
    cardStyle: {
      backgroundColor: 'transparent',
    },
    cardOverlayEnabled: true,
    cardShadowEnabled: false,
    cardOverlay: () => (
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />
    ),
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        },
      },
    },
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#1a1a1a');
      StatusBar.setBarStyle('light-content');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="#1a1a1a"
      />
      <GlobalNotificationBanner message={notificationMessage} />
      <NavigationContainer
        theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        linking={linking}
      >
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerTitle: () => <CenteredHeaderTitle />,
              headerLeft: () => null,
            }}
          />
          <Stack.Screen
            name="SpeedTest"
            component={SpeedTestScreen}
            options={{ title: 'Speed Test' }}
          />
          <Stack.Screen
            name="NetworkAlerts"
            component={NetworkAlertsScreen}
            options={{ title: 'Network Alerts' }}
          />
          <Stack.Screen
            name="Feedback"
            component={FeedbackScreen}
            options={{ title: 'Feedback' }}
          />
          <Stack.Screen
            name="PrivacySettings"
            component={PrivacySettingsScreen}
            options={{ title: 'Privacy Settings' }}
          />
          <Stack.Screen
            name="Support"
            component={SupportScreen}
            options={{ title: 'Support Center' }}
          />
          <Stack.Screen
            name="TestHistory"
            component={TestHistoryScreen}
            options={{ title: 'Test History' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily:
      Platform.OS === 'ios' ? 'HelveticaNeue-Medium' : 'sans-serif-medium',
  },
  headerHighlight: {
    color: '#3B82F6',
  },
  banner: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default function App() {
  return <AppNavigator />;
}
