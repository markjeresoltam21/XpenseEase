// Authentication Service - Login, Register, User Management
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase.config';

// Register new user (Student or Admin)
export const registerUser = async (email, password, userData) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, {
      displayName: userData.name
    });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      name: userData.name,
      role: userData.role || 'student', // 'student' or 'admin'
      studentId: userData.studentId || null,
      course: userData.course || null,
      yearLevel: userData.yearLevel || null,
      createdAt: new Date().toISOString()
    });

    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Log login activity
      try {
        await addDoc(collection(db, 'loginActivity'), {
          userId: user.uid,
          userName: userData.name,
          userEmail: userData.email,
          userRole: userData.role,
          timestamp: Timestamp.now()
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
        // Don't fail login if activity logging fails
      }
      
      return { 
        success: true, 
        user: {
          ...user,
          role: userData.role,
          name: userData.name,
          studentId: userData.studentId,
          course: userData.course,
          yearLevel: userData.yearLevel
        }
      };
    } else {
      return { success: false, error: 'User data not found' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Get current user data
export const getCurrentUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, userData: userDoc.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Get user data error:', error);
    return { success: false, error: error.message };
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
