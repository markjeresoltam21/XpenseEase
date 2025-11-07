// Expense Card Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { getCategoryById } from '../constants/categories';
import { formatCurrency, formatDateRelative } from '../utils/helpers';

const ExpenseCard = ({ expense, onPress, onDelete }) => {
  // Handle school payments differently
  const isSchoolPayment = expense.isSchoolPayment || expense.category === 'School Payment';
  
  const category = isSchoolPayment 
    ? { name: 'School Payment', icon: 'school', color: COLORS.primary }
    : getCategoryById(expense.category);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
          <Ionicons name={category.icon} size={24} color={category.color} />
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.categoryText}>
            {isSchoolPayment ? expense.title || 'School Payment' : category.name}
          </Text>
          {expense.description && !isSchoolPayment && (
            <Text style={styles.descriptionText} numberOfLines={1}>
              {expense.description}
            </Text>
          )}
          {isSchoolPayment && (
            <Text style={styles.descriptionText}>School Payment - Paid</Text>
          )}
          <Text style={styles.dateText}>{formatDateRelative(expense.date)}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.amountText}>{formatCurrency(expense.amount)}</Text>
        {onDelete && !isSchoolPayment && (
          <TouchableOpacity 
            onPress={() => onDelete(expense.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.borderRadius,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  categoryText: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  dateText: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: SIZES.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  deleteButton: {
    padding: 4,
  },
});

export default ExpenseCard;
