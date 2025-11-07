// Expense List Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import ExpenseCard from '../../components/ExpenseCard';
import { getExpenses, deleteExpense } from '../../services/firestoreService';
import { formatCurrency, groupExpensesByDate } from '../../utils/helpers';

const ExpenseListScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [groupedExpenses, setGroupedExpenses] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock user ID - Replace with actual auth user ID
  const userId = 'user123';

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await getExpenses(userId);
      setExpenses(data);
      
      // Group expenses by date
      const grouped = groupExpensesByDate(data);
      setGroupedExpenses(grouped);
      
      // Calculate total
      const total = data.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      setTotalAmount(total);
      
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExpenses();
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
              loadExpenses();
              Alert.alert('Success', 'Expense deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          }
        }
      ]
    );
  };

  const renderDateSection = ({ item }) => {
    const [dateKey, dateExpenses] = item;
    const dateTotal = dateExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    return (
      <View style={styles.dateSection}>
        <View style={styles.dateSectionHeader}>
          <Text style={styles.dateText}>{dateKey}</Text>
          <Text style={styles.dateTotalText}>{formatCurrency(dateTotal)}</Text>
        </View>
        {dateExpenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onPress={() => {}}
            onDelete={handleDeleteExpense}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Expenses</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Total Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Expenses</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(totalAmount)}</Text>
        <Text style={styles.summaryCount}>
          {expenses.length} {expenses.length === 1 ? 'transaction' : 'transactions'}
        </Text>
      </View>

      {/* Expenses List */}
      {expenses.length > 0 ? (
        <FlatList
          data={Object.entries(groupedExpenses)}
          renderItem={renderDateSection}
          keyExtractor={(item) => item[0]}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={80} color={COLORS.border} />
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>
            Start adding expenses to see them here
          </Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <Text style={styles.addFirstButtonText}>Add Your First Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Add Button */}
      {expenses.length > 0 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpense')}
          activeOpacity={0.8}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
  },
  summaryCard: {
    backgroundColor: COLORS.primary,
    padding: 24,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: SIZES.medium,
    color: COLORS.white,
    opacity: 0.9,
  },
  summaryAmount: {
    fontSize: SIZES.xxlarge,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 8,
  },
  summaryCount: {
    fontSize: SIZES.small,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 4,
  },
  listContent: {
    padding: SIZES.padding,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateTotalText: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
    textAlign: 'center',
  },
  addFirstButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: SIZES.borderRadius,
    marginTop: 24,
  },
  addFirstButtonText: {
    color: COLORS.white,
    fontSize: SIZES.medium,
    fontWeight: '600',
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
});

export default ExpenseListScreen;
