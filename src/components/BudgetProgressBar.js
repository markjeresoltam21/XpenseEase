// Budget Progress Bar Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { formatCurrency, calculatePercentage } from '../utils/helpers';

const BudgetProgressBar = ({ spent, budget, period = 'week' }) => {
  const remaining = budget - spent;
  const percentage = Math.min(calculatePercentage(spent, budget), 100);
  
  const getProgressColor = () => {
    if (percentage >= 90) return COLORS.danger;
    if (percentage >= 70) return COLORS.warning;
    return COLORS.success;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Budget ({period})</Text>
        <Text style={styles.budgetAmount}>{formatCurrency(budget)}</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${percentage}%`,
              backgroundColor: getProgressColor()
            }
          ]} 
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Spent</Text>
          <Text style={[styles.statValue, { color: getProgressColor() }]}>
            {formatCurrency(spent)}
          </Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={[
            styles.statValue, 
            { color: remaining >= 0 ? COLORS.success : COLORS.danger }
          ]}>
            {formatCurrency(Math.abs(remaining))}
          </Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Progress</Text>
          <Text style={styles.statValue}>{percentage}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.borderRadius,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  budgetAmount: {
    fontSize: SIZES.large,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  statValue: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default BudgetProgressBar;
