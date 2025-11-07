// Profile Service - Handle profile picture uploads
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { Alert } from 'react-native';

// Request permissions for image picker
export const requestImagePermissions = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload profile pictures.');
    return false;
  }
  return true;
};

// Pick image from gallery
export const pickProfileImage = async () => {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image. Please try again.');
    return null;
  }
};

// Convert image to base64 for storage
export const convertImageToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

// Update user profile picture in Firestore
export const updateProfilePicture = async (userId, photoURL) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photoURL: photoURL,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return { success: false, error: error.message };
  }
};

// Remove profile picture
export const removeProfilePicture = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photoURL: null,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error removing profile picture:', error);
    return { success: false, error: error.message };
  }
};
