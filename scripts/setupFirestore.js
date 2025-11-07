// Firestore Database Setup Script
// Run this with: node scripts/setupFirestore.js

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  serverTimestamp 
} = require('firebase/firestore');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateProfile 
} = require('firebase/auth');

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDM51MI7NHMRRk54odYDliEatnZ2bzMc4I",
  authDomain: "xpenseease.firebaseapp.com",
  projectId: "xpenseease",
  storageBucket: "xpenseease.firebasestorage.app",
  messagingSenderId: "63324815135",
  appId: "1:63324815135:android:51e8a70c03f20efe707a2a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function setupFirestore() {
  console.log('🔥 Starting Firestore Database Setup...\n');

  try {
    // ========================================
    // 1. CREATE ADMIN ACCOUNT
    // ========================================
    console.log('👤 Creating Admin Account...');
    let adminUid;
    try {
      const adminCredential = await createUserWithEmailAndPassword(
        auth, 
        'admin@gmail.com', 
        'admin123'
      );
      adminUid = adminCredential.user.uid;
      await updateProfile(adminCredential.user, { displayName: 'Admin User' });
      console.log('✅ Admin account created: admin@gmail.com');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  Admin account already exists');
        // If admin exists, we'll use a placeholder UID for demo
        adminUid = 'admin-uid-placeholder';
      } else {
        throw error;
      }
    }

    // Create Admin User Document
    await setDoc(doc(db, 'users', adminUid), {
      uid: adminUid,
      email: 'admin@gmail.com',
      name: 'Admin User',
      role: 'admin',
      studentId: null,
      course: null,
      yearLevel: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Admin user document created in Firestore\n');

    // ========================================
    // 2. CREATE STUDENT ACCOUNT
    // ========================================
    console.log('🎓 Creating Student Account...');
    let studentUid;
    try {
      const studentCredential = await createUserWithEmailAndPassword(
        auth,
        'markjeresoltam@gmail.com',
        'student123'
      );
      studentUid = studentCredential.user.uid;
      await updateProfile(studentCredential.user, { displayName: 'Mark Jere Soltam' });
      console.log('✅ Student account created: markjeresoltam@gmail.com');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  Student account already exists');
        studentUid = 'student-uid-placeholder';
      } else {
        throw error;
      }
    }

    // Create Student User Document
    await setDoc(doc(db, 'users', studentUid), {
      uid: studentUid,
      email: 'markjeresoltam@gmail.com',
      name: 'Mark Jere Soltam',
      role: 'student',
      studentId: '2024-00001',
      course: 'BS Computer Science',
      yearLevel: '3rd',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Student user document created in Firestore\n');

    // ========================================
    // 3. CREATE CATEGORIES COLLECTION
    // ========================================
    console.log('📁 Creating Categories...');
    const categories = [
      { id: 'food', name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' },
      { id: 'transport', name: 'Transportation', icon: 'car', color: '#4ECDC4' },
      { id: 'education', name: 'Education', icon: 'school', color: '#45B7D1' },
      { id: 'entertainment', name: 'Entertainment', icon: 'game-controller', color: '#F7DC6F' },
      { id: 'health', name: 'Health & Fitness', icon: 'fitness', color: '#52C41A' },
      { id: 'shopping', name: 'Shopping', icon: 'cart', color: '#FA8C16' },
      { id: 'bills', name: 'Bills & Utilities', icon: 'receipt', color: '#EB2F96' },
      { id: 'others', name: 'Others', icon: 'ellipsis-horizontal', color: '#8C8C8C' }
    ];

    for (const category of categories) {
      await setDoc(doc(db, 'categories', category.id), {
        ...category,
        createdAt: new Date().toISOString()
      });
      console.log(`  ✅ ${category.name}`);
    }
    console.log('✅ All categories created\n');

    // ========================================
    // 4. CREATE SAMPLE BUDGET FOR STUDENT
    // ========================================
    console.log('💰 Creating Sample Budget...');
    const budgetData = {
      userId: studentUid,
      totalBudget: 5000,
      startDate: new Date('2025-01-01').toISOString(),
      endDate: new Date('2025-01-31').toISOString(),
      categoryBudgets: {
        food: 2000,
        transport: 1000,
        education: 1000,
        entertainment: 500,
        health: 300,
        shopping: 200,
        bills: 0,
        others: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'budgets', studentUid), budgetData);
    console.log('✅ Sample budget created for student\n');

    // ========================================
    // 5. CREATE SAMPLE EXPENSES FOR STUDENT
    // ========================================
    console.log('💸 Creating Sample Expenses...');
    const sampleExpenses = [
      {
        userId: studentUid,
        amount: 150,
        category: 'food',
        description: 'Lunch at cafeteria',
        date: new Date('2025-01-15').toISOString(),
        createdAt: new Date('2025-01-15').toISOString()
      },
      {
        userId: studentUid,
        amount: 50,
        category: 'transport',
        description: 'Jeepney fare',
        date: new Date('2025-01-16').toISOString(),
        createdAt: new Date('2025-01-16').toISOString()
      },
      {
        userId: studentUid,
        amount: 500,
        category: 'education',
        description: 'Books and supplies',
        date: new Date('2025-01-10').toISOString(),
        createdAt: new Date('2025-01-10').toISOString()
      },
      {
        userId: studentUid,
        amount: 200,
        category: 'entertainment',
        description: 'Movie with friends',
        date: new Date('2025-01-20').toISOString(),
        createdAt: new Date('2025-01-20').toISOString()
      },
      {
        userId: studentUid,
        amount: 80,
        category: 'food',
        description: 'Snacks',
        date: new Date('2025-01-18').toISOString(),
        createdAt: new Date('2025-01-18').toISOString()
      }
    ];

    for (const expense of sampleExpenses) {
      await addDoc(collection(db, 'expenses'), expense);
      console.log(`  ✅ ${expense.description} - ₱${expense.amount}`);
    }
    console.log('✅ All sample expenses created\n');

    // ========================================
    // 6. CREATE SYSTEM SETTINGS COLLECTION
    // ========================================
    console.log('⚙️  Creating System Settings...');
    await setDoc(doc(db, 'settings', 'app'), {
      appName: 'XpenseEase',
      version: '1.0.0',
      maintenanceMode: false,
      features: {
        budgetTracking: true,
        expenseReports: true,
        categoryManagement: true,
        adminDashboard: true
      },
      updatedAt: new Date().toISOString()
    });
    console.log('✅ System settings created\n');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('═══════════════════════════════════════════');
    console.log('✅ FIRESTORE DATABASE SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════');
    console.log('\n📊 Created Collections:');
    console.log('  • users (2 documents)');
    console.log('  • categories (8 documents)');
    console.log('  • budgets (1 document)');
    console.log('  • expenses (5 documents)');
    console.log('  • settings (1 document)');
    console.log('\n👤 Login Credentials:');
    console.log('  Admin:');
    console.log('    Email: admin@gmail.com');
    console.log('    Password: admin123');
    console.log('\n  Student:');
    console.log('    Email: markjeresoltam@gmail.com');
    console.log('    Password: student123');
    console.log('\n🚀 Next Steps:');
    console.log('  1. Run: npm start');
    console.log('  2. Scan QR code with Expo Go');
    console.log('  3. Login with credentials above');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error setting up Firestore:', error);
    console.error(error.message);
  }
}

// Run the setup
setupFirestore().then(() => {
  console.log('✅ Script execution completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
