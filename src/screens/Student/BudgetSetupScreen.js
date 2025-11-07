// Budget Setup Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import Button from '../../components/Button';
import { setBudget, getBudget } from '../../services/firestoreService';
import { formatCurrency } from '../../utils/helpers';
import { useUser } from '../../context/UserContext';

const BudgetSetupScreen = ({ navigation }) => {
  const { user } = useUser();
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  // Use actual user ID from context
  const userId = user?.uid;

  useEffect(() => {
    if (userId) {
      loadExistingBudget();
    }
  }, [userId]);

  const loadExistingBudget = async () => {
    try {
      console.log('Loading budget for user:', userId);
      const budgetData = await getBudget(userId);
      console.log('Loaded budget data:', budgetData);
      if (budgetData) {
        setHasExisting(true);
        setWeeklyBudget(budgetData.weeklyBudget?.toString() || '');
        setMonthlyBudget(budgetData.monthlyBudget?.toString() || '');
        setSelectedPeriod(budgetData.period || 'week');
      }
    } catch (error) {
      console.error('Error loading budget:', error);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    const weekly = parseFloat(weeklyBudget);
    const monthly = parseFloat(monthlyBudget);

    if (selectedPeriod === 'week' && (!weekly || weekly <= 0)) {
      Alert.alert('Invalid Amount', 'Please enter a valid weekly budget');
      return;
    }

    if (selectedPeriod === 'month' && (!monthly || monthly <= 0)) {
      Alert.alert('Invalid Amount', 'Please enter a valid monthly budget');
      return;
    }

    try {
      setLoading(true);

      const budgetData = {
        weeklyBudget: weekly || 0,
        monthlyBudget: monthly || 0,
        period: selectedPeriod
      };

      console.log('Saving budget for user:', userId, budgetData);
      await setBudget(userId, budgetData);

      Alert.alert(
        'Success',
        `Budget ${hasExisting ? 'updated' : 'set'} successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const suggestedWeeklyBudgets = [500, 1000, 1500, 2000];
  const suggestedMonthlyBudgets = [2000, 4000, 6000, 8000];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Set your budget to track your spending and maintain financial discipline
          </Text>
        </View>

        {/* Period Selector */}
        <Text style={styles.label}>Budget Period</Text>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={selectedPeriod === 'week' ? COLORS.white : COLORS.text} 
            />
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'week' && styles.periodButtonTextActive
            ]}>
              Weekly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Ionicons 
              name="calendar" 
              size={20} 
              color={selectedPeriod === 'month' ? COLORS.white : COLORS.text} 
            />
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'month' && styles.periodButtonTextActive
            ]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Budget */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Weekly Budget</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput
              style={styles.amountInput}
              value={weeklyBudget}
              onChangeText={setWeeklyBudget}
              placeholder="0.00"
              placeholderTextColor={COLORS.border}
              keyboardType="decimal-pad"
            />
          </View>
          
          <Text style={styles.suggestionLabel}>Quick Select:</Text>
          <View style={styles.suggestionsContainer}>
            {suggestedWeeklyBudgets.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.suggestionButton}
                onPress={() => setWeeklyBudget(amount.toString())}
              >
                <Text style={styles.suggestionText}>₱{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Monthly Budget */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Monthly Budget</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput
              style={styles.amountInput}
              value={monthlyBudget}
              onChangeText={setMonthlyBudget}
              placeholder="0.00"
              placeholderTextColor={COLORS.border}
              keyboardType="decimal-pad"
            />
          </View>
          
          <Text style={styles.suggestionLabel}>Quick Select:</Text>
          <View style={styles.suggestionsContainer}>
            {suggestedMonthlyBudgets.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.suggestionButton}
                onPress={() => setMonthlyBudget(amount.toString())}
              >
                <Text style={styles.suggestionText}>₱{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget Summary */}
        {(weeklyBudget || monthlyBudget) && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Budget Summary</Text>
            {weeklyBudget && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Weekly Allowance:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(weeklyBudget)}</Text>
              </View>
            )}
            {monthlyBudget && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Monthly Allowance:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(monthlyBudget)}</Text>
              </View>
            )}
            {weeklyBudget && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Daily Average:</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(parseFloat(weeklyBudget) / 7)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Save Button */}
        <Button
          title={loading ? 'Saving...' : hasExisting ? 'Update Budget' : 'Set Budget'}
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
    padding: SIZES.padding,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10',
    padding: 16,
    borderRadius: SIZES.borderRadius,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: SIZES.medium,
    color: COLORS.text,
    lineHeight: 22,
  },
  label: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: SIZES.borderRadius,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 32,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    padding: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: SIZES.xlarge,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: SIZES.xlarge,
    fontWeight: '700',
    color: COLORS.primary,
  },
  suggestionLabel: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: SIZES.borderRadius,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.primary,
  },
  saveButton: {
    marginTop: 8,
  },
});

export default BudgetSetupScreen;
