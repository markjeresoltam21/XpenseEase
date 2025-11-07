// Manage Expenses Screen - Admin can create expense categories and track payments
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
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../../config/firebase.config';
import { useUser } from '../../context/UserContext';
import { formatCurrency } from '../../utils/helpers';

const ManageExpensesScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useUser();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: new Date(),
    category: 'Tuition'
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const categories = ['Tuition', 'Lab Fee', 'Library Fee', 'Registration', 'Miscellaneous', 'Other'];

  // Generate calendar days for date picker
  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const handleDateSelect = (date) => {
    if (date) {
      setTempDate(date);
    }
  };

  const confirmDateSelection = () => {
    setFormData({ ...formData, dueDate: tempDate });
    setShowDatePicker(false);
  };

  const changeMonth = (increment) => {
    const newDate = new Date(tempDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setTempDate(newDate);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applySearch();
  }, [expenses, searchQuery]);

  const applySearch = () => {
    let filtered = [...expenses];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        (e.title && e.title.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query)) ||
        (e.category && e.category.toLowerCase().includes(query))
      );
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });

    setFilteredExpenses(filtered);
  };

  const loadData = async () => {
    try {
      await Promise.all([
        loadExpenses(),
        loadStudents(),
        loadPayments()
      ]);
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

  const loadStudents = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      const studentsList = [];
      querySnapshot.forEach((doc) => {
        studentsList.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsList);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'expensePayments'));
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

  const handleAddExpense = async () => {
    if (!formData.title.trim() || !formData.amount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'expenses'), {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.dueDate.toISOString(),
        category: formData.category,
        createdAt: Timestamp.now(),
        userId: user.uid
      });

      Alert.alert('Success', 'Expense added successfully');
      setShowAddModal(false);
      resetForm();
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleUpdateExpense = async () => {
    if (!formData.title.trim() || !formData.amount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await updateDoc(doc(db, 'expenses', selectedExpense.id), {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.dueDate.toISOString(),
        category: formData.category,
        updatedAt: Timestamp.now()
      });

      Alert.alert('Success', 'Expense updated successfully');
      setShowEditModal(false);
      setSelectedExpense(null);
      resetForm();
      loadExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      Alert.alert('Error', 'Failed to update expense');
    }
  };

  const handleDeleteExpense = (expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'expenses', expense.id));
              Alert.alert('Success', 'Expense deleted successfully');
              loadExpenses();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (expense) => {
    setSelectedExpense(expense);
    const expenseDate = expense.date ? new Date(expense.date) : new Date();
    setFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      dueDate: expenseDate,
      category: expense.category || 'Tuition'
    });
    setShowEditModal(true);
  };

  const openPaymentModal = (expense) => {
    setSelectedExpense(expense);
    setShowPaymentModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      dueDate: new Date(),
      category: 'Tuition'
    });
  };

  const getPaymentStats = (expenseId) => {
    const expensePayments = payments.filter(p => p.expenseId === expenseId);
    const totalStudents = students.length;
    const paidCount = expensePayments.length;
    const unpaidCount = totalStudents - paidCount;
    const totalCollected = expensePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return { paidCount, unpaidCount, totalCollected, totalStudents };
  };

  const getPaidStudents = (expenseId) => {
    const expensePayments = payments.filter(p => p.expenseId === expenseId);
    return expensePayments.map(p => {
      const student = students.find(s => s.uid === p.studentId);
      return {
        ...p,
        studentName: student?.name || 'Unknown',
        studentId: student?.studentId || 'N/A'
      };
    });
  };

  const getUnpaidStudents = (expenseId) => {
    const paidStudentIds = payments
      .filter(p => p.expenseId === expenseId)
      .map(p => p.studentId);
    
    return students.filter(s => !paidStudentIds.includes(s.uid));
  };

  const renderExpenseCard = ({ item }) => {
    const stats = getPaymentStats(item.id);
    const paymentPercentage = stats.totalStudents > 0 
      ? (stats.paidCount / stats.totalStudents * 100).toFixed(0) 
      : 0;

    return (
      <TouchableOpacity 
        style={styles.expenseCard}
        onPress={() => openPaymentModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardCategory}>{item.category}</Text>
            {item.description ? (
              <Text style={styles.cardDescription}>{item.description}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardAmount}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statText}>{stats.paidCount} Paid</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.statText}>{stats.unpaidCount} Unpaid</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people" size={20} color={COLORS.primary} />
            <Text style={styles.statText}>{stats.totalStudents} Total</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${paymentPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>{paymentPercentage}% Paid</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="pencil" size={18} color={COLORS.primary} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteExpense(item)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={[styles.actionText, { color: COLORS.danger }]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => openPaymentModal(item)}
          >
            <Ionicons name="eye" size={18} color={COLORS.white} />
            <Text style={[styles.actionText, { color: COLORS.white }]}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Manage Expenses</Text>
              <Text style={styles.headerSubtitle}>{filteredExpenses.length} Expense{filteredExpenses.length !== 1 ? 's' : ''}</Text>
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
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>

      {/* Expenses List */}
      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add one</Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          resetForm();
          setShowAddModal(true);
        }}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Title <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="text-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="e.g., Tuition Fee"
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Category <Text style={styles.required}>*</Text>
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryScrollContent}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        formData.category === cat && styles.categoryChipActive
                      ]}
                      onPress={() => setFormData({ ...formData, category: cat })}
                    >
                      <Ionicons 
                        name={
                          cat === 'Tuition' ? 'school-outline' :
                          cat === 'Lab Fee' ? 'flask-outline' :
                          cat === 'Library Fee' ? 'library-outline' :
                          cat === 'Registration' ? 'document-text-outline' :
                          'cash-outline'
                        } 
                        size={18} 
                        color={formData.category === cat ? COLORS.white : COLORS.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[
                        styles.categoryChipText,
                        formData.category === cat && styles.categoryChipTextActive
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Amount <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="cash-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <Text style={styles.currencySymbol}>₱</Text>
                  <TextInput
                    style={[styles.inputWithIcon, { paddingLeft: 35 }]}
                    placeholder="0.00"
                    value={formData.amount}
                    onChangeText={(text) => setFormData({ ...formData, amount: text })}
                    keyboardType="decimal-pad"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => {
                    setTempDate(formData.dueDate);
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <Text style={styles.datePickerText}>
                    {formData.dueDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.textLight} style={[styles.inputIcon, styles.textAreaIcon]} />
                  <TextInput
                    style={[styles.inputWithIcon, styles.textArea]}
                    placeholder="Optional description"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={COLORS.textLight}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddExpense}
              >
                <Ionicons name="add-circle-outline" size={22} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Expense</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Title <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="text-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="e.g., Tuition Fee"
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Category <Text style={styles.required}>*</Text>
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryScrollContent}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        formData.category === cat && styles.categoryChipActive
                      ]}
                      onPress={() => setFormData({ ...formData, category: cat })}
                    >
                      <Ionicons 
                        name={
                          cat === 'Tuition' ? 'school-outline' :
                          cat === 'Lab Fee' ? 'flask-outline' :
                          cat === 'Library Fee' ? 'library-outline' :
                          cat === 'Registration' ? 'document-text-outline' :
                          'cash-outline'
                        } 
                        size={18} 
                        color={formData.category === cat ? COLORS.white : COLORS.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[
                        styles.categoryChipText,
                        formData.category === cat && styles.categoryChipTextActive
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Amount <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="cash-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <Text style={styles.currencySymbol}>₱</Text>
                  <TextInput
                    style={[styles.inputWithIcon, { paddingLeft: 35 }]}
                    placeholder="0.00"
                    value={formData.amount}
                    onChangeText={(text) => setFormData({ ...formData, amount: text })}
                    keyboardType="decimal-pad"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => {
                    setTempDate(formData.dueDate);
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <Text style={styles.datePickerText}>
                    {formData.dueDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.textLight} style={[styles.inputIcon, styles.textAreaIcon]} />
                  <TextInput
                    style={[styles.inputWithIcon, styles.textArea]}
                    placeholder="Optional description"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={COLORS.textLight}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    setShowEditModal(false);
                    handleDeleteExpense(selectedExpense);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.white} />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={handleUpdateExpense}
                >
                  <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.white} style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
              <Text style={styles.modalTitle}>Payment Details</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedExpense && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseInfoTitle}>{selectedExpense.title}</Text>
                  <Text style={styles.expenseInfoAmount}>{formatCurrency(selectedExpense.amount)}</Text>
                </View>

                {/* Paid Students */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" /> Paid Students ({getPaidStudents(selectedExpense.id).length})
                  </Text>
                  {getPaidStudents(selectedExpense.id).map((payment, index) => (
                    <View key={index} style={styles.studentItem}>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{payment.studentName}</Text>
                        <Text style={styles.studentId}>ID: {payment.studentId}</Text>
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                        <Text style={styles.paymentDate}>
                          {payment.paidAt?.toDate ? payment.paidAt.toDate().toLocaleDateString() : 'N/A'}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {getPaidStudents(selectedExpense.id).length === 0 && (
                    <Text style={styles.emptyText}>No payments yet</Text>
                  )}
                </View>

                {/* Unpaid Students */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" /> Unpaid Students ({getUnpaidStudents(selectedExpense.id).length})
                  </Text>
                  {getUnpaidStudents(selectedExpense.id).map((student, index) => (
                    <View key={index} style={styles.studentItem}>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentId}>ID: {student.studentId}</Text>
                      </View>
                      <View style={styles.unpaidBadge}>
                        <Text style={styles.unpaidText}>Unpaid</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>{formatMonthYear(tempDate)}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={index} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {getMonthDays(tempDate).map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    day && isSameDay(day, tempDate) && styles.selectedDayCell
                  ]}
                  onPress={() => day && handleDateSelect(day)}
                  disabled={!day}
                >
                  {day && (
                    <Text style={[
                      styles.dayText,
                      isSameDay(day, tempDate) && styles.selectedDayText
                    ]}>
                      {day.getDate()}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={styles.datePickerCancel}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerConfirm}
                onPress={confirmDateSelection}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: COLORS.text,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  expenseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.secondary,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'right',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
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
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
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
    maxHeight: '90%',
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: COLORS.text,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
    marginRight: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    height: 48,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  textAreaIcon: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryScrollContent: {
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    elevation: 3,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  updateButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  expenseInfo: {
    backgroundColor: `${COLORS.primary}10`,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  expenseInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  expenseInfoAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  studentId: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  paymentInfo: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  unpaidBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unpaidText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModal: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  selectedDayCell: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 15,
    color: COLORS.text,
  },
  selectedDayText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  datePickerCancel: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  datePickerConfirm: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default ManageExpensesScreen;
