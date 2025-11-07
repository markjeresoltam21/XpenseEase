// Home/Dashboard Screen
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Modal,
  Pressable
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import ExpenseCard from '../../components/ExpenseCard';
import { 
  getExpenses, 
  getBudget, 
  getTotalSpending,
  deleteExpense 
} from '../../services/firestoreService';
import { formatCurrency, getStartOfWeek, getEndOfWeek } from '../../utils/helpers';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../../config/firebase.config';
import { useUser } from '../../context/UserContext';
import { logoutUser } from '../../services/authService';
import { pickProfileImage, convertImageToBase64, updateProfilePicture } from '../../services/profileService';


const HomeScreen = ({ navigation: navProp }) => {
  const navigation = navProp || useNavigation();
  const [expenses, setExpenses] = useState([]);
  const [schoolExpenses, setSchoolExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [budget, setBudget] = useState(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [weeklySpent, setWeeklySpent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, setUser } = useUser();
  
  // Use actual user ID from context - don't use fallback
  const userId = user?.uid;

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        console.log('User loaded:', { uid: user?.uid, name: user?.name, hasPhoto: !!user?.photoURL });
        loadData();
      }
    }, [userId])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load payment records first and get the returned list
      const paymentsList = await loadMyPayments();
      
      // Load budget
      const budgetData = await getBudget(userId);
      console.log('=== BUDGET DEBUG ===');
      console.log('User ID:', userId);
      console.log('Budget Data:', JSON.stringify(budgetData, null, 2));
      console.log('Weekly Budget value:', budgetData?.weeklyBudget);
      console.log('Type of weeklyBudget:', typeof budgetData?.weeklyBudget);
      setBudget(budgetData);
      
      // Load personal expenses
      const expensesData = await getExpenses(userId);
      
      // Get paid school expenses and combine with personal expenses
      const paidSchoolExpenses = paymentsList.map(payment => ({
        id: payment.id,
        title: payment.expenseTitle || 'School Payment',
        amount: payment.amount || 0,
        date: payment.paidAt,
        category: 'School Payment',
        isSchoolPayment: true
      }));
      
      // Combine and sort by date
      const allExpenses = [...expensesData, ...paidSchoolExpenses].sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });
      
      setExpenses(allExpenses.slice(0, 5)); // Show only recent 5
      
      // Load school expenses after payments are loaded
      await loadSchoolExpenses();
      
      // Calculate total spent (personal + paid school expenses)
      const personalTotal = await getTotalSpending(userId);
      const schoolPaymentsTotal = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);
      setTotalSpent(personalTotal + schoolPaymentsTotal);
      
      // Calculate weekly spent
      const startOfWeek = Timestamp.fromDate(getStartOfWeek());
      const endOfWeek = Timestamp.fromDate(getEndOfWeek());
      const weeklyPersonal = await getTotalSpending(userId, startOfWeek, endOfWeek);
      
      // Add school payments from this week
      const weeklySchoolPayments = paymentsList.filter(p => {
        const paymentDate = p.paidAt?.toDate ? p.paidAt.toDate() : new Date(p.paidAt);
        return paymentDate >= getStartOfWeek() && paymentDate <= getEndOfWeek();
      }).reduce((sum, p) => sum + (p.amount || 0), 0);
      
      setWeeklySpent(weeklyPersonal + weeklySchoolPayments);
      
      console.log('Final state:', {
        budget: budgetData,
        budgetWeekly: budgetData?.weeklyBudget,
        weeklySpent: weeklyPersonal + weeklySchoolPayments,
        totalSpent: personalTotal + schoolPaymentsTotal,
        userId: userId
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSchoolExpenses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'expenses'));
      const expensesList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('School expense loaded:', { id: doc.id, title: data.title, amount: data.amount });
        expensesList.push({ id: doc.id, ...data });
      });
      // Show only first 3 unpaid expenses
      const unpaid = expensesList.filter(exp => !isExpensePaid(exp.id));
      console.log('Unpaid school expenses:', unpaid.map(e => ({ id: e.id, title: e.title })));
      setSchoolExpenses(unpaid.slice(0, 3));
    } catch (error) {
      console.error('Error loading school expenses:', error);
    }
  };

  const loadMyPayments = async () => {
    try {
      const q = query(
        collection(db, 'expensePayments'),
        where('studentId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const paymentsList = [];
      querySnapshot.forEach((doc) => {
        paymentsList.push({ id: doc.id, ...doc.data() });
      });
      setPayments(paymentsList);
      return paymentsList; // Return the list for immediate use
    } catch (error) {
      console.error('Error loading payments:', error);
      return [];
    }
  };

  const isExpensePaid = (expenseId) => {
    return payments.some(p => p.expenseId === expenseId);
  };

  const handlePayExpense = async (expense) => {
    console.log('Payment initiated for expense:', { id: expense.id, title: expense.title, amount: expense.amount });
    
    Alert.alert(
      'Confirm Payment',
      `Have you paid ${formatCurrency(expense.amount || 0)} for ${expense.title || 'this expense'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: async () => {
            try {
              // Validate required fields
              if (!expense.id || !user.uid) {
                Alert.alert('Error', 'Missing required information');
                return;
              }

              if (!expense.title) {
                console.error('Expense missing title:', expense);
                Alert.alert('Error', 'Expense data is incomplete. Please refresh and try again.');
                return;
              }

              console.log('Creating payment record:', {
                expenseId: expense.id,
                expenseTitle: expense.title,
                studentId: user.uid,
                amount: expense.amount
              });

              await addDoc(collection(db, 'expensePayments'), {
                expenseId: expense.id,
                expenseTitle: expense.title,
                studentId: user.uid,
                studentName: user.name || 'Unknown Student',
                studentEmail: user.email || '',
                amount: expense.amount || 0,
                paidAt: Timestamp.now()
              });
              
              Alert.alert('Success', 'Payment recorded successfully!');
              loadData();
            } catch (error) {
              console.error('Error recording payment:', error);
              Alert.alert('Error', 'Failed to record payment');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeleteExpense = async (expenseId) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expenseId);
              loadData();
              Alert.alert('Success', 'Expense deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          }
        }
      ]
    );
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
        // Update user context with new photo
        setUser({
          ...user,
          photoURL: base64Image
        });
        Alert.alert('Success', 'Profile picture updated successfully!');
        onRefresh();
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Profile picture update error:', error);
      Alert.alert('Error', 'An error occurred while updating profile picture');
    }
  };

  return (
    <View style={styles.container}>
      {/* Profile Menu Modal */}
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
                <Text style={styles.profileName}>{user?.name || 'Student'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'student@email.com'}</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleChangeProfilePicture}
            >
              <Ionicons name="camera-outline" size={20} color={COLORS.text} />
              <Text style={styles.menuItemText}>Change Photo</Text>
            </TouchableOpacity>

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
        {/* Green Header */}
        <View style={styles.greenHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>Welcome, {user?.name?.split(' ')[0] || 'Student'}</Text>
              <Text style={styles.subtitle}>XpenseEase Student Panel</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => setShowProfileMenu(true)}
            >
              {user?.photoURL ? (
                <Image 
                  key={user.photoURL}
                  source={{ uri: user.photoURL }} 
                  style={styles.profileImageLarge}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profilePlaceholderLarge}>
                  <Text style={styles.profileInitial}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid - 2x2 */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={styles.statIconCircle}>
              <Ionicons name="calendar-outline" size={28} color={COLORS.white} />
            </View>
            <Text style={styles.statNumber}>
              {budget && typeof budget.weeklyBudget === 'number'
                ? formatCurrency(Math.max(0, budget.weeklyBudget - weeklySpent)) 
                : formatCurrency(0)}
            </Text>
            <Text style={styles.statLabel}>
              {budget && typeof budget.weeklyBudget === 'number' ? 'Budget' : 'No Budget Set'}
            </Text>
          </View>
          
          <View style={styles.statBox}>
            <View style={styles.statIconCircle}>
              <Ionicons name="trending-up-outline" size={28} color={COLORS.white} />
            </View>
            <Text style={styles.statNumber}>{formatCurrency(totalSpent)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {schoolExpenses.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pending Payments</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MyExpenses')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              {schoolExpenses.map((expense) => (
                <View key={expense.id} style={styles.schoolExpenseCard}>
                  <View style={styles.expenseIconContainer}>
                    <Ionicons 
                      name={
                        expense.category === 'Tuition' ? 'school' :
                        expense.category === 'Lab Fee' ? 'flask' :
                        expense.category === 'Library Fee' ? 'library' :
                        expense.category === 'Registration' ? 'document-text' :
                        'cash'
                      } 
                      size={24} 
                      color={COLORS.primary} 
                    />
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <Text style={styles.expenseCategory}>{expense.category}</Text>
                    {expense.description && (
                      <Text style={styles.expenseDescription}>{expense.description}</Text>
                    )}
                    <Text style={styles.expenseDueDate}>
                      Due: {expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.expenseActions}>
                    <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() => handlePayExpense(expense)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                      <Text style={styles.payButtonText}>Pay</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Recent Expenses */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ExpenseList')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onPress={() => {}}
                onDelete={handleDeleteExpense}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={COLORS.border} />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>
                Start tracking by adding your first expense
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Expense Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>

      {/* Set Budget Button (only show if no budget) */}
      {(!budget || typeof budget.weeklyBudget !== 'number') && (
        <TouchableOpacity
          style={styles.budgetButton}
          onPress={() => navigation.navigate('BudgetSetup')}
          activeOpacity={0.8}
        >
          <Ionicons name="wallet" size={24} color={COLORS.white} />
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SIZES.padding,
  },
  greenHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 40,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  dashboardLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
  },
  profileButton: {
    overflow: 'hidden',
  },
  profileImageLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  profilePlaceholderLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.padding,
    paddingTop: 24,
    gap: 12,
  },
  statBox: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  settingsButton: {
    padding: 8,
  },
  setBudgetCard: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setBudgetText: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  setBudgetSubtext: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: SIZES.large,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  budgetButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  schoolExpenseCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  expenseDueDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  expenseActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
