import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Backend API configuration
const API_BASE_URL = "https://backend-yaf5.onrender.com"; // Replace with your actual backend IP or domain
const BACKEND_URL = `${API_BASE_URL}/api/tests`;
const USER_ID = "demo-user-123"; // In a real app, use the actual user ID

const getSpeedColor = (speed: number) => {
  if (speed > 40) return '#10B981'; // Green
  if (speed > 20) return '#EAB308'; // Yellow
  return '#EF4444'; // Red
};

const getMonthYear = (dateString: string) => {
  const d = new Date(dateString);
  return { month: d.getMonth(), year: d.getFullYear() };
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Group test data by date, preserving time of each test
function groupTestsByDate(tests: any[]) {
  const grouped: { [date: string]: any[] } = {};
  tests.forEach(test => {
    if (!test.testedAt) return;
    const d = new Date(test.testedAt);
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push({
      ...test,
      timeStr
    });
  });
  // sort by date descending
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  return sortedDates.map(date => ({
    date,
    tests: grouped[date].sort((a, b) => {
      const aDate = new Date(a.testedAt);
      const bDate = new Date(b.testedAt);
      return bDate.getTime() - aDate.getTime();
    })
  }));
}

// Calculate overall stats
function calcOverallStats(tests: any[]) {
  if (!tests.length) return { tests: 0, averageSpeed: 0, highestSpeed: 0 };
  // Explicitly cast to number, fallback to 0 if not a number
  const dlSpeeds = tests.map(t => Number(t.downloadSpeed) || 0);
  const averageSpeed = (dlSpeeds.reduce((a, b) => a + b, 0) / dlSpeeds.length).toFixed(1);
  const highestSpeed = Math.max(...dlSpeeds).toFixed(1);
  return { tests: tests.length, averageSpeed, highestSpeed };
}

const TestHistoryScreen = () => {
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<{ month: number, year: number }[]>([]);
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const loadTestHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}?userId=${USER_ID}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTestHistory(data);
      } catch (error) {
        Alert.alert('Error', 'Could not load test history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadTestHistory();
  }, []);

  // Get unique months/years from data
  useEffect(() => {
    if (testHistory.length) {
      const uniqueMonths: { month: number, year: number }[] = [];
      testHistory.forEach(t => {
        if (t.testedAt) {
          const { month, year } = getMonthYear(t.testedAt);
          if (!uniqueMonths.some(m => m.month === month && m.year === year)) {
            uniqueMonths.push({ month, year });
          }
        }
      });
      // Sort descending (latest first)
      uniqueMonths.sort((a, b) => b.year === a.year ? b.month - a.month : b.year - a.year);
      setAvailableMonths(uniqueMonths);
      if (uniqueMonths.length) {
        setSelectedMonth(uniqueMonths[0].month);
        setSelectedYear(uniqueMonths[0].year);
      }
    }
  }, [testHistory]);

  // Filter history by selected month and year
  const filteredHistory = testHistory.filter(t => {
    if (!t.testedAt) return false;
    const d = new Date(t.testedAt);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Group by day
  const days = groupTestsByDate(filteredHistory);

  // Overall stats
  const overallStats = calcOverallStats(filteredHistory);

  const toggleDay = (day: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a1532' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ color: "#e0e7ef", marginTop: 16 }}>Loading test history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.screenTitle}>Speed Test History</Text>

      {/* Month Selector */}
      <TouchableOpacity
        style={styles.monthSelector}
        onPress={() => setMonthModalVisible(true)}
        activeOpacity={0.7}
      >
        <Icon name="calendar-month" size={22} color="#3B82F6" />
        <Text style={styles.monthSelectorText}>
          {months[selectedMonth]} {selectedYear}
        </Text>
        <Icon name="chevron-down" size={22} color="#3B82F6" />
      </TouchableOpacity>

      {/* Month Modal */}
      <Modal visible={monthModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.monthModal}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <FlatList
              data={availableMonths}
              keyExtractor={item => `${item.month}-${item.year}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.monthModalItem,
                    item.month === selectedMonth && item.year === selectedYear && styles.monthModalItemActive
                  ]}
                  onPress={() => {
                    setSelectedMonth(item.month);
                    setSelectedYear(item.year);
                    setMonthModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.monthModalItemText,
                    item.month === selectedMonth && item.year === selectedYear && styles.monthModalItemTextActive
                  ]}>
                    {months[item.month]} {item.year}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setMonthModalVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Overall Stats */}
      <View style={styles.overallStats}>
        <Text style={styles.overallTitle}>Overall Statistics</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Tests:</Text>
          <Text style={styles.statValue}>{overallStats.tests}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Average Speed:</Text>
          <Text style={styles.statValue}>{overallStats.averageSpeed} Mbps</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Highest Speed:</Text>
          <Text style={styles.statValue}>{overallStats.highestSpeed} Mbps</Text>
        </View>
      </View>

      {days.length === 0 && (
        <Text style={styles.noDataText}>No tests found for this month.</Text>
      )}
      {days.map(day => {
        const isExpanded = expandedDays[day.date];
        return (
          <View key={day.date} style={styles.dayContainer}>
            <TouchableOpacity
              onPress={() => toggleDay(day.date)}
              activeOpacity={0.7}
              style={[styles.dayHeader, isExpanded && styles.dayHeaderExpanded]}
            >
              <Text style={styles.dayTitle}>{day.date}</Text>
              <MaterialIcons
                name={isExpanded ? 'expand-less' : 'expand-more'}
                size={28}
                color="#e0e7ef"
              />
            </TouchableOpacity>
            {isExpanded && (
              <View style={styles.testsList}>
                {day.tests.map((test: any, index: number) => (
                  <View key={test._id || index} style={styles.testItem}>
                    <Text style={styles.testTime}>{test.timeStr}</Text>
                    <View style={styles.testStats}>
                      <View style={styles.testStat}>
                        <Text style={styles.testLabel}>Download</Text>
                        <Text style={[styles.testValue, { color: getSpeedColor(Number(test.downloadSpeed)) }]}>
                          {Number(test.downloadSpeed)} Mbps
                        </Text>
                      </View>
                      <View style={styles.testStat}>
                        <Text style={styles.testLabel}>Upload</Text>
                        <Text style={[styles.testValue, { color: getSpeedColor(Number(test.uploadSpeed)) }]}>
                          {Number(test.uploadSpeed)} Mbps
                        </Text>
                      </View>
                      <View style={styles.testStat}>
                        <Text style={styles.testLabel}>Ping</Text>
                        <Text style={styles.testValue}>{Number(test.ping)} ms</Text>
                      </View>
                    </View>
                    {index < day.tests.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

// ...rest of your imports and code remain unchanged...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040d26', // very dark blue
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e0e7ef', // off white for dark bg
    marginBottom: 20,
    textAlign: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#06113a', // even darker blue
    alignSelf: 'center',
    minWidth: 170,
  },
  monthSelectorText: {
    flex: 1,
    color: '#3B82F6',
    fontSize: 16,
    marginHorizontal: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthModal: {
    backgroundColor: '#0b163a', // very dark blue
    width: '80%',
    maxHeight: '60%',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  monthModalItem: {
    paddingVertical: 12,
    borderBottomColor: '#101f3a',
    borderBottomWidth: 1,
  },
  monthModalItemActive: {
    backgroundColor: '#2563EB',
  },
  monthModalItemText: {
    color: '#a1a8c9',
    fontSize: 16,
    textAlign: 'center',
  },
  monthModalItemTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    marginTop: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  overallStats: {
    backgroundColor: '#0f1e3a', // very dark blue
    borderRadius: 16,
    padding: 24,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  overallTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f0f0f0',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.7,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 16,
    color: '#a1a8c9', // soft gray
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    color: '#f0f0f0',
    fontWeight: '700',
  },
  noDataText: {
    color: '#a1a8c9',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  dayContainer: {
    marginBottom: 18,
    borderRadius: 14,
    backgroundColor: '#0a1532', // very dark blue
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: '#192954', // very dark blue
  },
  dayHeaderExpanded: {
    backgroundColor: '#22336b', // slightly lighter very dark blue
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e0e7ef',
  },
  testsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#101d3f', // very dark blue
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  testItem: {
    marginBottom: 12,
  },
  testTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a8c9',
    marginBottom: 8,
  },
  testStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testStat: {
    flex: 1,
    alignItems: 'center',
  },
  testLabel: {
    fontSize: 13,
    color: '#c8d0e7', // lighter gray
    fontWeight: '500',
  },
  testValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0e7ef',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#1a2950',
    marginTop: 12,
    opacity: 0.3,
  },
});

export default TestHistoryScreen;