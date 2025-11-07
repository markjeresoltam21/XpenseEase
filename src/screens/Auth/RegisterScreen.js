// Register Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { registerUser } from '../../services/authService';
import { getColleges, getCoursesByCollege, checkAdminExists } from '../../services/firestoreService';

const RegisterScreen = ({ navigation }) => {
  const [role, setRole] = useState('student'); // 'student' or 'admin'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [courseId, setCourseId] = useState('');
  const [college, setCollege] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  useEffect(() => {
    loadColleges();
  }, []);

  const loadColleges = async () => {
    try {
      const collegesList = await getColleges();
      setColleges(collegesList);
    } catch (error) {
      console.error('Error loading colleges:', error);
    }
  };

  const loadCourses = async (selectedCollegeId) => {
    try {
      const coursesList = await getCoursesByCollege(selectedCollegeId);
      setCourses(coursesList);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const handleCollegeSelect = async (selectedCollege) => {
    setCollege(selectedCollege.name);
    setCollegeId(selectedCollege.id);
    setCourse('');
    setCourseId('');
    setShowCollegeModal(false);
    await loadCourses(selectedCollege.id);
  };

  const handleCourseSelect = (selectedCourse) => {
    setCourse(selectedCourse.name);
    setCourseId(selectedCourse.id);
    setShowCourseModal(false);
  };

  const handleRegister = async () => {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Email validation
    if (role === 'student') {
      if (!email.endsWith('@asscat.edu.ph')) {
        Alert.alert('Error', 'Students must use @asscat.edu.ph email address');
        return;
      }
    }

    // Check for @gmail.com
    if (email.endsWith('@gmail.com')) {
      Alert.alert('Error', 'Gmail addresses are not allowed. Please use your institutional email.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (role === 'student' && !studentId) {
      Alert.alert('Error', 'Student ID is required for students');
      return;
    }

    // Check if admin already exists
    if (role === 'admin') {
      setLoading(true);
      const adminExists = await checkAdminExists();
      setLoading(false);
      
      if (adminExists) {
        Alert.alert('Error', 'An admin account already exists. Only one admin is allowed.');
        return;
      }
    }

    setLoading(true);

    const userData = {
      name,
      role,
      studentId: role === 'student' ? studentId : null,
      course: role === 'student' ? course : null,
      courseId: role === 'student' ? courseId : null,
      college: role === 'student' ? college : null,
      collegeId: role === 'student' ? collegeId : null,
      yearLevel: role === 'student' ? yearLevel : null,
    };

    const result = await registerUser(email, password, userData);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Success',
        'Account created successfully! Please login.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } else {
      Alert.alert('Registration Failed', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join XpenseEase today</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Role Selection */}
          <Text style={styles.sectionTitle}>I am a:</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'student' && styles.roleButtonActive
              ]}
              onPress={() => setRole('student')}
            >
              <Ionicons
                name="school"
                size={32}
                color={role === 'student' ? COLORS.white : COLORS.primary}
              />
              <Text style={[
                styles.roleText,
                role === 'student' && styles.roleTextActive
              ]}>
                Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'admin' && styles.roleButtonActive
              ]}
              onPress={() => setRole('admin')}
            >
              <Ionicons
                name="shield-checkmark"
                size={32}
                color={role === 'admin' ? COLORS.white : COLORS.primary}
              />
              <Text style={[
                styles.roleText,
                role === 'admin' && styles.roleTextActive
              ]}>
                Admin
              </Text>
            </TouchableOpacity>
          </View>

          {/* Common Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan Dela Cruz"
              value={name}
              onChangeText={setName}
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder={role === 'student' ? 'juan@asscat.edu.ph' : 'admin@asscat.edu.ph'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          {/* Student-specific fields */}
          {role === 'student' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Student ID *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024-12345"
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>College *</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowCollegeModal(true)}
                >
                  <Text style={[styles.dropdownText, !college && styles.placeholderText]}>
                    {college || 'Select college'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Course *</Text>
                <TouchableOpacity
                  style={[styles.dropdown, !collegeId && styles.dropdownDisabled]}
                  onPress={() => collegeId && setShowCourseModal(true)}
                  disabled={!collegeId}
                >
                  <Text style={[styles.dropdownText, !course && styles.placeholderText]}>
                    {course || (collegeId ? 'Select course' : 'Select college first')}
                  </Text>
                  {collegeId && <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />}
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Year Level</Text>
                <View style={styles.yearLevelContainer}>
                  {['1st', '2nd', '3rd', '4th'].map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearButton,
                        yearLevel === year && styles.yearButtonActive
                      ]}
                      onPress={() => setYearLevel(year)}
                    >
                      <Text style={[
                        styles.yearButtonText,
                        yearLevel === year && styles.yearButtonTextActive
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={COLORS.textLight}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login here</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
              {colleges.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.modalItem,
                    collegeId === item.id && styles.modalItemSelected,
                    index === colleges.length - 1 && styles.modalItemLast
                  ]}
                  onPress={() => handleCollegeSelect(item)}
                >
                  <View style={styles.modalItemIcon}>
                    <Ionicons 
                      name="school" 
                      size={22} 
                      color={collegeId === item.id ? COLORS.primary : COLORS.textLight} 
                    />
                  </View>
                  <Text style={[
                    styles.modalItemText,
                    collegeId === item.id && styles.modalItemTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {collegeId === item.id && (
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
              {courses.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.modalItem,
                    courseId === item.id && styles.modalItemSelected,
                    index === courses.length - 1 && styles.modalItemLast
                  ]}
                  onPress={() => handleCourseSelect(item)}
                >
                  <View style={styles.modalItemIcon}>
                    <Ionicons 
                      name="book" 
                      size={22} 
                      color={courseId === item.id ? COLORS.primary : COLORS.textLight} 
                    />
                  </View>
                  <Text style={[
                    styles.modalItemText,
                    courseId === item.id && styles.modalItemTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {courseId === item.id && (
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  content: {
    padding: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleText: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  roleTextActive: {
    color: COLORS.white,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    fontSize: SIZES.medium,
    color: COLORS.text,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.textLight,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  yearLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yearButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  yearButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  yearButtonText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    fontWeight: '500',
  },
  yearButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: SIZES.large,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
  },
  loginLink: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    fontWeight: '600',
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

export default RegisterScreen;
