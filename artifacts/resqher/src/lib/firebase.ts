import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCubMmcl1JZyRGMDnBrm-Y7b7rjtCDEkyg",
  authDomain: "resqher-d3d5e.firebaseapp.com",
  databaseURL: "https://resqher-d3d5e-default-rtdb.firebaseio.com",
  projectId: "resqher-d3d5e",
  storageBucket: "resqher-d3d5e.firebasestorage.app",
  messagingSenderId: "643526953836",
  appId: "1:643526953836:web:c5f00d95053bfeb82e0149",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const database = getDatabase(app);

export default app;
