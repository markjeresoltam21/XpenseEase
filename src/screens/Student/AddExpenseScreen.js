// Add Expense Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import CategoryPicker from '../../components/CategoryPicker';
import Button from '../../components/Button';
import { addExpense } from '../../services/firestoreService';
import { Timestamp } from 'firebase/firestore';

const AddExpenseScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Mock user ID - Replace with actual auth user ID
  const userId = 'user123';

  const handleSubmit = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!category) {
      Alert.alert('Select Category', 'Please select a category');
      return;
    }

    try {
      setLoading(true);

      const expenseData = {
        amount: parseFloat(amount),
        category,
        description: description.trim(),
        date: Timestamp.fromDate(date)
      };

      await addExpense(userId, expenseData);

      Alert.alert(
        'Success',
        'Expense added successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setAmount('');
              setCategory('food');
              setDescription('');
              setDate(new Date());
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Input */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>₱</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={COLORS.border}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* Category Picker */}
        <CategoryPicker
          selectedCategory={category}
          onSelectCategory={setCategory}
        />

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Lunch at cafeteria"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Date Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.dateButton}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.dateText}>
              {date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Date picker will be available in future updates. Currently using today's date.
          </Text>
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quick Amount</Text>
          <View style={styles.quickAmounts}>
            {[50, 100, 200, 500].map((value) => (
              <TouchableOpacity
                key={value}
                style={styles.quickAmountButton}
                onPress={() => setAmount(value.toString())}
              >
                <Text style={styles.quickAmountText}>₱{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <Button
          title={loading ? 'Adding...' : 'Add Expense'}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
    minWidth: 150,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    fontSize: SIZES.medium,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
  },
  dateText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginLeft: 12,
    flex: 1,
  },
  hint: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
  },
});

export default AddExpenseScreen;
