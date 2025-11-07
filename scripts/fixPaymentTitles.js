// Script to fix payment records that have 'Untitled Expense' as the title
// Run this once to update existing payment records with the correct expense titles

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  getDoc
} = require('firebase/firestore');

// Firebase configuration (same as your app)
const firebaseConfig = {
  apiKey: "AIzaSyCUfcc2-HBRdT0jygMV1hl89UVOYx9CkRI",
  authDomain: "xpenseease.firebaseapp.com",
  projectId: "xpenseease",
  storageBucket: "xpenseease.firebasestorage.app",
  messagingSenderId: "439775408384",
  appId: "1:439775408384:web:c91a2d1698f66c96a03eaa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixPaymentTitles() {
  try {
    console.log('Starting to fix payment titles...\n');
    
    // Get all expense payments
    const paymentsSnapshot = await getDocs(collection(db, 'expensePayments'));
    let fixed = 0;
    let skipped = 0;
    
    for (const paymentDoc of paymentsSnapshot.docs) {
      const payment = paymentDoc.data();
      
      // Check if this payment has 'Untitled Expense' or missing title
      if (payment.expenseTitle === 'Untitled Expense' || !payment.expenseTitle) {
        // Get the actual expense to find the real title
        const expenseDoc = await getDoc(doc(db, 'expenses', payment.expenseId));
        
        if (expenseDoc.exists()) {
          const expense = expenseDoc.data();
          const correctTitle = expense.title || 'School Payment';
          
          // Update the payment record
          await updateDoc(doc(db, 'expensePayments', paymentDoc.id), {
            expenseTitle: correctTitle
          });
          
          console.log(`✓ Fixed: "${payment.expenseTitle}" → "${correctTitle}"`);
          fixed++;
        } else {
          console.log(`✗ Skipped: Expense not found for payment ${paymentDoc.id}`);
          skipped++;
        }
      } else {
        console.log(`- OK: "${payment.expenseTitle}"`);
        skipped++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Fixed: ${fixed} payment records`);
    console.log(`Skipped: ${skipped} payment records`);
    console.log('Done!');
    
  } catch (error) {
    console.error('Error fixing payment titles:', error);
  }
  
  process.exit(0);
}

// Run the script
fixPaymentTitles();
