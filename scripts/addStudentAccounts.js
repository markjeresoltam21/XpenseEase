// Add New Student Accounts
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, setDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase configuration
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

async function addStudentAccounts() {
  try {
    console.log('🔥 Adding new student accounts...\n');

    // Get COCIS college
    const collegeQuery = query(
      collection(db, 'colleges'),
      where('code', '==', 'COCIS')
    );
    const collegeSnapshot = await getDocs(collegeQuery);
    
    if (collegeSnapshot.empty) {
      console.error('❌ COCIS college not found. Please run setupCollegesAndCourses.js first.');
      process.exit(1);
    }

    const collegeId = collegeSnapshot.docs[0].id;
    const collegeName = collegeSnapshot.docs[0].data().name;
    console.log(`📚 Found college: ${collegeName} (ID: ${collegeId})`);

    // Get BSIT course
    const courseQuery = query(
      collection(db, 'courses'),
      where('code', '==', 'BSIT'),
      where('collegeId', '==', collegeId)
    );
    const courseSnapshot = await getDocs(courseQuery);
    
    if (courseSnapshot.empty) {
      console.error('❌ BSIT course not found.');
      process.exit(1);
    }

    const courseId = courseSnapshot.docs[0].id;
    const courseData = courseSnapshot.docs[0].data();
    console.log(`📖 Found course: ${courseData.name} (ID: ${courseId})\n`);

    // Student 1: Chavy Butaslac
    console.log('Creating student account 1...');
    try {
      const student1Credential = await createUserWithEmailAndPassword(
        auth,
        'chavybutaslac@asscat.edu.ph',
        'password'
      );
      
      await updateProfile(student1Credential.user, {
        displayName: 'Chavy Butaslac'
      });

      await setDoc(doc(db, 'users', student1Credential.user.uid), {
        uid: student1Credential.user.uid,
        email: 'chavybutaslac@asscat.edu.ph',
        name: 'Chavy Butaslac',
        role: 'student',
        studentId: '2024-00002',
        college: collegeName,
        collegeId: collegeId,
        course: courseData.name,
        courseId: courseId,
        courseCode: 'BSIT',
        yearLevel: '3rd',
        createdAt: new Date().toISOString()
      });

      console.log('✅ Student account 1 created successfully!');
      console.log('   Email: chavybutaslac@asscat.edu.ph');
      console.log('   Password: password');
      console.log('   Student ID: 2024-00002');
      console.log('   College: ' + collegeName);
      console.log('   Course: ' + courseData.name);
      console.log('   UID:', student1Credential.user.uid);
      console.log('');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  Account chavybutaslac@asscat.edu.ph already exists\n');
      } else {
        throw error;
      }
    }

    // Student 2: Jazzmin Tantoy
    console.log('Creating student account 2...');
    try {
      const student2Credential = await createUserWithEmailAndPassword(
        auth,
        'jazzmintantoy@asscat.edu.ph',
        'password'
      );
      
      await updateProfile(student2Credential.user, {
        displayName: 'Jazzmin Tantoy'
      });

      await setDoc(doc(db, 'users', student2Credential.user.uid), {
        uid: student2Credential.user.uid,
        email: 'jazzmintantoy@asscat.edu.ph',
        name: 'Jazzmin Tantoy',
        role: 'student',
        studentId: '2024-00003',
        college: collegeName,
        collegeId: collegeId,
        course: courseData.name,
        courseId: courseId,
        courseCode: 'BSIT',
        yearLevel: '3rd',
        createdAt: new Date().toISOString()
      });

      console.log('✅ Student account 2 created successfully!');
      console.log('   Email: jazzmintantoy@asscat.edu.ph');
      console.log('   Password: password');
      console.log('   Student ID: 2024-00003');
      console.log('   College: ' + collegeName);
      console.log('   Course: ' + courseData.name);
      console.log('   UID:', student2Credential.user.uid);
      console.log('');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  Account jazzmintantoy@asscat.edu.ph already exists\n');
      } else {
        throw error;
      }
    }

    console.log('🎉 Student accounts creation completed!');
    console.log('\n📝 Summary:');
    console.log('   - Added 2 BSIT students from COCIS');
    console.log('\n✅ You can now login with these credentials in the app!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the setup
addStudentAccounts();
