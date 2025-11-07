// Script to check all users in the database
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

async function checkUsers() {
  try {
    console.log('=== All Users in Database ===\n');
    
    const querySnapshot = await getDocs(collection(db, 'users'));
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`User ID: ${doc.id}`);
      console.log(`Name: ${data.name}`);
      console.log(`Email: ${data.email}`);
      console.log(`Role: ${data.role}`);
      console.log('---');
    });
    
    console.log(`\nTotal users: ${querySnapshot.size}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkUsers();
