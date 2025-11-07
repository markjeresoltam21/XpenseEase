import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { useUser } from '../../context/UserContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase.config';
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { pickProfileImage, convertImageToBase64, updateProfilePicture } from '../../services/profileService';
import { getColleges, getCoursesByCollege } from '../../services/firestoreService';

const ProfileScreen = ({ navigation }) => {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    course: '',
    courseId: '',
    college: '',
    collegeId: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadColleges();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        studentId: user.studentId || '',
        course: user.course || '',
        courseId: user.courseId || '',
        college: user.college || '',
        collegeId: user.collegeId || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Load courses if college is set
      if (user.collegeId) {
        loadCourses(user.collegeId);
      }
    }
  }, [user]);

  const loadColleges = async () => {
    try {
      const collegesList = await getColleges();
      setColleges(collegesList);
    } catch (error) {
      console.error('Error loading colleges:', error);
    }
  };

  const loadCourses = async (collegeId) => {
    try {
      const coursesList = await getCoursesByCollege(collegeId);
      setCourses(coursesList);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const handleCollegeSelect = async (college) => {
    setFormData({
      ...formData,
      college: college.name,
      collegeId: college.id,
      course: '',
      courseId: ''
    });
    setShowCollegeModal(false);
    await loadCourses(college.id);
  };

  const handleCourseSelect = (course) => {
    setFormData({
      ...formData,
      course: course.name,
      courseId: course.id
    });
    setShowCourseModal(false);
  };

  const handleChangeProfilePicture = async () => {
    try {
      setUploading(true);
      const imageUri = await pickProfileImage();
      if (!imageUri) {
        setUploading(false);
        return;
      }

      const base64Image = await convertImageToBase64(imageUri);
      await updateProfilePicture(user.uid, base64Image);

      // Update local user context
      setUser({ ...user, photoURL: base64Image });
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', error.message || 'Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);
              await updateProfilePicture(user.uid, null);
              setUser({ ...user, photoURL: null });
              Alert.alert('Success', 'Profile picture removed successfully');
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setUploading(false);
            }
          }
        }
      ]
    );
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }

    // Validate email domain for students
    if (formData.email !== user.email) {
      if (!formData.email.endsWith('@asscat.edu.ph')) {
        Alert.alert('Error', 'Students must use @asscat.edu.ph email address');
        return false;
      }
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        Alert.alert('Error', 'Current password is required to change password');
        return false;
      }
      if (formData.newPassword.length < 6) {
        Alert.alert('Error', 'New password must be at least 6 characters');
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        Alert.alert('Error', 'New passwords do not match');
        return false;
      }
    }

    if (formData.email !== user.email && !formData.currentPassword) {
      Alert.alert('Error', 'Current password is required to change email');
      return false;
    }

    return true;
  };

  const reauthenticate = async () => {
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      formData.currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Re-authenticate if changing sensitive info
      if (formData.currentPassword) {
        await reauthenticate();
      }

      // Prepare update data
      const updateData = {};
      
      if (formData.name !== user.name) {
        updateData.name = formData.name;
      }
      
      if (formData.studentId !== user.studentId) {
        updateData.studentId = formData.studentId;
      }
      
      if (formData.course !== user.course) {
        updateData.course = formData.course;
        updateData.courseId = formData.courseId;
      }
      
      if (formData.college !== user.college) {
        updateData.college = formData.college;
        updateData.collegeId = formData.collegeId;
      }

      // Update Firestore if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'users', user.uid), updateData);
      }

      // Update email if changed
      if (formData.email !== user.email) {
        await updateEmail(auth.currentUser, formData.email);
        await updateDoc(doc(db, 'users', user.uid), {
          email: formData.email
        });
      }

      // Update password if provided
      if (formData.newPassword) {
        await updatePassword(auth.currentUser, formData.newPassword);
      }

      // Update local user context
      setUser({
        ...user,
        ...updateData,
        email: formData.email
      });

      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Failed to update profile';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log out and log in again to make these changes';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setEditMode(!editMode)}
        >
          <Ionicons 
            name={editMode ? "close" : "create-outline"} 
            size={24} 
            color={COLORS.white} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {uploading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : user?.photoURL ? (
              <Image 
                source={{ uri: user.photoURL }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={60} color={COLORS.white} />
              </View>
            )}
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleChangeProfilePicture}
              disabled={uploading}
            >
              <Ionicons name="camera" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          {user?.photoURL && (
            <TouchableOpacity 
              style={styles.removePhotoButton}
              onPress={handleRemoveProfilePicture}
              disabled={uploading}
            >
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.roleText}>Student</Text>
        </View>

        {/* Profile Information */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textLight}
              editable={editMode}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={editMode}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={formData.studentId}
              onChangeText={(text) => setFormData({ ...formData, studentId: text })}
              placeholder="2024-00001"
              placeholderTextColor={COLORS.textLight}
              editable={editMode}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>College</Text>
            <TouchableOpacity
              style={[styles.input, !editMode && styles.inputDisabled]}
              onPress={() => editMode && setShowCollegeModal(true)}
              disabled={!editMode}
            >
              <Text style={[styles.dropdownText, !formData.college && styles.placeholderText]}>
                {formData.college || 'Select college'}
              </Text>
              {editMode && <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Course</Text>
            <TouchableOpacity
              style={[styles.input, (!editMode || !formData.collegeId) && styles.inputDisabled]}
              onPress={() => editMode && formData.collegeId && setShowCourseModal(true)}
              disabled={!editMode || !formData.collegeId}
            >
              <Text style={[styles.dropdownText, !formData.course && styles.placeholderText]}>
                {formData.course || (formData.collegeId ? 'Select course' : 'Select college first')}
              </Text>
              {editMode && formData.collegeId && <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />}
            </TouchableOpacity>
          </View>

          {editMode && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Change Password</Text>
              <Text style={styles.sectionSubtitle}>Leave blank if you don't want to change password</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={formData.currentPassword}
                  onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={formData.newPassword}
                  onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  placeholder="Confirm new password"
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry
                />
              </View>
            </>
          )}

          {editMode && (
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* College Selection Modal */}
      <Modal
        visible={showCollegeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCollegeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select College</Text>
                <Text style={styles.modalSubtitle}>Choose your college</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCollegeModal(false)}
              >
                <Ionicons name="close-circle" size={28} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {colleges.map((college, index) => (
                <TouchableOpacity
                  key={college.id}
                  style={[
                    styles.modalItem,
                    formData.collegeId === college.id && styles.modalItemSelected,
                    index === colleges.length - 1 && styles.modalItemLast
                  ]}
                  onPress={() => handleCollegeSelect(college)}
                >
                  <View style={styles.modalItemIcon}>
                    <Ionicons 
                      name="school" 
                      size={22} 
                      color={formData.collegeId === college.id ? COLORS.primary : COLORS.textLight} 
                    />
                  </View>
                  <Text style={[
                    styles.modalItemText,
                    formData.collegeId === college.id && styles.modalItemTextSelected
                  ]}>
                    {college.name}
                  </Text>
                  {formData.collegeId === college.id && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Course Selection Modal */}
      <Modal
        visible={showCourseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCourseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Course</Text>
                <Text style={styles.modalSubtitle}>Choose your course program</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCourseModal(false)}
              >
                <Ionicons name="close-circle" size={28} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {courses.map((course, index) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.modalItem,
                    formData.courseId === course.id && styles.modalItemSelected,
                    index === courses.length - 1 && styles.modalItemLast
                  ]}
                  onPress={() => handleCourseSelect(course)}
                >
                  <View style={styles.modalItemIcon}>
                    <Ionicons 
                      name="book" 
                      size={22} 
                      color={formData.courseId === course.id ? COLORS.primary : COLORS.textLight} 
                    />
                  </View>
                  <Text style={[
                    styles.modalItemText,
                    formData.courseId === course.id && styles.modalItemTextSelected
                  ]}>
                    {course.name}
                  </Text>
                  {formData.courseId === course.id && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: COLORS.white,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.secondary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.secondary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  removePhotoButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removePhotoText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  roleText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 4,
  },
  formSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: COLORS.textLight,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.textLight,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: COLORS.white,
  },
  modalItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  modalItemLast: {
    borderBottomWidth: 0,
  },
  modalItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalItemText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  modalItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
});

export default ProfileScreen;
