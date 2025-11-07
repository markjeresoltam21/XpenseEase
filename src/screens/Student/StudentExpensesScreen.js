// Student Expenses Screen - View required expenses and mark as paid
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
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
import { formatCurrency } from '../../utils/helpers';

const StudentExpensesScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'paid', 'unpaid'
  const { user } = useUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([loadExpenses(), loadMyPayments()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'expenses'));
      const expensesList = [];
      querySnapshot.forEach((doc) => {
        expensesList.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(expensesList);
    } catch (error) {
      console.error('Error loading expenses:', error);
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
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const isExpensePaid = (expenseId) => {
    return payments.some(p => p.expenseId === expenseId);
  };

  const getPaymentDetails = (expenseId) => {
    return payments.find(p => p.expenseId === expenseId);
  };

  const handleMarkAsPaid = async (expense) => {
    Alert.alert(
      'Confirm Payment',
      `Have you paid ${formatCurrency(expense.amount)} for ${expense.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Mark as Paid',
          onPress: async () => {
            try {
              await addDoc(collection(db, 'expensePayments'), {
                expenseId: expense.id,
                studentId: user.uid,
                studentName: user.name,
                studentEmail: user.email,
                amount: expense.amount,
                paidAt: Timestamp.now(),
                expenseTitle: expense.title
              });

              Alert.alert('Success', 'Payment recorded successfully!');
              loadMyPayments();
              setShowPaymentModal(false);
            } catch (error) {
              console.error('Error recording payment:', error);
              Alert.alert('Error', 'Failed to record payment');
            }
          }
        }
      ]
    );
  };

  const openPaymentModal = (expense) => {
    setSelectedExpense(expense);
    setShowPaymentModal(true);
  };

  const getFilteredExpenses = () => {
    if (filterStatus === 'paid') {
      return expenses.filter(e => isExpensePaid(e.id));
    } else if (filterStatus === 'unpaid') {
      return expenses.filter(e => !isExpensePaid(e.id));
    }
    return expenses;
  };

  const getTotalStats = () => {
    const totalExpenses = expenses.length;
    const paidExpenses = expenses.filter(e => isExpensePaid(e.id)).length;
    const unpaidExpenses = totalExpenses - paidExpenses;
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const paidAmount = expenses
      .filter(e => isExpensePaid(e.id))
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const unpaidAmount = totalAmount - paidAmount;

    return {
      totalExpenses,
      paidExpenses,
      unpaidExpenses,
      totalAmount,
      paidAmount,
      unpaidAmount
    };
  };

  const renderExpenseCard = ({ item }) => {
    const isPaid = isExpensePaid(item.id);
    const paymentDetails = isPaid ? getPaymentDetails(item.id) : null;

    return (
      <TouchableOpacity 
        style={[styles.expenseCard, isPaid && styles.expenseCardPaid]}
        onPress={() => openPaymentModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconContainer, isPaid && styles.cardIconPaid]}>
            <Ionicons 
              name={isPaid ? "checkmark-circle" : "receipt-outline"} 
              size={24} 
              color={isPaid ? "#10B981" : COLORS.primary} 
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardCategory}>{item.category}</Text>
            {item.description ? (
              <Text style={styles.cardDescription}>{item.description}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.unpaidBadge]}>
            <Text style={[styles.statusText, isPaid ? styles.paidText : styles.unpaidText]}>
              {isPaid ? 'Paid' : 'Unpaid'}
            </Text>
          </View>
        </View>

        <View style={styles.cardAmount}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={[styles.amountValue, isPaid && styles.amountValuePaid]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>

        {item.dueDate && (
          <View style={styles.dueDateContainer}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.dueDateText}>Due: {item.dueDate}</Text>
          </View>
        )}

        {isPaid && paymentDetails && (
          <View style={styles.paymentInfo}>
            <Ionicons name="time-outline" size={16} color="#10B981" />
            <Text style={styles.paymentDate}>
              Paid on {paymentDetails.paidAt?.toDate().toLocaleDateString()}
            </Text>
          </View>
        )}

        {!isPaid && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => handleMarkAsPaid(item)}
          >
            <Ionicons name="card" size={18} color={COLORS.white} />
            <Text style={styles.payButtonText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const stats = getTotalStats();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>My Expenses</Text>
              <Text style={styles.headerSubtitle}>Track your payments</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              {user?.photoURL ? (
                <Image 
                  source={{ uri: user.photoURL }} 
                  style={[styles.profileButtonAvatar, { backgroundColor: 'transparent' }]} 
                />
              ) : (
                <View style={styles.profileButtonAvatar}>
                  <Text style={styles.profileInitial}>
                    {user?.name?.charAt(0).toUpperCase() || 'S'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.curvedBottom} />
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Due</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats.totalAmount)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Paid</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            {formatCurrency(stats.paidAmount)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
            {formatCurrency(stats.unpaidAmount)}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'all' && styles.filterTabActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterTabText, filterStatus === 'all' && styles.filterTabTextActive]}>
            All ({stats.totalExpenses})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'unpaid' && styles.filterTabActive]}
          onPress={() => setFilterStatus('unpaid')}
        >
          <Text style={[styles.filterTabText, filterStatus === 'unpaid' && styles.filterTabTextActive]}>
            Unpaid ({stats.unpaidExpenses})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'paid' && styles.filterTabActive]}
          onPress={() => setFilterStatus('paid')}
        >
          <Text style={[styles.filterTabText, filterStatus === 'paid' && styles.filterTabTextActive]}>
            Paid ({stats.paidExpenses})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expenses List */}
      <FlatList
        data={getFilteredExpenses()}
        renderItem={renderExpenseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>
              {filterStatus === 'all' ? 'No expenses yet' :
               filterStatus === 'paid' ? 'No paid expenses' :
               'No unpaid expenses'}
            </Text>
          </View>
        }
      />

      {/* Payment Details Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Expense Details</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedExpense && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Title</Text>
                  <Text style={styles.detailValue}>{selectedExpense.title}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{selectedExpense.category}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={[styles.detailValue, styles.detailAmount]}>
                    {formatCurrency(selectedExpense.amount)}
                  </Text>
                </View>

                {selectedExpense.description && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{selectedExpense.description}</Text>
                  </View>
                )}

                {selectedExpense.dueDate && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Due Date</Text>
                    <Text style={styles.detailValue}>{selectedExpense.dueDate}</Text>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[
                    styles.statusBadge, 
                    isExpensePaid(selectedExpense.id) ? styles.paidBadge : styles.unpaidBadge
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      isExpensePaid(selectedExpense.id) ? styles.paidText : styles.unpaidText
                    ]}>
                      {isExpensePaid(selectedExpense.id) ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                </View>

                {isExpensePaid(selectedExpense.id) && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Payment Date</Text>
                    <Text style={styles.detailValue}>
                      {getPaymentDetails(selectedExpense.id)?.paidAt?.toDate().toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {!isExpensePaid(selectedExpense.id) && (
                  <TouchableOpacity
                    style={styles.modalPayButton}
                    onPress={() => handleMarkAsPaid(selectedExpense)}
                  >
                    <Ionicons name="card" size={20} color={COLORS.white} />
                    <Text style={styles.modalPayButtonText}>Mark as Paid</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
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
    paddingTop: 50,
    paddingBottom: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  profileButtonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  curvedBottom: {
    height: 30,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: 20,
  },
  expenseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  expenseCardPaid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIconPaid: {
    backgroundColor: '#D1FAE5',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    height: 28,
  },
  paidBadge: {
    backgroundColor: '#D1FAE5',
  },
  unpaidBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paidText: {
    color: '#10B981',
  },
  unpaidText: {
    color: '#EF4444',
  },
  cardAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  amountValuePaid: {
    color: '#10B981',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dueDateText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  paymentDate: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  detailItem: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  detailAmount: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  modalPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  modalPayButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StudentExpensesScreen;
