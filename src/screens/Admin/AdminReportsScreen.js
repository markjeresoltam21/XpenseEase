// Admin Reports Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  Pressable,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase.config';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { formatCurrency } from '../../utils/helpers';
import { useUser } from '../../context/UserContext';
import { logoutUser } from '../../services/authService';

const screenWidth = Dimensions.get('window').width;

const AdminReportsScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    categoryData: [],
    monthlyData: []
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      const expensesSnapshot = await getDocs(collection(db, 'expenses'));
      const expenses = [];
      let totalAmount = 0;
      const categoryTotals = {};

      expensesSnapshot.forEach((doc) => {
        const data = doc.data();
        expenses.push(data);
        totalAmount += parseFloat(data.amount) || 0;

        // Calculate category totals
        if (categoryTotals[data.category]) {
          categoryTotals[data.category] += parseFloat(data.amount);
        } else {
          categoryTotals[data.category] = parseFloat(data.amount);
        }
      });

      // Format category data for pie chart
      const categoryData = Object.keys(categoryTotals).map(category => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        amount: categoryTotals[category],
        color: getCategoryColor(category),
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }));

      setStats({
        totalExpenses: expenses.length,
        totalAmount,
        categoryData,
        monthlyData: []
      });
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      food: '#FF6B6B',
      transport: '#4ECDC4',
      education: '#45B7D1',
      entertainment: '#F7DC6F',
      health: '#52C41A',
      shopping: '#FA8C16',
      bills: '#EB2F96',
      others: '#8C8C8C'
    };
    return colors[category] || '#8C8C8C';
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReportsData();
  };

  const handleLogout = async () => {
    await logoutUser();
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
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={24} color={COLORS.white} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || 'Admin User'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'admin@gmail.com'}</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setShowProfileMenu(false)}
            >
              <Ionicons name="person-outline" size={20} color={COLORS.text} />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setShowProfileMenu(false)}
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
              <Text style={styles.headerGreeting}>Reports & Insights</Text>
              <Text style={styles.headerSubtitle}>Expense Analytics Dashboard</Text>
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

        {/* Summary Cards */}
        <View style={styles.contentContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Ionicons name="receipt-outline" size={32} color="#388E3C" />
              <Text style={styles.summaryValue}>{stats.totalExpenses}</Text>
              <Text style={styles.summaryLabel}>Total Transactions</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="cash-outline" size={32} color="#F57C00" />
              <Text style={styles.summaryValue}>{formatCurrency(stats.totalAmount)}</Text>
              <Text style={styles.summaryLabel}>Total Amount</Text>
            </View>
          </View>

          {/* Category Breakdown */}
          {stats.categoryData.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Expense by Category</Text>
              <View style={styles.chartCard}>
                <PieChart
                  data={stats.categoryData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>

              {/* Category List */}
              <Text style={styles.sectionTitle}>Category Details</Text>
              {stats.categoryData.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <Text style={styles.categoryAmount}>{formatCurrency(category.amount)}</Text>
                </View>
              ))}
            </>
          )}

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
    color: '#388E3C',
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default AdminReportsScreen;
