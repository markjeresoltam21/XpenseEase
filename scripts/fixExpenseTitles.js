// Script to fix expenses that don't have titles
// This will use the description as the title

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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

async function fixExpenseTitles() {
  try {
    console.log('Starting to fix expense titles...\n');
    
    const querySnapshot = await getDocs(collection(db, 'expenses'));
    let fixed = 0;
    
    for (const expenseDoc of querySnapshot.docs) {
      const expense = expenseDoc.data();
      
      // If title is missing or empty, use description
      if (!expense.title || expense.title.trim() === '') {
        const newTitle = expense.description || 'School Expense';
        
        await updateDoc(doc(db, 'expenses', expenseDoc.id), {
          title: newTitle
        });
        
        console.log(`✓ Fixed: "${expense.description}" → Title: "${newTitle}"`);
        fixed++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Fixed: ${fixed} expense records`);
    console.log('Done!');
    
    // Now fix the payment records too
    console.log('\n=== Fixing Payment Records ===\n');
    await fixPayments();
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

async function fixPayments() {
  const paymentsSnapshot = await getDocs(collection(db, 'expensePayments'));
  let fixed = 0;
  
  for (const paymentDoc of paymentsSnapshot.docs) {
    const payment = paymentDoc.data();
    
    // Get the expense to find the correct title
    const expenseDoc = await getDocs(collection(db, 'expenses'));
    const expense = expenseDoc.docs.find(d => d.id === payment.expenseId);
    
    if (expense) {
      const expenseData = expense.data();
      const correctTitle = expenseData.title || expenseData.description || 'School Payment';
      
      if (payment.expenseTitle !== correctTitle) {
        await updateDoc(doc(db, 'expensePayments', paymentDoc.id), {
          expenseTitle: correctTitle
        });
        
        console.log(`✓ Payment fixed: "${payment.expenseTitle}" → "${correctTitle}"`);
        fixed++;
      }
    }
  }
  
  console.log(`\nFixed: ${fixed} payment records`);
}

fixExpenseTitles();
