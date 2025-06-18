import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { submitFeedback } from '../api/feedbackApi';

const { width } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

const FeedbackScreen = () => {
  const navigation = useNavigation();
  const [issueType, setIssueType] = useState<string>('Slow speeds');
  const [customIssue, setCustomIssue] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [includeLocation, setIncludeLocation] = useState<boolean>(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  const issueTypes = [
    'Slow speeds',
    'No connection',
    'Dropped calls',
    'Poor voice quality',
    'Other'
  ];

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  const handleSelectIssueType = (type: string) => {
    setIssueType(type);
    if (type !== 'Other') {
      setCustomIssue('');
    }
  };

  // Updated pickImage to use base64 and save as string
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        aspect: [4, 3],
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setScreenshot(base64Img);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: `${address[0]?.street || 'Unknown street'}, ${address[0]?.city || 'Unknown city'}`
      };

      setLocation(locationData);
      setIncludeLocation(true);
      Alert.alert('Location Added', `Precise coordinates: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!comments.trim()) {
      Alert.alert('Required', 'Please describe your issue');
      return;
    }

    if (issueType === 'Other' && !customIssue.trim()) {
      Alert.alert('Required', 'Please specify your issue type');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        issueType,
        customIssue: issueType === 'Other' ? customIssue : undefined,
        comments,
        location: includeLocation && location ? location : undefined,
        screenshot,
      };

      await submitFeedback(payload);

      Alert.alert(
        'Success',
        'Thank you for your feedback!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

      // Reset form
      setIssueType('Slow speeds');
      setCustomIssue('');
      setComments('');
      setIncludeLocation(false);
      setLocation(null);
      setScreenshot(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Report Network Issue</Text>

        {/* Issue Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Issue Type</Text>
          <View style={styles.issueTypesContainer}>
            {issueTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.issueTypeButton,
                  issueType === type && styles.selectedIssueType
                ]}
                onPress={() => handleSelectIssueType(type)}
              >
                <Text style={[
                  styles.issueTypeText,
                  issueType === type && styles.selectedIssueTypeText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {issueType === 'Other' && (
            <TextInput
              style={styles.customIssueInput}
              value={customIssue}
              onChangeText={setCustomIssue}
              placeholder="Describe your issue type..."
              placeholderTextColor="#94A3B8"
            />
          )}
        </View>

        {/* Description Field */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Description</Text>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={5}
            value={comments}
            onChangeText={setComments}
            placeholder="Describe your issue in detail..."
            placeholderTextColor="#94A3B8"
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {comments.length}/500 characters
          </Text>
        </View>

        {/* Supporting Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supporting Information</Text>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
            <View style={styles.optionIcon}>
              <Icon
                name={includeLocation ? 'map-marker-check' : 'map-marker-outline'}
                size={24}
                color={includeLocation ? '#10B981' : '#3B82F6'}
              />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Include Location</Text>
              {includeLocation ? (
                <Text style={styles.optionSubtext}>
                  {location?.address}{'\n'}
                  Coordinates: {location?.latitude.toFixed(6)}, {location?.longitude.toFixed(6)}
                </Text>
              ) : (
                <Text style={styles.optionSubtext}>
                  {locationLoading ? 'Fetching location...' : 'Tap to add your precise GPS coordinates'}
                </Text>
              )}
            </View>
            {locationLoading && (
              <ActivityIndicator size="small" color="#3B82F6" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={pickImage}
          >
            <View style={styles.optionIcon}>
              <Icon name={screenshot ? 'check' : 'image-outline'} size={24} color="#3B82F6" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Attach Screenshot</Text>
              <Text style={styles.optionSubtext}>
                {screenshot ? 'Image ready for upload' : 'Optional - helps diagnose issues'}
              </Text>
            </View>
          </TouchableOpacity>

          {screenshot && (
            <View style={styles.screenshotContainer}>
              <Image
                source={{ uri: screenshot }}
                style={styles.screenshotImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setScreenshot(null)}
              >
                <Icon name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submission Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                Submit Feedback
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
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
    marginBottom: 15,
  },
  issueTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  issueTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedIssueType: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  issueTypeText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  selectedIssueTypeText: {
    color: '#fff',
    fontWeight: '600',
  },
  customIssueInput: {
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  commentInput: {
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#475569',
  },
  characterCount: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 5,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#334155',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },
  optionIcon: {
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  optionSubtext: {
    color: '#94A3B8',
    fontSize: 13,
  },
  screenshotContainer: {
    marginTop: 10,
    position: 'relative',
    alignSelf: 'center',
    width: width - 80,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#475569',
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 18,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default FeedbackScreen;