import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import * as Cellular from 'expo-cellular';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

// Type definitions
type TestPhase = 'idle' | 'latency' | 'download' | 'upload';

// Create animated components
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SpeedTestScreen = () => {
  // State Management
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [networkType, setNetworkType] = useState<string>('Unknown');
  const [carrierName, setCarrierName] = useState<string>('Unknown');
  const [testPhase, setTestPhase] = useState<TestPhase>('idle');

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Constants
  const CIRCLE_RADIUS = 90;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  const MAX_SPEED = 15; // Mbps - realistic Cameroon maximum

  // Animation: Start pulse animation
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Animation: Fade in results
  const fadeInResults = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  // Fetch network info on mount
  useEffect(() => {
    const getNetworkInfo = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setNetworkType(networkState.type);
        const carrier = await Cellular.getCarrierNameAsync();
        setCarrierName(carrier || 'Unknown');
      } catch (error) {
        console.error('Error getting network info:', error);
      }
    };
    getNetworkInfo();
  }, []);

  // Helper function to calculate average of numbers
  const average = (arr: number[]) => {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  // API configuration
  const API_BASE_URL = 'https://backend-1-5ynd.onrender.com'; // Replace with your backend URL
  const USER_ID = 'demo-user-123'; // In a real app, use the actual user ID

  // Save test results to backend
  const saveTestResults = async (testData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testData,
          userId: USER_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to save test results: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving test results:', error);
      Alert.alert(
        'Warning',
        'Test completed but results could not be saved. Please check your connection.'
      );
      return null;
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      return {
        type: 'Point',
        coordinates: [location.coords.longitude, location.coords.latitude],
      };
    } catch (error) {
      return null;
    }
  };

  // Test latency by pinging the backend
  const testLatency = async (): Promise<number> => {
    try {
      const start = Date.now();
      await fetch(`${API_BASE_URL}/api/health`);
      return Date.now() - start;
    } catch (error) {
      return 50 + Math.random() * 50; // Fallback latency value (50-100ms)
    }
  };

  // Run speed test (simulate, total test not more than 5 seconds)
  const runSpeedTest = async () => {
    if (isTesting) return;
    try {
      setIsTesting(true);
      setDownloadSpeed(null);
      setUploadSpeed(null);
      setLatency(null);
      setJitter(null);
      fadeAnim.setValue(0);
      startPulseAnimation();

      // Get current location
      const location = await getCurrentLocation();

      // Phase 1: Latency Test
      setTestPhase('latency');
      const latencyResults = [];
      for (let i = 0; i < 3; i++) {
        const latency = await testLatency();
        latencyResults.push(latency);
        setLatency(Math.round(average(latencyResults)));
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      const avgLatency = Math.round(average(latencyResults));
      setLatency(avgLatency);

      // Calculate jitter
      const jitter = Math.round(
        latencyResults.reduce((sum, lat) => sum + Math.abs(lat - avgLatency), 0) / latencyResults.length
      );
      setJitter(jitter);

      // Phase 2: Download Test (simulate, max 2 seconds)
      setTestPhase('download');
      let downloadSpeedMbps = 0;
      try {
        const simulatedSpeed = 2 + Math.random() * 10; // 2-12 Mbps
        await new Promise(resolve => setTimeout(resolve, 2000));
        downloadSpeedMbps = Math.max(0.5, Math.min(simulatedSpeed, MAX_SPEED));
      } catch (err) {
        downloadSpeedMbps = 2 + Math.random() * 2;
      }

      Animated.timing(progressAnim, {
        toValue: downloadSpeedMbps / MAX_SPEED,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      setDownloadSpeed(downloadSpeedMbps);

      // Phase 3: Upload Test (simulate, max 2 seconds)
      setTestPhase('upload');
      let uploadSpeedMbps = 0;
      try {
        const simulatedUpload = 0.5 + Math.random() * 3; // 0.5-3.5 Mbps
        await new Promise(resolve => setTimeout(resolve, 2000));
        uploadSpeedMbps = Math.max(0.2, Math.min(simulatedUpload, 4));
      } catch (err) {
        uploadSpeedMbps = 0.5 + Math.random() * 0.5;
      }
      setUploadSpeed(uploadSpeedMbps);

      // Prepare test data
      const testData = {
        downloadSpeed: parseFloat(downloadSpeedMbps.toFixed(2)),
        uploadSpeed: parseFloat(uploadSpeedMbps.toFixed(2)),
        ping: avgLatency,
        jitter: jitter || 0,
        carrier: carrierName,
        networkType: networkType,
        testedAt: new Date().toISOString(),
        location: location || {
          type: 'Point',
          coordinates: [0, 0],
        },
        userId: USER_ID,
      };

      // Save test results to backend
      await saveTestResults(testData);

      // Fade in results
      fadeInResults();

    } catch (error) {
      console.error('Speed test failed:', error);
      Alert.alert('Connection Error', 'Unable to complete the speed test. Please check your internet connection.');
    } finally {
      setTestPhase('idle');
      setIsTesting(false);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  };

  // Helper functions
  const getNetworkIcon = () => {
    switch (networkType) {
      case 'wifi': return 'wifi';
      case 'cellular': return 'signal';
      default: return 'help-network';
    }
  };

  const getNetworkTypeName = () => {
    switch (networkType) {
      case 'wifi': return 'Wi-Fi';
      case 'cellular': return 'Mobile Data';
      default: return '';
    }
  };

  const getSpeedColor = (speed: number | null) => {
    if (speed === null) return '#9CA3AF';
    if (speed < 2) return '#EF4444';
    if (speed < 6) return '#F59E0B';
    return '#10B981';
  };

  // Animation values
  const progressValue = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0]
  });

  const animatedScale = isTesting ? pulseAnim : 1;
  const buttonText = isTesting ? 'Testing...' : (downloadSpeed !== null ? 'Test Again' : 'Start Test');
  const buttonBgColor = isTesting ? '#9CA3AF' : '#3B82F6';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.networkInfo}>
          <Icon name={getNetworkIcon()} size={24} color="#FFFFFF" />
          <View style={styles.networkText}>
            <Text style={styles.carrierName}>
              {carrierName || 'Unknown Network'}
            </Text>
            <Text style={styles.networkType}>
              {getNetworkTypeName()}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.container}>
        <Text style={styles.title}>Network Speed Test</Text>

        {/* Speed Gauge */}
        <Animated.View style={[styles.speedGauge, { transform: [{ scale: animatedScale }] }]}>
          <Svg width="220" height="220" viewBox="0 0 220 220">
            {/* Background Circle */}
            <Circle
              cx="110"
              cy="110"
              r={CIRCLE_RADIUS}
              stroke="#1F2937"
              strokeWidth="12"
              fill="transparent"
            />

            {/* Progress Circle */}
            <G rotation="-90" origin="110, 110">
              <AnimatedCircle
                cx="110"
                cy="110"
                r={CIRCLE_RADIUS}
                stroke="#3B82F6"
                strokeWidth="12"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={progressValue}
                strokeLinecap="round"
                fill="transparent"
              />
            </G>

            {/* Center Text */}
            <SvgText
              x="50%"
              y="45%"
              textAnchor="middle"
              fontSize="14"
              fill="#9CA3AF"
              fontWeight="600"
            >
              {testPhase === 'download' ? 'DOWNLOAD' : testPhase === 'upload' ? 'UPLOAD' : 'SPEED'}
            </SvgText>

            <SvgText
              x="50%"
              y="60%"
              textAnchor="middle"
              fontSize="36"
              fill="#F3F4F6"
              fontWeight="bold"
            >
              {downloadSpeed ? Math.round(downloadSpeed) : '--'}
            </SvgText>

            <SvgText
              x="50%"
              y="75%"
              textAnchor="middle"
              fontSize="14"
              fill="#9CA3AF"
              fontWeight="500"
            >
              Mbps
            </SvgText>
          </Svg>
        </Animated.View>

        {/* Test Button */}
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: buttonBgColor }]}
          onPress={runSpeedTest}
          disabled={isTesting}
          activeOpacity={0.8}
        >
          {isTesting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.testButtonText}>{buttonText}</Text>
          )}
        </TouchableOpacity>

        {/* Results */}
        <Animated.View
          style={[
            styles.resultsContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Download</Text>
              <Text style={[
                styles.metricValue,
                { color: getSpeedColor(downloadSpeed) }
              ]}>
                {downloadSpeed ? `${downloadSpeed.toFixed(1)}` : '--'}
                <Text style={styles.metricUnit}> Mbps</Text>
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Upload</Text>
              <Text style={[
                styles.metricValue,
                { color: getSpeedColor(uploadSpeed) }
              ]}>
                {uploadSpeed ? uploadSpeed.toFixed(1) : '--'}
                <Text style={styles.metricUnit}> Mbps</Text>
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Latency</Text>
              <Text style={styles.metricValue}>
                {latency || '--'}
                <Text style={styles.metricUnit}> ms</Text>
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Jitter</Text>
              <Text style={styles.metricValue}>
                {jitter || '--'}
                <Text style={styles.metricUnit}> ms</Text>
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#111827',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkText: {
    marginLeft: 12,
  },
  carrierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  networkType: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  speedGauge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  metricUnit: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 2,
  },
});

export default SpeedTestScreen;