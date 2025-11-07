// Manage Courses Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase.config';
import { useUser } from '../../context/UserContext';
import { logoutUser } from '../../services/authService';

const ManageCoursesScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddCollegeModal, setShowAddCollegeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editType, setEditType] = useState('course'); // 'course' or 'college'
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'colleges'
  const [searchQuery, setSearchQuery] = useState('');
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    description: '',
    collegeId: ''
  });
  const [collegeForm, setCollegeForm] = useState({
    code: '',
    name: '',
    description: ''
  });
  const { user } = useUser();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applySearch();
  }, [courses, colleges, searchQuery]);

  const applySearch = () => {
    let filteredCrs = [...courses];
    let filteredColls = [...colleges];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredCrs = filteredCrs.filter(c => 
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.code && c.code.toLowerCase().includes(query)) ||
        (c.description && c.description.toLowerCase().includes(query))
      );
      filteredColls = filteredColls.filter(c => 
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.code && c.code.toLowerCase().includes(query)) ||
        (c.description && c.description.toLowerCase().includes(query))
      );
    }

    // Sort by name by default
    filteredCrs.sort((a, b) => a.name.localeCompare(b.name));
    filteredColls.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredCourses(filteredCrs);
    setFilteredColleges(filteredColls);
  };

  const loadData = async () => {
    try {
      await Promise.all([loadCourses(), loadColleges()]);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const handleAddCourse = async () => {
    try {
      if (!courseForm.code || !courseForm.name) {
        Alert.alert('Error', 'Please fill in required fields (Code and Name)');
        return;
      }

      await addDoc(collection(db, 'courses'), {
        code: courseForm.code.toUpperCase(),
        name: courseForm.name,
        description: courseForm.description || '',
        collegeId: courseForm.collegeId || '',
        createdAt: new Date()
      });

      Alert.alert('Success', 'Course added successfully');
      setShowAddCourseModal(false);
      resetCourseForm();
      loadCourses();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAddCollege = async () => {
    try {
      if (!collegeForm.code || !collegeForm.name) {
        Alert.alert('Error', 'Please fill in required fields (Code and Name)');
        return;
      }

      await addDoc(collection(db, 'colleges'), {
        code: collegeForm.code.toUpperCase(),
        name: collegeForm.name,
        description: collegeForm.description || '',
        createdAt: new Date()
      });

      Alert.alert('Success', 'College added successfully');
      setShowAddCollegeModal(false);
      resetCollegeForm();
      loadColleges();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleEditCourse = async () => {
    try {
      if (!courseForm.code || !courseForm.name) {
        Alert.alert('Error', 'Please fill in required fields');
        return;
      }

      const courseRef = doc(db, 'courses', selectedItem.id);
      await updateDoc(courseRef, {
        code: courseForm.code.toUpperCase(),
        name: courseForm.name,
        description: courseForm.description || '',
        collegeId: courseForm.collegeId || '',
        updatedAt: new Date()
      });

      Alert.alert('Success', 'Course updated successfully');
      setShowEditModal(false);
      setSelectedItem(null);
      resetCourseForm();
      loadCourses();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleEditCollege = async () => {
    try {
      if (!collegeForm.code || !collegeForm.name) {
        Alert.alert('Error', 'Please fill in required fields');
        return;
      }

      const collegeRef = doc(db, 'colleges', selectedItem.id);
      await updateDoc(collegeRef, {
        code: collegeForm.code.toUpperCase(),
        name: collegeForm.name,
        description: collegeForm.description || '',
        updatedAt: new Date()
      });

      Alert.alert('Success', 'College updated successfully');
      setShowEditModal(false);
      setSelectedItem(null);
      resetCollegeForm();
      loadColleges();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteCourse = (course) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete ${course.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'courses', course.id));
              Alert.alert('Success', 'Course deleted successfully');
              loadCourses();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleDeleteCollege = (college) => {
    Alert.alert(
      'Delete College',
      `Are you sure you want to delete ${college.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'colleges', college.id));
              Alert.alert('Success', 'College deleted successfully');
              loadColleges();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const openEditCourse = (course) => {
    setSelectedItem(course);
    setEditType('course');
    setCourseForm({
      code: course.code || '',
      name: course.name || '',
      description: course.description || '',
      collegeId: course.collegeId || ''
    });
    setShowEditModal(true);
  };

  const openEditCollege = (college) => {
    setSelectedItem(college);
    setEditType('college');
    setCollegeForm({
      code: college.code || '',
      name: college.name || '',
      description: college.description || ''
    });
    setShowEditModal(true);
  };

  const resetCourseForm = () => {
    setCourseForm({ code: '', name: '', description: '', collegeId: '' });
  };

  const resetCollegeForm = () => {
    setCollegeForm({ code: '', name: '', description: '' });
  };

  const getCollegeName = (collegeId) => {
    const college = colleges.find(c => c.id === collegeId);
    return college ? college.name : 'No College';
  };

  const renderCourse = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name="school" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardCode}>{item.code}</Text>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.cardDescription}>{item.description}</Text>
          ) : null}
          {item.collegeId && (
            <View style={styles.collegeBadge}>
              <Ionicons name="business-outline" size={12} color={COLORS.primary} />
              <Text style={styles.collegeText}>{getCollegeName(item.collegeId)}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openEditCourse(item)}
        >
          <Ionicons name="pencil" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteCourse(item)}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCollege = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name="business" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardCode}>{item.code}</Text>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.cardDescription}>{item.description}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openEditCollege(item)}
        >
          <Ionicons name="pencil" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteCollege(item)}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Profile Menu Modal */}
      <Modal
        transparent={true}
        visible={showProfileMenu}
        onRequestClose={() => setShowProfileMenu(false)}
        animationType="fade"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setShowProfileMenu(false)}
          activeOpacity={1}
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
              onPress={() => setShowProfileMenu(false)}
            >
              <Ionicons name="person-outline" size={20} color={COLORS.text} />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setShowProfileMenu(false)}
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
        </TouchableOpacity>
      </Modal>

      {/* Add Course Modal */}
      <Modal
        transparent={true}
        visible={showAddCourseModal}
        onRequestClose={() => setShowAddCourseModal(false)}
        animationType="slide"
      >
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Add New Course</Text>
              <TouchableOpacity onPress={() => { setShowAddCourseModal(false); resetCourseForm(); }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Course Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., BSIT, BSCS"
                  value={courseForm.code}
                  onChangeText={(text) => setCourseForm({...courseForm, code: text})}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Course Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Bachelor of Science in Information Technology"
                  value={courseForm.name}
                  onChangeText={(text) => setCourseForm({...courseForm, name: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>College</Text>
                <View style={styles.pickerContainer}>
                  {colleges.map((college) => (
                    <TouchableOpacity
                      key={college.id}
                      style={[
                        styles.pickerOption,
                        courseForm.collegeId === college.id && styles.pickerOptionActive
                      ]}
                      onPress={() => setCourseForm({...courseForm, collegeId: college.id})}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        courseForm.collegeId === college.id && styles.pickerOptionTextActive
                      ]}>
                        {college.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter course description"
                  value={courseForm.description}
                  onChangeText={(text) => setCourseForm({...courseForm, description: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddCourse}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.addButtonText}>Add Course</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add College Modal */}
      <Modal
        transparent={true}
        visible={showAddCollegeModal}
        onRequestClose={() => setShowAddCollegeModal(false)}
        animationType="slide"
      >
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Add New College</Text>
              <TouchableOpacity onPress={() => { setShowAddCollegeModal(false); resetCollegeForm(); }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>College Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., CCS, COE"
                  value={collegeForm.code}
                  onChangeText={(text) => setCollegeForm({...collegeForm, code: text})}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>College Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., College of Computer Studies"
                  value={collegeForm.name}
                  onChangeText={(text) => setCollegeForm({...collegeForm, name: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter college description"
                  value={collegeForm.description}
                  onChangeText={(text) => setCollegeForm({...collegeForm, description: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: '#4CAF50' }]}
                onPress={handleAddCollege}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.addButtonText}>Add College</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        transparent={true}
        visible={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
        animationType="slide"
      >
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>
                Edit {editType === 'course' ? 'Course' : 'College'}
              </Text>
              <TouchableOpacity onPress={() => { 
                setShowEditModal(false); 
                resetCourseForm(); 
                resetCollegeForm();
              }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {editType === 'course' ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Course Code *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., BSIT, BSCS"
                      value={courseForm.code}
                      onChangeText={(text) => setCourseForm({...courseForm, code: text})}
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Course Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Bachelor of Science in Information Technology"
                      value={courseForm.name}
                      onChangeText={(text) => setCourseForm({...courseForm, name: text})}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>College</Text>
                    <View style={styles.pickerContainer}>
                      {colleges.map((college) => (
                        <TouchableOpacity
                          key={college.id}
                          style={[
                            styles.pickerOption,
                            courseForm.collegeId === college.id && styles.pickerOptionActive
                          ]}
                          onPress={() => setCourseForm({...courseForm, collegeId: college.id})}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            courseForm.collegeId === college.id && styles.pickerOptionTextActive
                          ]}>
                            {college.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Enter course description"
                      value={courseForm.description}
                      onChangeText={(text) => setCourseForm({...courseForm, description: text})}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={handleEditCourse}
                  >
                    <Ionicons name="save-outline" size={20} color={COLORS.white} />
                    <Text style={styles.addButtonText}>Update Course</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>College Code *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., CCS, COE"
                      value={collegeForm.code}
                      onChangeText={(text) => setCollegeForm({...collegeForm, code: text})}
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>College Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., College of Computer Studies"
                      value={collegeForm.name}
                      onChangeText={(text) => setCollegeForm({...collegeForm, name: text})}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Enter college description"
                      value={collegeForm.description}
                      onChangeText={(text) => setCollegeForm({...collegeForm, description: text})}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: '#4CAF50' }]}
                    onPress={handleEditCollege}
                  >
                    <Ionicons name="save-outline" size={20} color={COLORS.white} />
                    <Text style={styles.addButtonText}>Update College</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Courses & Colleges</Text>
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'courses' && styles.tabActive]}
          onPress={() => setActiveTab('courses')}
        >
          <Ionicons 
            name="school" 
            size={20} 
            color={activeTab === 'courses' ? COLORS.primary : COLORS.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>
            Courses ({courses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'colleges' && styles.tabActive]}
          onPress={() => setActiveTab('colleges')}
        >
          <Ionicons 
            name="business" 
            size={20} 
            color={activeTab === 'colleges' ? COLORS.primary : COLORS.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'colleges' && styles.tabTextActive]}>
            Colleges ({colleges.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab === 'courses' ? 'courses' : 'colleges'} by name, code, or description...`}
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
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'courses' ? filteredCourses : filteredColleges}
        renderItem={activeTab === 'courses' ? renderCourse : renderCollege}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons 
              name={activeTab === 'courses' ? 'school-outline' : 'business-outline'} 
              size={80} 
              color={COLORS.border} 
            />
            <Text style={styles.emptyText}>
              No {activeTab === 'courses' ? 'courses' : 'colleges'} added yet
            </Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add {activeTab === 'courses' ? 'a course' : 'a college'}
            </Text>
          </View>
        )}
      />

      {/* Floating Action Buttons */}
      {activeTab === 'courses' ? (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setShowAddCourseModal(true)}
        >
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: '#4CAF50' }]}
          onPress={() => setShowAddCollegeModal(true)}
        >
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: COLORS.background,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  searchContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputContainer: {
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
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
    alignItems: 'center',
  },
  cardHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardCode: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  collegeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.secondary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  collegeText: {
    fontSize: 11,
    color: COLORS.primary,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
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
    borderRadius: 12,
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 13,
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
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 12,
    fontWeight: '500',
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
    fontSize: 15,
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
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default ManageCoursesScreen;
