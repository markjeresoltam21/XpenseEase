// Admin Dashboard Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
  FlatList,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase.config';
import { formatCurrency } from '../../utils/helpers';
import { useUser } from '../../context/UserContext';
import { logoutUser, getCurrentUserData } from '../../services/authService';
import { pickProfileImage, convertImageToBase64, updateProfilePicture } from '../../services/profileService';

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalExpenses: 0,
    totalAmount: 0,
    activeToday: 0,
    totalColleges: 0,
    totalCourses: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const { user, setUser } = useUser();

  useEffect(() => {
    loadStatistics();
    loadUserData();
    
    // Set up real-time listener for login activities
    const loginActivityRef = collection(db, 'loginActivity');
    const loginQuery = query(
      loginActivityRef,
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(loginQuery, (snapshot) => {
      const transactions = [];
      snapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      setRecentTransactions(transactions);
    });

    return () => unsubscribe();
  }, []);

  // Add focus listener to reload user data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadStatistics = async () => {
    try {
      // Get all students
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const usersSnapshot = await getDocs(usersQuery);
      const totalStudents = usersSnapshot.size;

      // Get all expenses
      const expensesSnapshot = await getDocs(collection(db, 'expenses'));
      const expenses = [];
      let totalAmount = 0;

      expensesSnapshot.forEach((doc) => {
        const data = doc.data();
        expenses.push(data);
        totalAmount += parseFloat(data.amount) || 0;
      });

      // Get today's active students
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeToday = expenses.filter(expense => {
        try {
          // Handle both Firestore Timestamp and ISO string
          let expenseDate;
          if (expense.date?.toDate) {
            expenseDate = expense.date.toDate();
          } else if (typeof expense.date === 'string') {
            expenseDate = new Date(expense.date);
          } else {
            expenseDate = new Date();
          }
          return expenseDate >= today;
        } catch (err) {
          return false;
        }
      }).length;

      // Get colleges and courses
      const collegesSnapshot = await getDocs(collection(db, 'colleges'));
      const collegesData = [];
      collegesSnapshot.forEach((doc) => {
        collegesData.push({ id: doc.id, ...doc.data() });
      });
      setColleges(collegesData);

      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = [];
      coursesSnapshot.forEach((doc) => {
        coursesData.push({ id: doc.id, ...doc.data() });
      });
      setCourses(coursesData);

      setStats({
        totalStudents,
        totalExpenses: expenses.length,
        totalAmount,
        activeToday,
        totalColleges: collegesData.length,
        totalCourses: coursesData.length
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStatistics();
    loadUserData();
  };

  const loadUserData = async () => {
    if (user?.uid) {
      const result = await getCurrentUserData(user.uid);
      if (result.success) {
        setUser({
          ...user,
          ...result.userData
        });
      }
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const handleChangeProfilePicture = async () => {
    try {
      setShowProfileMenu(false);
      
      const imageUri = await pickProfileImage();
      if (!imageUri) return;

      const base64Image = await convertImageToBase64(imageUri);
      if (!base64Image) {
        Alert.alert('Error', 'Failed to process image');
        return;
      }

      const result = await updateProfilePicture(user.uid, base64Image);
      if (result.success) {
        Alert.alert('Success', 'Profile picture updated successfully!');
        // Reload user data to get the updated photoURL
        await loadUserData();
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile picture');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating profile picture');
    }
  };

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
              <TouchableOpacity onPress={handleChangeProfilePicture}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.profileAvatar} />
                ) : (
                  <View style={styles.profileAvatar}>
                    <Ionicons name="person" size={24} color={COLORS.white} />
                  </View>
                )}
                <View style={styles.cameraIconBadge}>
                  <Ionicons name="camera" size={14} color={COLORS.white} />
                </View>
              </TouchableOpacity>
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
                navigation.navigate('Profile');
              }}
            >
              <Ionicons name="person-outline" size={20} color={COLORS.text} />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowProfileMenu(false);
                // Navigate to settings
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Enhanced Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerLabel}>Dashboard</Text>
              <Text style={styles.headerGreeting}>Welcome, {user?.name?.split(' ')[0] || 'Admin'}</Text>
              <Text style={styles.headerSubtitle}>XpenseEase Admin Panel</Text>
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
                    {user?.name?.charAt(0) || 'A'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.contentContainer}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: COLORS.white, borderColor: COLORS.secondary }]}>
              <Ionicons name="people" size={36} color={COLORS.primary} />
              <Text style={styles.statValue}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: COLORS.white, borderColor: COLORS.secondary }]}>
              <Ionicons name="receipt" size={36} color={COLORS.primary} />
              <Text style={styles.statValue}>{stats.totalExpenses}</Text>
              <Text style={styles.statLabel}>Total Expenses</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: COLORS.white, borderColor: COLORS.secondary }]}>
              <Ionicons name="cash" size={36} color={COLORS.primary} />
              <Text style={styles.statValue}>{formatCurrency(stats.totalAmount)}</Text>
              <Text style={styles.statLabel}>Total Amount</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: COLORS.white, borderColor: COLORS.secondary }]}>
              <Ionicons name="calendar" size={36} color={COLORS.primary} />
              <Text style={styles.statValue}>{stats.activeToday}</Text>
              <Text style={styles.statLabel}>Active Today</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: COLORS.white, borderColor: COLORS.secondary }]}>
              <Ionicons name="school" size={36} color={COLORS.primary} />
              <Text style={styles.statValue}>{stats.totalColleges}</Text>
              <Text style={styles.statLabel}>Colleges</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: COLORS.white, borderColor: COLORS.secondary }]}>
              <Ionicons name="book" size={36} color={COLORS.primary} />
              <Text style={styles.statValue}>{stats.totalCourses}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
          </View>

          {/* Recent Login Activity */}
          <Text style={styles.sectionTitle}>Recent Login Activity</Text>
          
          <View style={styles.transactionsContainer}>
            {recentTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyStateText}>No recent login activity</Text>
              </View>
            ) : (
              recentTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionIconContainer}>
                    <Ionicons name="person-circle" size={40} color={COLORS.primary} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionName}>{transaction.userName || 'Unknown User'}</Text>
                    <Text style={styles.transactionDetail}>{transaction.userEmail || 'No email'}</Text>
                    <Text style={styles.transactionTime}>
                      {transaction.timestamp?.toDate ? 
                        new Date(transaction.timestamp.toDate()).toLocaleString() : 
                        'Just now'}
                    </Text>
                  </View>
                  <View style={styles.transactionBadge}>
                    <Text style={styles.transactionBadgeText}>Login</Text>
                  </View>
                </View>
              ))
            )}
          </View>

        <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
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
  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: SIZES.padding,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerLabel: {
    fontSize: SIZES.small,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 4,
    fontWeight: '500',
  },
  headerGreeting: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: SIZES.medium,
    color: COLORS.white,
    opacity: 0.9,
  },
  profileButton: {
    padding: 4,
    marginTop: 8,
  },
  profileButtonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
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
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 8,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
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
  contentContainer: {
    paddingHorizontal: SIZES.padding,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 8,
  },
  transactionsContainer: {
    marginBottom: 24,
  },
  transactionCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIconContainer: {
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  transactionDetail: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  transactionBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  transactionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
  },
});

export default AdminDashboardScreen;
