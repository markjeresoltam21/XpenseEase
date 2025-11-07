// Setup Colleges and Courses in Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where, connectFirestoreEmulator } = require('firebase/firestore');

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
const db = getFirestore(app);

// Uncomment this line if using emulator
// connectFirestoreEmulator(db, 'localhost', 8080);

// Colleges and Courses Data
const collegesData = [
  {
    code: 'COA',
    name: 'College of Agriculture',
    description: 'College of Agriculture',
    courses: [
      { code: 'BAT', name: 'Bachelor of Agricultural Technology' },
      { code: 'BSA-HORT', name: 'Bachelor of Science in Agriculture major in Horticulture' },
      { code: 'BSA-AS', name: 'Bachelor of Science in Agriculture major in Animal Science' },
      { code: 'BSA-AGRO', name: 'Bachelor of Science in Agriculture major in Agronomy' },
      { code: 'BSAF', name: 'Bachelor of Science in Agroforestry' },
      { code: 'BS-AGRIB', name: 'Bachelor of Science in Agribusiness' },
      { code: 'DIFT', name: 'Diploma in Inland Fisheries Technology' }
    ]
  },
  {
    code: 'COEIT',
    name: 'College of Engineering and Industrial Technology',
    description: 'College of Engineering and Industrial Technology',
    courses: [
      { code: 'BSECE', name: 'Bachelor of Science in Electronics Engineering' },
      { code: 'BSABE', name: 'Bachelor of Science in Agricultural and Biosystems Engineering' },
      { code: 'BSCE', name: 'Bachelor of Science in Civil Engineering' },
      { code: 'BIT-CT', name: 'Bachelor of Industrial Technology major in Civil Technology' },
      { code: 'BIT-ET', name: 'Bachelor of Industrial Technology major in Electronics Technology' },
      { code: 'BIT-WAFT', name: 'Bachelor of Industrial Technology major in Welding & Fabrication Technology' },
      { code: 'BIT-HVRAC', name: 'Bachelor of Industrial Technology major in Heating, Ventilating, Refrigeration & Air Conditioning' }
    ]
  },
  {
    code: 'COCIS',
    name: 'College of Computing and Information Sciences',
    description: 'College of Computing and Information Sciences',
    courses: [
      { code: 'BSIS', name: 'Bachelor of Science in Information Systems' },
      { code: 'BSIT', name: 'Bachelor of Science in Information Technology' }
    ]
  },
  {
    code: 'COTE',
    name: 'College of Teacher Education',
    description: 'College of Teacher Education',
    courses: [
      { code: 'BEED', name: 'Bachelor of Elementary Education' },
      { code: 'BSED-ENG', name: 'Bachelor of Secondary Education major in English' },
      { code: 'BSED-SCI', name: 'Bachelor of Secondary Education major in Science' },
      { code: 'BSED-MATH', name: 'Bachelor of Secondary Education major in Mathematics' },
      { code: 'BTLED-IA', name: 'Bachelor of Technology and Livelihood Education major in Industrial Arts' },
      { code: 'BTLED-AFA', name: 'Bachelor of Technology and Livelihood Education major in Agri-Fishery Arts' },
      { code: 'BTLED-HE', name: 'Bachelor of Technology and Livelihood Education major in Home Economics' },
      { code: 'ABEL', name: 'Bachelor of Arts in English Language' }
    ]
  },
  {
    code: 'COAS',
    name: 'College of Arts and Sciences',
    description: 'College of Arts and Sciences',
    courses: [
      { code: 'BS-BIO', name: 'Bachelor of Science in Biology' },
      { code: 'BSAM', name: 'Bachelor of Science in Applied Mathematics' },
      { code: 'BSES', name: 'Bachelor of Science in Environmental Science' }
    ]
  },
  {
    code: 'COBA',
    name: 'College of Business Administration',
    description: 'College of Business Administration',
    courses: [
      { code: 'BS-ENTREP', name: 'Bachelor of Science in Entrepreneurship' }
    ]
  }
];

async function setupCollegesAndCourses() {
  try {
    console.log('🚀 Starting Colleges and Courses migration...\n');

    for (const collegeData of collegesData) {
      // Check if college already exists
      const collegeQuery = query(
        collection(db, 'colleges'),
        where('code', '==', collegeData.code)
      );
      const collegeSnapshot = await getDocs(collegeQuery);

      let collegeId;

      if (collegeSnapshot.empty) {
        // Add college
        console.log(`📚 Adding college: ${collegeData.name} (${collegeData.code})`);
        const collegeRef = await addDoc(collection(db, 'colleges'), {
          code: collegeData.code,
          name: collegeData.name,
          description: collegeData.description || '',
          createdAt: new Date()
        });
        collegeId = collegeRef.id;
        console.log(`   ✅ College added with ID: ${collegeId}`);
      } else {
        collegeId = collegeSnapshot.docs[0].id;
        console.log(`📚 College already exists: ${collegeData.name} (${collegeData.code})`);
        console.log(`   ℹ️  Using existing ID: ${collegeId}`);
      }

      // Add courses for this college
      console.log(`   📖 Adding courses for ${collegeData.name}:`);
      for (const course of collegeData.courses) {
        // Check if course already exists
        const courseQuery = query(
          collection(db, 'courses'),
          where('code', '==', course.code)
        );
        const courseSnapshot = await getDocs(courseQuery);

        if (courseSnapshot.empty) {
          await addDoc(collection(db, 'courses'), {
            code: course.code,
            name: course.name,
            description: course.description || '',
            collegeId: collegeId,
            createdAt: new Date()
          });
          console.log(`      ✅ ${course.code} - ${course.name}`);
        } else {
          console.log(`      ⏭️  ${course.code} - ${course.name} (already exists)`);
        }
      }
      console.log('');
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`   📚 Total Colleges: ${collegesData.length}`);
    console.log(`   📖 Total Courses: ${collegesData.reduce((sum, c) => sum + c.courses.length, 0)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the setup
setupCollegesAndCourses();
