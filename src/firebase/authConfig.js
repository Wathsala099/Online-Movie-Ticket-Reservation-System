import './firebaseConfig';
import { getAuth,GoogleAuthProvider } from "firebase/auth";

export const auth = getAuth();
export const googleAuth = new GoogleAuthProvider();