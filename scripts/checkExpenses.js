// Script to check all expenses in the database
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

async function checkExpenses() {
  try {
    console.log('=== All Expenses in Database ===\n');
    
    const querySnapshot = await getDocs(collection(db, 'expenses'));
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`Title: ${data.title || 'NO TITLE'}`);
      console.log(`Category: ${data.category}`);
      console.log(`Amount: ₱${data.amount}`);
      console.log(`Description: ${data.description || 'N/A'}`);
      console.log('---');
    });
    
    console.log(`Total expenses: ${querySnapshot.size}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkExpenses();
