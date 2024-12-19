import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase-config'; // Your firebase config file

// Convert date format from "DD/MM/YY" to timestamp
const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split('/');
  return new Date(`20${year}`, month - 1, day);
};

// Add a new study plan
export const addStudyPlan = async (planData) => {
  try {
    const timestamp = parseDate(planData.date);
    const docRef = await addDoc(collection(db, 'studyPlan'), {
      date: timestamp,
      dateString: planData.date, // Keep original string for easy querying
      tasks: planData.tasks.map(task => ({
        ...task,
        duration: task.duration || null
      }))
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding study plan:', error);
    throw error;
  }
};

// Get all study plans
export const getAllStudyPlans = async () => {
  try {
    const studyPlansRef = collection(db, 'studyPlan');
    const querySnapshot = await getDocs(studyPlansRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().dateString // Use the string format for frontend
    }));
  } catch (error) {
    console.error('Error getting study plans:', error);
    throw error;
  }
};

// Get study plan by date
export const getStudyPlanByDate = async (dateStr) => {
  try {
    const studyPlansRef = collection(db, 'studyPlan');
    const q = query(studyPlansRef, where('dateString', '==', dateStr));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      date: doc.data().dateString
    };
  } catch (error) {
    console.error('Error getting study plan:', error);
    throw error;
  }
};

// Update study plan
export const updateStudyPlan = async (id, updatedData) => {
  try {
    const docRef = doc(db, 'studyPlan', id);
    await updateDoc(docRef, {
      tasks: updatedData.tasks
    });
  } catch (error) {
    console.error('Error updating study plan:', error);
    throw error;
  }
};

// Delete study plan
export const deleteStudyPlan = async (id) => {
  try {
    await deleteDoc(doc(db, 'studyPlan', id));
  } catch (error) {
    console.error('Error deleting study plan:', error);
    throw error;
  }
};

// Get study plans by subject
export const getStudyPlansBySubject = async (subject) => {
  try {
    const studyPlansRef = collection(db, 'studyPlan');
    const querySnapshot = await getDocs(studyPlansRef);
    
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().dateString
      }))
      .filter(plan => plan.tasks.some(task => task.subject === subject));
  } catch (error) {
    console.error('Error getting study plans by subject:', error);
    throw error;
  }
};