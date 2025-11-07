// Manage Students Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { collection, getDocs, query, where, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase.config';
import { useUser } from '../../context/UserContext';
import { logoutUser } from '../../services/authService';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';

const ManageStudentsScreen = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [showEditCourseDropdown, setShowEditCourseDropdown] = useState(false);
  const [showEditCollegeDropdown, setShowEditCollegeDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'studentId', 'course', 'yearLevel'
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    yearLevel: 'all',
    course: 'all',
    college: 'all'
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    course: '',
    college: '',
    yearLevel: '',
    password: '',
    allowance: '',
    budgetType: 'weekly'
  });
  const { user } = useUser();

  useEffect(() => {
    loadStudents();
    loadCourses();
    loadColleges();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, filters, sortBy, searchQuery]);

  const loadStudents = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      const studentsList = [];

      querySnapshot.forEach((doc) => {
        studentsList.push({ id: doc.id, ...doc.data() });
      });

      setStudents(studentsList);
      setFilteredStudents(studentsList);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadCourses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'courses'));
      const coursesList = [];
      querySnapshot.forEach((doc) => {
        coursesList.push({ id: doc.id, ...doc.data() });
      });
      setCourses(coursesList);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadColleges = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'colleges'));
      const collegesList = [];
      querySnapshot.forEach((doc) => {
        collegesList.push({ id: doc.id, ...doc.data() });
      });
      setColleges(collegesList);
    } catch (error) {
      console.error('Error loading colleges:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.email && s.email.toLowerCase().includes(query)) ||
        (s.studentId && s.studentId.toLowerCase().includes(query)) ||
        (s.course && s.course.toLowerCase().includes(query))
      );
    }

    // Filter by year level
    if (filters.yearLevel !== 'all') {
      filtered = filtered.filter(s => s.yearLevel === filters.yearLevel);
    }

    // Filter by course
    if (filters.course !== 'all') {
      filtered = filtered.filter(s => s.course === filters.course);
    }

    // Filter by college
    if (filters.college !== 'all') {
      const collegeCourses = courses.filter(c => c.collegeId === filters.college).map(c => c.code);
      filtered = filtered.filter(s => collegeCourses.includes(s.course));
    }

    // Apply sorting
    if (sortBy === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'studentId') {
      filtered.sort((a, b) => (a.studentId || '').localeCompare(b.studentId || ''));
    } else if (sortBy === 'course') {
      filtered.sort((a, b) => (a.course || '').localeCompare(b.course || ''));
    } else if (sortBy === 'yearLevel') {
      const yearOrder = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4 };
      filtered.sort((a, b) => (yearOrder[a.yearLevel] || 0) - (yearOrder[b.yearLevel] || 0));
    }

    setFilteredStudents(filtered);
  };

  const resetFilters = () => {
    setFilters({
      yearLevel: 'all',
      course: 'all',
      college: 'all'
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.yearLevel !== 'all') count++;
    if (filters.course !== 'all') count++;
    if (filters.college !== 'all') count++;
    return count;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
    loadCourses();
    loadColleges();
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const handleAddStudent = async () => {
    try {
      if (!formData.name || !formData.email || !formData.studentId || !formData.password) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Add to Firestore
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        name: formData.name,
        email: formData.email,
        studentId: formData.studentId,
        course: formData.course || '',
        yearLevel: formData.yearLevel || '',
        allowance: formData.allowance || '0',
        budgetType: formData.budgetType || 'weekly',
        role: 'student',
        createdAt: new Date()
      });

      Alert.alert('Success', 'Student added successfully');
      setShowAddModal(false);
      resetForm();
      loadStudents();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleEditStudent = async () => {
    try {
      if (!formData.name || !formData.email || !formData.studentId) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const studentRef = doc(db, 'users', selectedStudent.id);
      await updateDoc(studentRef, {
        name: formData.name,
        email: formData.email,
        studentId: formData.studentId,
        course: formData.course || '',
        yearLevel: formData.yearLevel || '',
        allowance: formData.allowance || '0',
        budgetType: formData.budgetType || 'weekly',
        updatedAt: new Date()
      });

      Alert.alert('Success', 'Student updated successfully');
      setShowEditModal(false);
      setSelectedStudent(null);
      resetForm();
      loadStudents();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteStudent = (student) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', student.id));
              Alert.alert('Success', 'Student deleted successfully');
              loadStudents();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    
    // Find the college for the student's course
    const studentCourse = courses.find(c => c.code === student.course);
    const collegeId = studentCourse?.collegeId || '';
    
    setFormData({
      name: student.name || '',
      email: student.email || '',
      studentId: student.studentId || '',
      course: student.course || '',
      college: collegeId,
      yearLevel: student.yearLevel || '',
      allowance: student.allowance || '',
      budgetType: student.budgetType || 'weekly',
      password: ''
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      studentId: '',
      course: '',
      college: '',
      yearLevel: '',
      password: '',
      allowance: '',
      budgetType: 'weekly'
    });
    setShowCourseDropdown(false);
    setShowCollegeDropdown(false);
    setShowEditCourseDropdown(false);
    setShowEditCollegeDropdown(false);
  };

  const getCollegeName = (collegeId) => {
    const college = colleges.find(c => c.id === collegeId);
    return college ? college.name : '';
  };

  const getCourseName = (courseCode) => {
    const course = courses.find(c => c.code === courseCode);
    return course ? course.name : '';
  };

  const getFilteredCourses = () => {
    if (!formData.college) return courses;
    return courses.filter(c => c.collegeId === formData.college);
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity 
      style={styles.studentCard}
      onPress={() => openDetailsModal(item)}
      activeOpacity={0.7}
    >
      {item.photoURL ? (
        <Image 
          source={{ uri: item.photoURL }} 
          style={styles.studentAvatarImage}
        />
      ) : (
        <View style={styles.studentAvatar}>
          <Text style={styles.studentInitial}>
            {item.name?.charAt(0).toUpperCase() || 'S'}
          </Text>
        </View>
      )}
      
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentId}>ID: {item.studentId}</Text>
        {item.course && (
          <Text style={styles.studentCourse}>{item.course} - {item.yearLevel}</Text>
        )}
        {item.allowance && (
          <View style={styles.budgetBadge}>
            <Ionicons name="wallet-outline" size={12} color="#4CAF50" />
            <Text style={styles.budgetText}>₱{item.allowance}/{item.budgetType || 'week'}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="pencil" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteStudent(item)}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Profile Dropdown Menu */}
      <Modal
        transparent={true}
        visible={showProfileMenu}
        onRequestClose={() => setShowProfileMenu(false)}
        animationType="fade"
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={styles.profileMenu}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={24} color={COLORS.white} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || 'Admin User'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'admin@gmail.com'}</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowProfileMenu(false);
              }}
            >
              <Ionicons name="person-outline" size={20} color={COLORS.text} />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowProfileMenu(false);
              }}
            >
              <Ionicons name="settings-outline" size={20} color={COLORS.text} />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowProfileMenu(false);
                handleLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
              <Text style={[styles.menuItemText, { color: COLORS.danger }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
        animationType="slide"
      >
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Add New Student</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter student name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Student ID *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter student ID"
                  value={formData.studentId}
                  onChangeText={(text) => setFormData({...formData, studentId: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({...formData, password: text})}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>College</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCollegeDropdown(!showCollegeDropdown)}
                >
                  <Text style={[styles.dropdownButtonText, !formData.college && styles.dropdownPlaceholder]}>
                    {formData.college ? getCollegeName(formData.college) : 'Select College'}
                  </Text>
                  <Ionicons 
                    name={showCollegeDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.textLight} 
                  />
                </TouchableOpacity>
                {showCollegeDropdown && (
                  <View style={styles.dropdownList}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({...formData, college: '', course: ''});
                        setShowCollegeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>None</Text>
                    </TouchableOpacity>
                    {colleges.map((college) => (
                      <TouchableOpacity
                        key={college.id}
                        style={[
                          styles.dropdownItem,
                          formData.college === college.id && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setFormData({...formData, college: college.id, course: ''});
                          setShowCollegeDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          formData.college === college.id && styles.dropdownItemTextActive
                        ]}>
                          {college.name} ({college.code})
                        </Text>
                        {formData.college === college.id && (
                          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Course</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCourseDropdown(!showCourseDropdown)}
                >
                  <Text style={[styles.dropdownButtonText, !formData.course && styles.dropdownPlaceholder]}>
                    {formData.course ? `${formData.course} - ${getCourseName(formData.course)}` : 'Select Course'}
                  </Text>
                  <Ionicons 
                    name={showCourseDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.textLight} 
                  />
                </TouchableOpacity>
                {showCourseDropdown && (
                  <View style={styles.dropdownList}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({...formData, course: ''});
                        setShowCourseDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>None</Text>
                    </TouchableOpacity>
                    {getFilteredCourses().map((course) => (
                      <TouchableOpacity
                        key={course.id}
                        style={[
                          styles.dropdownItem,
                          formData.course === course.code && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setFormData({...formData, course: course.code});
                          setShowCourseDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          formData.course === course.code && styles.dropdownItemTextActive
                        ]}>
                          {course.code} - {course.name}
                        </Text>
                        {formData.course === course.code && (
                          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                    {getFilteredCourses().length === 0 && (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownEmptyText}>
                          {formData.college ? 'No courses in this college' : 'No courses available'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Year Level</Text>
                <View style={styles.yearLevelContainer}>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearLevelButton,
                        formData.yearLevel === year && styles.yearLevelButtonActive
                      ]}
                      onPress={() => setFormData({...formData, yearLevel: year})}
                    >
                      <Text style={[
                        styles.yearLevelText,
                        formData.yearLevel === year && styles.yearLevelTextActive
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weekly/Monthly Allowance</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount (e.g., 1000)"
                  value={formData.allowance}
                  onChangeText={(text) => setFormData({...formData, allowance: text})}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Budget Type</Text>
                <View style={styles.budgetTypeContainer}>
                  <TouchableOpacity
                    style={[styles.budgetTypeButton, formData.budgetType === 'weekly' && styles.budgetTypeButtonActive]}
                    onPress={() => setFormData({...formData, budgetType: 'weekly'})}
                  >
                    <Text style={[styles.budgetTypeText, formData.budgetType === 'weekly' && styles.budgetTypeTextActive]}>
                      Weekly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.budgetTypeButton, formData.budgetType === 'monthly' && styles.budgetTypeButtonActive]}
                    onPress={() => setFormData({...formData, budgetType: 'monthly'})}
                  >
                    <Text style={[styles.budgetTypeText, formData.budgetType === 'monthly' && styles.budgetTypeTextActive]}>
                      Monthly
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddStudent}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.addButtonText}>Add Student</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        transparent={true}
        visible={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
        animationType="slide"
      >
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Edit Student</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter student name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Student ID *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter student ID"
                  value={formData.studentId}
                  onChangeText={(text) => setFormData({...formData, studentId: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>College</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowEditCollegeDropdown(!showEditCollegeDropdown)}
                >
                  <Text style={[styles.dropdownButtonText, !formData.college && styles.dropdownPlaceholder]}>
                    {formData.college ? getCollegeName(formData.college) : 'Select College'}
                  </Text>
                  <Ionicons 
                    name={showEditCollegeDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.textLight} 
                  />
                </TouchableOpacity>
                {showEditCollegeDropdown && (
                  <View style={styles.dropdownList}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({...formData, college: '', course: ''});
                        setShowEditCollegeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>None</Text>
                    </TouchableOpacity>
                    {colleges.map((college) => (
                      <TouchableOpacity
                        key={college.id}
                        style={[
                          styles.dropdownItem,
                          formData.college === college.id && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setFormData({...formData, college: college.id, course: ''});
                          setShowEditCollegeDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          formData.college === college.id && styles.dropdownItemTextActive
                        ]}>
                          {college.name} ({college.code})
                        </Text>
                        {formData.college === college.id && (
                          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Course</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowEditCourseDropdown(!showEditCourseDropdown)}
                >
                  <Text style={[styles.dropdownButtonText, !formData.course && styles.dropdownPlaceholder]}>
                    {formData.course ? `${formData.course} - ${getCourseName(formData.course)}` : 'Select Course'}
                  </Text>
                  <Ionicons 
                    name={showEditCourseDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.textLight} 
                  />
                </TouchableOpacity>
                {showEditCourseDropdown && (
                  <View style={styles.dropdownList}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({...formData, course: ''});
                        setShowEditCourseDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>None</Text>
                    </TouchableOpacity>
                    {getFilteredCourses().map((course) => (
                      <TouchableOpacity
                        key={course.id}
                        style={[
                          styles.dropdownItem,
                          formData.course === course.code && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setFormData({...formData, course: course.code});
                          setShowEditCourseDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          formData.course === course.code && styles.dropdownItemTextActive
                        ]}>
                          {course.code} - {course.name}
                        </Text>
                        {formData.course === course.code && (
                          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                    {getFilteredCourses().length === 0 && (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownEmptyText}>
                          {formData.college ? 'No courses in this college' : 'No courses available'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Year Level</Text>
                <View style={styles.yearLevelContainer}>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearLevelButton,
                        formData.yearLevel === year && styles.yearLevelButtonActive
                      ]}
                      onPress={() => setFormData({...formData, yearLevel: year})}
                    >
                      <Text style={[
                        styles.yearLevelText,
                        formData.yearLevel === year && styles.yearLevelTextActive
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weekly/Monthly Allowance</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount (e.g., 1000)"
                  value={formData.allowance}
                  onChangeText={(text) => setFormData({...formData, allowance: text})}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Budget Type</Text>
                <View style={styles.budgetTypeContainer}>
                  <TouchableOpacity
                    style={[styles.budgetTypeButton, formData.budgetType === 'weekly' && styles.budgetTypeButtonActive]}
                    onPress={() => setFormData({...formData, budgetType: 'weekly'})}
                  >
                    <Text style={[styles.budgetTypeText, formData.budgetType === 'weekly' && styles.budgetTypeTextActive]}>
                      Weekly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.budgetTypeButton, formData.budgetType === 'monthly' && styles.budgetTypeButtonActive]}
                    onPress={() => setFormData({...formData, budgetType: 'monthly'})}
                  >
                    <Text style={[styles.budgetTypeText, formData.budgetType === 'monthly' && styles.budgetTypeTextActive]}>
                      Monthly
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleEditStudent}
              >
                <Ionicons name="save-outline" size={20} color={COLORS.white} />
                <Text style={styles.addButtonText}>Update Student</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Student Details Modal */}
      <Modal
        transparent={true}
        visible={showDetailsModal}
        onRequestClose={() => setShowDetailsModal(false)}
        animationType="fade"
      >
        <Pressable 
          style={styles.detailsModalOverlay}
          onPress={() => setShowDetailsModal(false)}
        >
          <View style={styles.detailsModalContent}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsAvatarLarge}>
                <Text style={styles.detailsInitial}>
                  {selectedStudent?.name?.charAt(0).toUpperCase() || 'S'}
                </Text>
              </View>
              <Text style={styles.detailsName}>{selectedStudent?.name}</Text>
              <Text style={styles.detailsEmail}>{selectedStudent?.email}</Text>
            </View>

            <View style={styles.detailsBody}>
              <View style={styles.detailRow}>
                <Ionicons name="card-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Student ID:</Text>
                <Text style={styles.detailValue}>{selectedStudent?.studentId}</Text>
              </View>

              {selectedStudent?.course && (
                <View style={styles.detailRow}>
                  <Ionicons name="school-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.detailLabel}>Course:</Text>
                  <Text style={styles.detailValue}>{selectedStudent?.course}</Text>
                </View>
              )}

              {selectedStudent?.yearLevel && (
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.detailLabel}>Year Level:</Text>
                  <Text style={styles.detailValue}>{selectedStudent?.yearLevel}</Text>
                </View>
              )}

              {selectedStudent?.allowance && (
                <View style={styles.detailRow}>
                  <Ionicons name="wallet-outline" size={20} color="#4CAF50" />
                  <Text style={styles.detailLabel}>Allowance:</Text>
                  <Text style={styles.detailValue}>
                    ₱{selectedStudent?.allowance}/{selectedStudent?.budgetType || 'week'}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color={COLORS.textLight} />
                <Text style={styles.detailLabel}>Joined:</Text>
                <Text style={styles.detailValue}>
                  {selectedStudent?.createdAt?.toDate ? 
                    selectedStudent.createdAt.toDate().toLocaleDateString() : 
                    'N/A'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.closeDetailsButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.closeDetailsText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Filter Modal */}
      <Modal
        transparent={true}
        visible={showFilterModal}
        onRequestClose={() => setShowFilterModal(false)}
        animationType="slide"
      >
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Filter Students</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Year Level</Text>
                <View style={styles.yearLevelContainer}>
                  <TouchableOpacity
                    style={[
                      styles.yearLevelButton,
                      filters.yearLevel === 'all' && styles.yearLevelButtonActive
                    ]}
                    onPress={() => setFilters({...filters, yearLevel: 'all'})}
                  >
                    <Text style={[
                      styles.yearLevelText,
                      filters.yearLevel === 'all' && styles.yearLevelTextActive
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearLevelButton,
                        filters.yearLevel === year && styles.yearLevelButtonActive
                      ]}
                      onPress={() => setFilters({...filters, yearLevel: year})}
                    >
                      <Text style={[
                        styles.yearLevelText,
                        filters.yearLevel === year && styles.yearLevelTextActive
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Course</Text>
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    filters.course === 'all' && styles.pickerOptionActive
                  ]}
                  onPress={() => setFilters({...filters, course: 'all'})}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    filters.course === 'all' && styles.pickerOptionTextActive
                  ]}>
                    All Courses
                  </Text>
                </TouchableOpacity>
                <View style={styles.pickerContainer}>
                  {courses.map((course) => (
                    <TouchableOpacity
                      key={course.id}
                      style={[
                        styles.pickerOption,
                        filters.course === course.code && styles.pickerOptionActive
                      ]}
                      onPress={() => setFilters({...filters, course: course.code})}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        filters.course === course.code && styles.pickerOptionTextActive
                      ]}>
                        {course.code} - {course.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>College</Text>
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    filters.college === 'all' && styles.pickerOptionActive
                  ]}
                  onPress={() => setFilters({...filters, college: 'all'})}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    filters.college === 'all' && styles.pickerOptionTextActive
                  ]}>
                    All Colleges
                  </Text>
                </TouchableOpacity>
                <View style={styles.pickerContainer}>
                  {colleges.map((college) => (
                    <TouchableOpacity
                      key={college.id}
                      style={[
                        styles.pickerOption,
                        filters.college === college.id && styles.pickerOptionActive
                      ]}
                      onPress={() => setFilters({...filters, college: college.id})}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        filters.college === college.id && styles.pickerOptionTextActive
                      ]}>
                        {college.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={resetFilters}
                >
                  <Ionicons name="refresh-outline" size={20} color={COLORS.textLight} />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Ionicons name="checkmark-outline" size={20} color={COLORS.white} />
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Curved Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Manage Students</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => setShowProfileMenu(true)}
            >
              {user?.photoURL ? (
                <Image 
                  source={{ uri: user.photoURL }} 
                  style={[styles.profileButtonAvatar, { backgroundColor: 'transparent' }]} 
                />
              ) : (
                <View style={styles.profileButtonAvatar}>
                  <Text style={styles.profileInitial}>
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.curvedBottom} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, ID, or course..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
          <Ionicons name="filter" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort Controls */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
              onPress={() => setSortBy('name')}
            >
              <Ionicons 
                name="person-outline" 
                size={16} 
                color={sortBy === 'name' ? COLORS.white : COLORS.primary} 
              />
              <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
                Name
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'studentId' && styles.sortButtonActive]}
              onPress={() => setSortBy('studentId')}
            >
              <Ionicons 
                name="card-outline" 
                size={16} 
                color={sortBy === 'studentId' ? COLORS.white : COLORS.primary} 
              />
              <Text style={[styles.sortButtonText, sortBy === 'studentId' && styles.sortButtonTextActive]}>
                Student ID
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'course' && styles.sortButtonActive]}
              onPress={() => setSortBy('course')}
            >
              <Ionicons 
                name="school-outline" 
                size={16} 
                color={sortBy === 'course' ? COLORS.white : COLORS.primary} 
              />
              <Text style={[styles.sortButtonText, sortBy === 'course' && styles.sortButtonTextActive]}>
                Course
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'yearLevel' && styles.sortButtonActive]}
              onPress={() => setSortBy('yearLevel')}
            >
              <Ionicons 
                name="calendar-outline" 
                size={16} 
                color={sortBy === 'yearLevel' ? COLORS.white : COLORS.primary} 
              />
              <Text style={[styles.sortButtonText, sortBy === 'yearLevel' && styles.sortButtonTextActive]}>
                Year Level
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={80} color={COLORS.border} />
            <Text style={styles.emptyText}>No students registered yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add students</Text>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 30,
    position: 'relative',
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  profileButtonAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  curvedBottom: {
    height: 30,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  profileMenu: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary + '10',
    borderTopLeftRadius: SIZES.borderRadius,
    borderTopRightRadius: SIZES.borderRadius,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  listContent: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  studentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  studentAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  studentInitial: {
    fontSize: SIZES.xlarge,
    fontWeight: '700',
    color: COLORS.white,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  studentId: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginTop: 4,
  },
  studentCourse: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginTop: 2,
  },
  budgetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  budgetText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    marginTop: 8,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    color: COLORS.white,
  },
  budgetTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  budgetTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  budgetTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  budgetTypeText: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  budgetTypeTextActive: {
    color: COLORS.white,
  },
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailsModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  detailsHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.primary + '10',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  detailsAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailsInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  detailsName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  detailsEmail: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
  },
  detailsBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    marginLeft: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    fontWeight: '600',
  },
  closeDetailsButton: {
    padding: 16,
    margin: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeDetailsText: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    color: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  sortContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  sortScroll: {
    flexGrow: 0,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sortButtonTextActive: {
    color: COLORS.white,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: COLORS.textLight,
  },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primary + '10',
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  dropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  dropdownEmptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  pickerOptionActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  pickerOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  yearLevelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearLevelButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  yearLevelButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  yearLevelText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  yearLevelTextActive: {
    color: COLORS.white,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  applyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default ManageStudentsScreen;
