// App Navigator - Authentication and Role-based Navigation
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { ActivityIndicator, View } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Student Screens
import StudentHomeScreen from '../screens/Student/StudentHomeScreen';
import AddExpenseScreen from '../screens/Student/AddExpenseScreen';
import ExpenseListScreen from '../screens/Student/ExpenseListScreen';
import ReportsScreen from '../screens/Student/ReportsScreen';
import BudgetSetupScreen from '../screens/Student/BudgetSetupScreen';
import StudentProfileScreen from '../screens/Student/ProfileScreen';
import StudentExpensesScreen from '../screens/Student/StudentExpensesScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import ManageStudentsScreen from '../screens/Admin/ManageStudentsScreen';
import AdminReportsScreen from '../screens/Admin/AdminReportsScreen';
import ManageCoursesScreen from '../screens/Admin/ManageCoursesScreen';
import ProfileScreen from '../screens/Admin/ProfileScreen';
import ManageExpensesScreen from '../screens/Admin/ManageExpensesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Auth Stack Navigator
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Student Home Stack
const StudentHomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
      <Stack.Screen name="BudgetSetup" component={BudgetSetupScreen} />
      <Stack.Screen name="Profile" component={StudentProfileScreen} />
    </Stack.Navigator>
  );
};

// Student Expenses Stack
const StudentExpensesStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentExpenses" component={StudentExpensesScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="Profile" component={StudentProfileScreen} />
    </Stack.Navigator>
  );
};

// Student Expense List Stack
const StudentExpenseListStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExpenseListMain" component={ExpenseListScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="Profile" component={StudentProfileScreen} />
    </Stack.Navigator>
  );
};

// Student Tab Navigator
const StudentNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyExpenses') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Expenses') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Home" component={StudentHomeStack} />
      <Tab.Screen 
        name="MyExpenses" 
        component={StudentExpensesStack}
        options={{ tabBarLabel: 'Payments' }}
      />
      <Tab.Screen name="Expenses" component={StudentExpenseListStack} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
};

// Admin Stack Navigator
const AdminDashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Students') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Expenses') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Courses') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardStack} />
      <Tab.Screen name="Students" component={ManageStudentsScreen} />
      <Tab.Screen name="Expenses" component={ManageExpensesScreen} />
      <Tab.Screen name="Courses" component={ManageCoursesScreen} />
      <Tab.Screen 
        name="Analytics" 
        component={AdminReportsScreen}
        options={{ tabBarLabel: 'Reports' }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return <AuthStack />;
  }

  // Route based on user role
  if (user.role === 'admin') {
    return <AdminNavigator />;
  } else {
    return <StudentNavigator />;
  }
};

export default AppNavigator;
