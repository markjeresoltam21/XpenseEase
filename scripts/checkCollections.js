// Script to list all collections in Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCUfcc2-HBRdT0jygMV1hl89UVOYx9CkRI",
  authDomain: "xpenseease.firebaseapp.com",
  projectId: "xpenseease",
  storageBucket: "xpenseease.firebasestorage.app",
  messagingSenderId: "439775408384",
  appId: "1:439775408384:web:c91a2d1698f66c96a03eaa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCollections() {
  try {
    const collections = ['users', 'expenses', 'budgets', 'expensePayments', 'colleges', 'courses'];
    
    for (const collName of collections) {
      const snapshot = await getDocs(collection(db, collName));
      console.log(`${collName}: ${snapshot.size} documents`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkCollections();
