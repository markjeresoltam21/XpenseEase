// Firebase Setup Script - Create Initial Admin and Student Accounts
// Run this once to set up initial accounts

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Your Firebase config
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
const auth = getAuth(app);
const db = getFirestore(app);

async function createInitialAccounts() {
  try {
    console.log('🔥 Creating initial accounts...\n');

    // Create Admin Account
    console.log('Creating Admin account...');
    const adminCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@gmail.com',
      'admin123'
    );
    
    await updateProfile(adminCredential.user, {
      displayName: 'Admin User'
    });

    await setDoc(doc(db, 'users', adminCredential.user.uid), {
      uid: adminCredential.user.uid,
      email: 'admin@gmail.com',
      name: 'Admin User',
      role: 'admin',
      studentId: null,
      course: null,
      yearLevel: null,
      createdAt: new Date().toISOString()
    });

    console.log('✅ Admin account created successfully!');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: admin123');
    console.log('   UID:', adminCredential.user.uid);
    console.log('');

    // Create Student Account
    console.log('Creating Student account...');
    const studentCredential = await createUserWithEmailAndPassword(
      auth,
      'markjeresoltam@gmail.com',
      'student123'
    );
    
    await updateProfile(studentCredential.user, {
      displayName: 'Mark Jere Soltam'
    });

    await setDoc(doc(db, 'users', studentCredential.user.uid), {
      uid: studentCredential.user.uid,
      email: 'markjeresoltam@gmail.com',
      name: 'Mark Jere Soltam',
      role: 'student',
      studentId: '2024-00001',
      course: 'BS Computer Science',
      yearLevel: '3rd',
      createdAt: new Date().toISOString()
    });

    console.log('✅ Student account created successfully!');
    console.log('   Email: markjeresoltam@gmail.com');
    console.log('   Password: student123');
    console.log('   Student ID: 2024-00001');
    console.log('   UID:', studentCredential.user.uid);
    console.log('');

    console.log('🎉 All accounts created successfully!');
    console.log('\n📝 Summary:');
    console.log('   - 1 Admin account');
    console.log('   - 1 Student account');
    console.log('\n✅ You can now login with these credentials in the app!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n⚠️  Accounts may already exist. Try logging in with:');
      console.log('   Admin: admin@gmail.com / admin123');
      console.log('   Student: markjeresoltam@gmail.com / student123');
    }
  }
}

createInitialAccounts();
