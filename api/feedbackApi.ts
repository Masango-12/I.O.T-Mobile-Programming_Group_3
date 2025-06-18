import axios from 'axios';
import { API_URL } from '../constants'; // Ensure this points to your backend base URL (e.g., https://chechin-af681.web.app)

export interface FeedbackPayload {
  issueType: string;
  customIssue?: string;
  comments: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  screenshot?: string; // Base64 string (recommended for images)
}

/**
 * Submits user feedback to the backend.
 * @param payload FeedbackPayload object containing all feedback data.
 * @returns Promise<void>
 * @throws Error if submission fails.
 */
export const submitFeedback = async (payload: FeedbackPayload): Promise<void> => {
  try {
    // ✅ POST to correct backend route
    await axios.post(`${API_URL}/api/feedback`, payload);
  } catch (error: any) {
    // Log error for debugging
    console.error('API Submission error:', error?.response || error?.message);
    
    // Throw a user-friendly error message
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Feedback submission failed'
    );
  }
};
