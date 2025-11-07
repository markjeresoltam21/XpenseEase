// Script to check all budgets in the database
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

async function checkBudgets() {
  try {
    console.log('=== All Budgets in Database ===\n');
    
    const querySnapshot = await getDocs(collection(db, 'budgets'));
    
    if (querySnapshot.empty) {
      console.log('No budgets found in database!');
    } else {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Document ID (User ID): ${doc.id}`);
        console.log(`Weekly Budget: ${data.weeklyBudget}`);
        console.log(`Monthly Budget: ${data.monthlyBudget}`);
        console.log(`Period: ${data.period}`);
        console.log(`Updated At: ${data.updatedAt?.toDate ? data.updatedAt.toDate().toLocaleString() : 'N/A'}`);
        console.log('---');
      });
      
      console.log(`\nTotal budgets: ${querySnapshot.size}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkBudgets();
