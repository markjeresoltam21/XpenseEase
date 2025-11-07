// Reports/Analytics Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { COLORS, SIZES } from '../../constants/theme';
import { getCategoryById } from '../../constants/categories';
import {
  getExpensesByCategory,
  getTotalSpending,
  getExpensesByDateRange
} from '../../services/firestoreService';
import { 
  formatCurrency, 
  getStartOfWeek, 
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth
} from '../../utils/helpers';
import { Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase.config';
import { useUser } from '../../context/UserContext';

const screenWidth = Dimensions.get('window').width;

const ReportsScreen = ({ navigation }) => {
  const [period, setPeriod] = useState('week'); // 'week' or 'month'
  const [categoryData, setCategoryData] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useUser();
  
  // Use actual user ID from context
  const userId = user?.uid;

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [period, userId]);

  const loadData = async () => {
    try {
      let startDate, endDate;
      
      if (period === 'week') {
        startDate = Timestamp.fromDate(getStartOfWeek());
        endDate = Timestamp.fromDate(getEndOfWeek());
      } else {
        startDate = Timestamp.fromDate(getStartOfMonth());
        endDate = Timestamp.fromDate(getEndOfMonth());
      }

      // Get personal expenses by category
      const categoryTotals = await getExpensesByCategory(userId, startDate, endDate);
      const personalTotal = await getTotalSpending(userId, startDate, endDate);
      
      // Get paid school expenses
      const paymentsQuery = query(
        collection(db, 'expensePayments'),
        where('studentId', '==', userId)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const payments = [];
      paymentsSnapshot.forEach((doc) => {
        payments.push({ id: doc.id, ...doc.data() });
      });

      // Filter payments by date period and calculate total
      const filteredPayments = payments.filter(p => {
        const paymentDate = p.paidAt?.toDate ? p.paidAt.toDate() : new Date(p.paidAt);
        const start = startDate.toDate();
        const end = endDate.toDate();
        return paymentDate >= start && paymentDate <= end;
      });

      const schoolPaymentsTotal = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Add School Payment category
      if (schoolPaymentsTotal > 0) {
        categoryTotals['School Payment'] = schoolPaymentsTotal;
      }

      // Total spent = personal + school payments
      setTotalSpent(personalTotal + schoolPaymentsTotal);
      
      // Transform data for charts
      const chartData = Object.entries(categoryTotals).map(([categoryId, amount]) => {
        // Handle School Payment specially
        if (categoryId === 'School Payment') {
          return {
            name: 'School Payment',
            amount: amount,
            color: COLORS.primary,
            legendFontColor: COLORS.text,
            legendFontSize: 12
          };
        }
        
        const category = getCategoryById(categoryId);
        return {
          name: category.name,
          amount: amount,
          color: category.color,
          legendFontColor: COLORS.text,
          legendFontSize: 12
        };
      }).sort((a, b) => b.amount - a.amount);
      
      setCategoryData(chartData);
      
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const pieChartData = categoryData.map((item) => ({
    name: item.name,
    population: item.amount,
    color: item.color,
    legendFontColor: item.legendFontColor,
    legendFontSize: item.legendFontSize
  }));

  const barChartData = {
    labels: categoryData.slice(0, 5).map(item => item.name.substring(0, 8)),
    datasets: [{
      data: categoryData.slice(0, 5).map(item => item.amount)
    }]
  };

  const chartConfig = {
    backgroundColor: COLORS.white,
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    style: {
      borderRadius: SIZES.borderRadius
    },
    propsForLabels: {
      fontSize: 10
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
            onPress={() => setPeriod('week')}
          >
            <Text style={[
              styles.periodButtonText,
              period === 'week' && styles.periodButtonTextActive
            ]}>
              This Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[
              styles.periodButtonText,
              period === 'month' && styles.periodButtonTextActive
            ]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Spending Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Spending</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalSpent)}</Text>
          <Text style={styles.totalPeriod}>
            {period === 'week' ? 'This Week' : 'This Month'}
          </Text>
        </View>

        {categoryData.length > 0 ? (
          <>
            {/* Pie Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Spending by Category</Text>
              <PieChart
                data={pieChartData}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>

            {/* Bar Chart */}
            {categoryData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Top Categories</Text>
                <BarChart
                  data={barChartData}
                  width={screenWidth - 32}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.barChart}
                  yAxisLabel="₱"
                  yAxisSuffix=""
                  fromZero
                  showValuesOnTopOfBars
                />
              </View>
            )}

            {/* Category Breakdown */}
            <View style={styles.breakdownCard}>
              <Text style={styles.chartTitle}>Category Breakdown</Text>
              {categoryData.map((item, index) => {
                const percentage = ((item.amount / totalSpent) * 100).toFixed(1);
                
                return (
                  <View key={index} style={styles.breakdownItem}>
                    <View style={styles.breakdownLeft}>
                      <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                      <Text style={styles.breakdownName}>{item.name}</Text>
                    </View>
                    
                    <View style={styles.breakdownRight}>
                      <Text style={styles.breakdownAmount}>{formatCurrency(item.amount)}</Text>
                      <Text style={styles.breakdownPercentage}>{percentage}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={80} color={COLORS.border} />
            <Text style={styles.emptyText}>No data available</Text>
            <Text style={styles.emptySubtext}>
              Add some expenses to see your spending analytics
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
    padding: SIZES.padding,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: SIZES.borderRadius - 4,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  totalCard: {
    backgroundColor: COLORS.primary,
    padding: 24,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: SIZES.medium,
    color: COLORS.white,
    opacity: 0.9,
  },
  totalAmount: {
    fontSize: SIZES.xxlarge,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 8,
  },
  totalPeriod: {
    fontSize: SIZES.small,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: SIZES.borderRadius,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  barChart: {
    borderRadius: SIZES.borderRadius,
  },
  breakdownCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: SIZES.borderRadius,
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  breakdownName: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    fontWeight: '500',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownAmount: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  breakdownPercentage: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
});

export default ReportsScreen;
