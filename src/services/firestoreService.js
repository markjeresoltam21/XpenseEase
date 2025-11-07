// Firestore Service - CRUD Operations for Expenses and Budget
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  setDoc,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

// ========== EXPENSE OPERATIONS ==========

// Add a new expense
export const addExpense = async (userId, expenseData) => {
  try {
    const expense = {
      ...expenseData,
      userId,
      createdAt: Timestamp.now(),
      date: expenseData.date || Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'expenses'), expense);
    return { id: docRef.id, ...expense };
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

// Get all expenses for a user
export const getExpenses = async (userId) => {
  try {
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const expenses = [];
    
    querySnapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by date on client side (newest first)
    expenses.sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
    
    return expenses;
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
};

// Get expenses by date range
export const getExpensesByDateRange = async (userId, startDate, endDate) => {
  try {
    // Get all user expenses first
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const expenses = [];
    
    // Convert Firestore timestamps to Date objects for comparison
    const startDateTime = startDate?.toDate ? startDate.toDate() : new Date(startDate);
    const endDateTime = endDate?.toDate ? endDate.toDate() : new Date(endDate);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const expenseDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
      
      // Filter by date range on client side
      if (expenseDate >= startDateTime && expenseDate <= endDateTime) {
        expenses.push({ id: doc.id, ...data });
      }
    });
    
    // Sort by date on client side (newest first)
    expenses.sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
    
    return expenses;
  } catch (error) {
    console.error('Error getting expenses by date:', error);
    throw error;
  }
};

// Update an expense
export const updateExpense = async (expenseId, updateData) => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Delete an expense
export const deleteExpense = async (expenseId) => {
  try {
    await deleteDoc(doc(db, 'expenses', expenseId));
    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// ========== BUDGET OPERATIONS ==========

// Set or update budget
export const setBudget = async (userId, budgetData) => {
  try {
    const budgetRef = doc(db, 'budgets', userId);
    await setDoc(budgetRef, {
      ...budgetData,
      userId,
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    return budgetData;
  } catch (error) {
    console.error('Error setting budget:', error);
    throw error;
  }
};

// Get user budget
export const getBudget = async (userId) => {
  try {
    const budgetRef = doc(db, 'budgets', userId);
    const budgetSnap = await getDoc(budgetRef);
    
    if (budgetSnap.exists()) {
      return { id: budgetSnap.id, ...budgetSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting budget:', error);
    throw error;
  }
};

// ========== ANALYTICS OPERATIONS ==========

// Get expenses grouped by category
export const getExpensesByCategory = async (userId, startDate, endDate) => {
  try {
    // Get all user expenses
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const categoryTotals = {};
    
    // Convert date range for comparison if provided
    let startDateTime, endDateTime;
    if (startDate && endDate) {
      startDateTime = startDate?.toDate ? startDate.toDate() : new Date(startDate);
      endDateTime = endDate?.toDate ? endDate.toDate() : new Date(endDate);
    }
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Filter by date range if provided
      if (startDate && endDate) {
        const expenseDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        if (expenseDate < startDateTime || expenseDate > endDateTime) {
          return; // Skip this expense
        }
      }
      
      const category = data.category || 'other';
      const amount = parseFloat(data.amount) || 0;
      
      if (categoryTotals[category]) {
        categoryTotals[category] += amount;
      } else {
        categoryTotals[category] = amount;
      }
    });
    
    return categoryTotals;
  } catch (error) {
    console.error('Error getting expenses by category:', error);
    throw error;
  }
};

// Calculate total spending
export const getTotalSpending = async (userId, startDate, endDate) => {
  try {
    let expenses;
    
    if (startDate && endDate) {
      expenses = await getExpensesByDateRange(userId, startDate, endDate);
    } else {
      expenses = await getExpenses(userId);
    }
    
    const total = expenses.reduce((sum, expense) => {
      return sum + (parseFloat(expense.amount) || 0);
    }, 0);
    
    return total;
  } catch (error) {
    console.error('Error calculating total spending:', error);
    throw error;
  }
};

// ========== COLLEGE AND COURSE OPERATIONS ==========

// Get all colleges
export const getColleges = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'colleges'));
    const colleges = [];
    
    querySnapshot.forEach((doc) => {
      colleges.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort alphabetically
    colleges.sort((a, b) => a.name.localeCompare(b.name));
    
    return colleges;
  } catch (error) {
    console.error('Error getting colleges:', error);
    throw error;
  }
};

// Get courses by college ID
export const getCoursesByCollege = async (collegeId) => {
  try {
    const q = query(
      collection(db, 'courses'),
      where('collegeId', '==', collegeId)
    );
    
    const querySnapshot = await getDocs(q);
    const courses = [];
    
    querySnapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort alphabetically
    courses.sort((a, b) => a.name.localeCompare(b.name));
    
    return courses;
  } catch (error) {
    console.error('Error getting courses:', error);
    throw error;
  }
};

// Check if admin exists
export const checkAdminExists = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking admin:', error);
    throw error;
  }
};
