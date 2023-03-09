import ".";
import { doc, setDoc, getDoc, collection, query, getDocs, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { firestore, functions } from ".";

export const createUserDetails = async (userId, data = {}) => {
  try {
    const usersRef = doc(firestore, "users", userId);
    await setDoc(usersRef, data);

    return data;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const getUserDetails = async (userId) => {
  try {
    const usersRef = doc(firestore, "users", userId);
    const docSnap = await getDoc(usersRef);

    if (!docSnap.exists()) {
      return false;
    }

    return docSnap.data();
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const createConfigData = async (configId, data = {}) => {
  try {
    const usersRef = doc(firestore, "examConfiguration", configId);
    await setDoc(usersRef, data, { merge: true });

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const getConfigData = async (configId) => {
  try {
    const configsRef = doc(firestore, "examConfiguration", configId);
    const docSnap = await getDoc(configsRef);

    if (!docSnap.exists()) {
      return false;
    }

    return docSnap.data();
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const getAllConfigData = async (userId = "") => {
  try {
    const configsRef = collection(firestore, "examConfiguration");
    const q = query(configsRef, where("userId", "==", userId));
    const snap = await getDocs(q);

    return snap.docs.map((doc) => doc.data()) || [];
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const createPaymentTransactionData = async (configId, data = {}) => {
  try {
    const transactionRef = doc(firestore, "transactions", configId);
    await setDoc(transactionRef, data);

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const getPaymentTransactionData = async (transactionId) => {
  try {
    const transactionsRef = collection(firestore, "transactions");
    const q = query(transactionsRef, where("transactionId", "==", transactionId));
    const snap = await getDocs(q);

    if (snap.empty) throw new Error("Transaction not found");

    return snap.docs[0].data();
  } catch (error) {
    console.error(error);
    return false;
  }
};

//Functions
export const handlePayment = httpsCallable(functions, "handlePayment");
export const handleMultiPayment = httpsCallable(functions, "handleMultiPayment");
export const generateTempBase64PDF = httpsCallable(functions, "generateTempBase64PDF");
export const handleCreateNewMockDocx_next = httpsCallable(functions, "handleCreateNewMockDocx_next");
export const handleCreateNewMockWithTopics_next = httpsCallable(functions, "handleCreateNewMockWithTopics_next");
export const verifyOTP = httpsCallable(functions, "verifyOTP");
