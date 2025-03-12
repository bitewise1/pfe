import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDXtJYV_D9NWboBjLIsLmKdUs8E4MV7IsQ",
  authDomain: "bitewise-4d93e.firebaseapp.com",
  projectId: "bitewise-4d93e",
  storageBucket: "bitewise-4d93e.appspot.com",  
  messagingSenderId: "770007658347",
  appId: "1:770007658347:web:6eb277a31983b0f2a9e62e",
  measurementId: "G-D67TZBLB7E"
};

// Ensure Firebase is initialized only once
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export default firebaseApp;

