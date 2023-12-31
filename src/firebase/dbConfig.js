import './firebaseConfig';
import { getStorage } from '@firebase/storage';
import { getFirestore } from "firebase/firestore";

export const storage = getStorage();
export const db = getFirestore();