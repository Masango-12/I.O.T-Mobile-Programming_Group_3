import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Dimensions, Switch, TouchableOpacity 
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { API_URL } from "../constants"; // <-- Import your API URL here

type NetworkStatus = 'Good' | 'Slow' | 'Bad' | 'Checking';

interface NetworkDetails {
  type: string;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  ipAddress?: string;
  strength?: number;
  cellularGeneration?: string;
  downlink?: number;
  uplink?: number;
}

const NETWORK_STATUS_NUMERIC = {
  Good: 3,
  Slow: 2,
  Bad: 1,
  Checking: 0,
};

const NETWORK_STATUS_LABELS = ['Bad', 'Slow', 'Good'];

const chartConfig = {
  backgroundGradientFrom: "#1E293B",
  backgroundGradientTo: "#0F172A",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: "5",
    strokeWidth: "3",
    stroke: "#fff"
  },
  propsForBackgroundLines: {
    stroke: "#334155"
  },
  propsForLabels: {
    fontWeight: "bold"
  }
};

const { width } = Dimensions.get('window');

const MAX_POINTS = 24; // Show last 24 samples (~2 min if every 5s)

const NetworkAlertsScreen = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('Checking');
  const [networkDetails, setNetworkDetails] = useState<NetworkDetails>({
    type: 'unknown',
    isConnected: null,
    isInternetReachable: null,
  });
  const [isRealTime, setIsRealTime] = useState(true);

  // For graph: keep a rolling history of the last MAX_POINTS readings
  const [networkTrend, setNetworkTrend] = useState<{status: NetworkStatus, timestamp: string}[]>([]);
  const trendInterval = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<Date | null>(null);

  // Handle real-time updates
  useEffect(() => {
    getNetworkInfo();
    
    // Listen to network changes
    const unsubscribeNet = NetInfo.addEventListener(() => getNetworkInfo());

    // Start/stop interval based on real-time toggle
    if (isRealTime) {
      trendInterval.current = setInterval(() => {
        getNetworkInfo(true);
      }, 5000); // every 5 seconds
    } else if (trendInterval.current) {
      clearInterval(trendInterval.current);
      trendInterval.current = null;
    }

    return () => {
      unsubscribeNet();
      if (trendInterval.current) {
        clearInterval(trendInterval.current);
        trendInterval.current = null;
      }
    };
  }, [isRealTime]);

  // Manual refresh function
  const handleManualRefresh = () => {
    if (!isRealTime) {
      getNetworkInfo(true);
    }
  };

  const getNetworkInfo = async (appendTrend = false) => {
    let status: NetworkStatus = 'Checking';
    lastUpdateTime.current = new Date();
    lastUpdateTime.current = new Date();
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      status = 'Bad';
    } else if (state.type === 'cellular') {
      const details: any = state.details;
      const gen = details && 'cellularGeneration' in details ? details.cellularGeneration : undefined;
      if (gen === '4g' || gen === '5g') status = 'Good';
      else if (gen === '3g') status = 'Slow';
      else status = 'Bad';
    } else if (state.type === 'wifi') {
      const details: any = state.details;
      if (details && 'strength' in details && details.strength < 2) {
        status = 'Slow';
      } else {
        status = 'Good';
      }
    } else {
      status = 'Bad';
    }

    const details: any = state.details || {};
    setNetworkStatus(status);
    setNetworkDetails({
      type: state.type,
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      ipAddress: state.type === 'wifi' && details && 'ipAddress' in details ? details.ipAddress : undefined,
      strength: state.type === 'wifi' && details && 'strength' in details ? details.strength : undefined,
      cellularGeneration: state.type === 'cellular' && details && 'cellularGeneration' in details ? details.cellularGeneration : undefined,
      downlink: details && 'downlinkMax' in details ? details.downlinkMax : undefined,
      uplink: details && 'uplinkMax' in details ? details.uplinkMax : undefined,
    });

    if (appendTrend) {
      setNetworkTrend(prev => {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const updated =
          prev.length >= MAX_POINTS ? [...prev.slice(1), {status, timestamp: timeLabel}] : [...prev, {status, timestamp: timeLabel}];
        return updated;
      });
    }
  };

  // Toggle real-time updates
  const toggleRealTime = () => {
    setIsRealTime(prev => !prev);
  };

  // Format last update time
  const formatLastUpdateTime = () => {
    if (!lastUpdateTime.current) return 'Never';
    return `Last updated: ${lastUpdateTime.current.toLocaleTimeString()}`;
  };

  // Display helpers
  const renderNetworkIcon = () => (
    <Icon
      name={
        networkStatus === 'Good'
          ? 'check-circle-outline'
          : networkStatus === 'Slow'
          ? 'alert-circle-outline'
          : networkStatus === 'Bad'
          ? 'close-circle-outline'
          : 'progress-clock'
      }
      size={28}
      color={
        networkStatus === 'Good'
          ? '#22c55e'
          : networkStatus === 'Slow'
          ? '#f59e42'
          : networkStatus === 'Bad'
          ? '#ef4444'
          : '#3B82F6'
      }
      style={{ marginRight: 10 }}
    />
  );

  // Prepare graph data
  const chartData = {
    labels: networkTrend.length <= 8
      ? networkTrend.map(point => point.timestamp)
      : networkTrend.map((point, i) => (i % 2 === 0 ? point.timestamp : "")), // don't overcrowd
    datasets: [
      {
        data: networkTrend.map(point => NETWORK_STATUS_NUMERIC[point.status]),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3
      }
    ],
    legend: ["Network Quality (1=Bad, 2=Slow, 3=Good)"] // Legend for the graph
  };

  // Custom y-axis label
  const formatYLabel = (y: string) => {
    const val = Number(y);
    switch (val) {
      case 3: return 'Good';
      case 2: return 'Slow';
      case 1: return 'Bad';
      default: return '';
    }
  };

  // Tooltip-like info for latest sample
  const latestTrend = networkTrend[networkTrend.length - 1];

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <View style={{ backgroundColor: 'transparent' }} />
        }
      >
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Network Alerts & Diagnostics</Text>
          <View style={styles.controlsContainer}>
            <Text style={styles.realTimeLabel}>
              {isRealTime ? 'Real-time' : 'Manual'}
            </Text>
            <Switch
              value={isRealTime}
              onValueChange={toggleRealTime}
              trackColor={{ false: '#64748b', true: '#3B82F6' }}
              thumbColor="#ffffff"
              style={styles.switch}
            />
            {!isRealTime && (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleManualRefresh}
              >
                <Icon name="refresh" size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.lastUpdateText}>
          {formatLastUpdateTime()}
        </Text>

        {/* Network status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Status</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            {renderNetworkIcon()}
            <Text
              style={{
                color:
                  networkStatus === 'Good'
                    ? '#22c55e'
                    : networkStatus === 'Slow'
                    ? '#f59e42'
                    : networkStatus === 'Bad'
                    ? '#ef4444'
                    : '#3B82F6',
                fontWeight: 'bold',
                fontSize: 18,
              }}
            >
              {networkStatus}
            </Text>
          </View>
          <Text style={styles.infoText}>Type: {networkDetails.type}</Text>
          <Text style={styles.infoText}>
            Connected: {networkDetails.isConnected === null ? 'Unknown' : networkDetails.isConnected ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.infoText}>
            Internet Reachable: {networkDetails.isInternetReachable === null ? 'Unknown' : networkDetails.isInternetReachable ? 'Yes' : 'No'}
          </Text>
          {networkDetails.ipAddress && (
            <Text style={styles.infoText}>IP Address: {networkDetails.ipAddress}</Text>
          )}
          {typeof networkDetails.strength !== 'undefined' && (
            <Text style={styles.infoText}>WiFi Signal Strength: {networkDetails.strength} / 4</Text>
          )}
          {networkDetails.cellularGeneration && (
            <Text style={styles.infoText}>
              Cellular Generation: {networkDetails.cellularGeneration}
            </Text>
          )}
          {typeof networkDetails.downlink !== 'undefined' && (
            <Text style={styles.infoText}>
              Max Downlink: {networkDetails.downlink} Mbps
            </Text>
          )}
          {typeof networkDetails.uplink !== 'undefined' && (
            <Text style={styles.infoText}>
              Max Uplink: {networkDetails.uplink} Mbps
            </Text>
          )}
        </View>

        {/* Advanced Network Trend Graph */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Network Trend (Last {networkTrend.length} Samples)
          </Text>
          {networkTrend.length > 1 ? (
            <>
              <LineChart
                data={chartData}
                width={width - 40}
                height={260}
                chartConfig={{
                  ...chartConfig,
                  formatYLabel,
                }}
                bezier
                fromZero
                yLabelsOffset={16}
                withDots
                withShadow={false}
                withInnerLines={true}
                withOuterLines={true}
                formatYLabel={formatYLabel}
                segments={3}
                style={{
                  marginVertical: 6,
                  borderRadius: 18,
                  alignSelf: 'center',
                  backgroundColor: "#1E293B"
                }}
                getDotColor={(_dataPoint, index) => {
                  const val = networkTrend[index]?.status;
                  if (val === "Good") return "#22c55e";
                  if (val === "Slow") return "#f59e42";
                  if (val === "Bad") return "#ef4444";
                  return "#3B82F6";
                }}
                renderDotContent={({ x, y, index }) =>
                  index === networkTrend.length - 1 ? (
                    <View
                      key={index}
                      style={{
                        position: 'absolute',
                        left: x - 26,
                        top: y - 36,
                        backgroundColor: '#1E293B',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 7,
                        borderWidth: 1,
                        borderColor: '#475569',
                        zIndex: 10,
                        elevation: 10,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12 }}>
                        {networkTrend[index]?.status} ({networkTrend[index]?.timestamp})
                      </Text>
                    </View>
                  ) : null
                }
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ color: '#ef4444', fontSize: 12 }}>Bad</Text>
                <Text style={{ color: '#f59e42', fontSize: 12 }}>Slow</Text>
                <Text style={{ color: '#22c55e', fontSize: 12 }}>Good</Text>
              </View>
              <View style={{ marginTop: 10 }}>
                <Text style={{ color: "#fff", fontSize: 13, textAlign: "center" }}>
                  Latest Sample:{" "}
                  <Text style={{ color: "#3B82F6", fontWeight: "bold" }}>
                    {latestTrend?.status}
                  </Text>
                  {latestTrend && ` @ ${latestTrend.timestamp}`}
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ color: '#94A3B8' }}>Waiting for trend data...</Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  realTimeLabel: {
    color: '#94a3b8',
    marginRight: 8,
    fontSize: 14,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  refreshButton: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastUpdateText: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'right',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 10,
  },
  valueText: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 3,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 3,
  },
});

export default NetworkAlertsScreen;