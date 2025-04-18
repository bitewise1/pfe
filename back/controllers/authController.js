const { firebaseInstances } = require('../config/firebase');
const admin = firebaseInstances.admin; // Admin SDK (for token verification and auth)
const db = firebaseInstances.db;       // Firestore instance
const FieldValue = admin.firestore.FieldValue; // For serverTimestamp, etc.

function checkAuthFirebaseInitialized(res, checkDb = true) {
  let missing = [];
  if (!admin) missing.push("Admin SDK");
  if (checkDb && !db) missing.push("DB");

  if (missing.length > 0) {
    console.error(`FATAL: Firebase service(s) not initialized: ${missing.join(', ')}`);
    res.status(500).json({ error: "Server configuration error (Auth Init)." });
    return false;
  }
  return true;
}

const login = async (req, res) => {
  if (!checkAuthFirebaseInitialized(res, true)) return;

  try {
    // 1. Retrieve token from Authorization header.
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("Login failed: No/Invalid Bearer token in header.");
      return res.status(401).json({ error: 'Token requis (Header)' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      console.log("Login failed: Empty token.");
      return res.status(401).json({ error: "Token requis (Empty)" });
    }

    // 2. Verify the token using the Admin SDK.
    console.log("Verifying ID Token with Admin SDK...");
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log(`Token verified successfully for UID: ${uid}`);

    // 3. Attempt to fetch the user document from the "users" collection.
    let userRef = db.collection("users").doc(uid);
    let userSnapshot = await userRef.get();

    // 4. If not found in "users", query the "nutritionists" collection.
    if (!userSnapshot.exists) {
      console.warn(`User document not found in "users" for UID: ${uid}. Checking "nutritionists"...`);
      userRef = db.collection("nutritionists").doc(uid);
      userSnapshot = await userRef.get();
      if (!userSnapshot.exists) {
        console.error(`User not found in either collection for UID: ${uid}`);
        return res.status(404).json({ error: 'User not found.' });
      }
    }

    // 5. Return the user data (including its userType) in the response.
    const userData = userSnapshot.data();
    console.log("User data fetched. Sending success response.");
    res.status(200).json({ message: "Connexion réussie", user: userData });
  
  } catch (error) {
    console.error("Login error:", error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: "Token expiré. Veuillez vous reconnecter." });
    } else if (error.code === 'auth/argument-error' ||
               (error.code && error.code.includes('auth/invalid-id-token'))) {
      return res.status(401).json({ error: "Token invalide." });
    }
    res.status(500).json({ error: error.message || "Erreur interne du serveur lors de la connexion." });
  }
};


const register = async (req, res) => {
  if (!checkAuthFirebaseInitialized(res, true)) return;
  
  try {
    const { email, password, userType } = req.body;
    if (!email || !password || !userType) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUserQuery = db.collection("users").where("email", "==", email);
    const existingUserSnapshot = await existingUserQuery.get();
    if (!existingUserSnapshot.empty) {
      console.warn(`Registration failed: Email ${email} already exists in Firestore.`);
      return res.status(409).json({ error: "Email already associated with an account." });
    }

    // Create the user in Firebase Auth.
    console.log(`Creating auth user for ${email}`);
    const userRecord = await admin.auth().createUser({ email, password });
    console.log(`Auth user created successfully: ${userRecord.uid}`);

    // Create a document for a Personal user in the "users" collection.
    await db.collection("users").doc(userRecord.uid).set({
      email,
      uid: userRecord.uid,
      userType,
      createdAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: "User sign up successfully", uid: userRecord.uid });
    
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: "Email already registered." });
    } else if (error.code === 'auth/invalid-password') {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    res.status(500).json({ error: error.message || "Failed to register user." });
  }
};

const socialAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "idToken is required." });

    // Verify the token with the Admin SDK.
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Attempt to fetch the user from either collection.
    let userRef = db.collection("users").doc(uid);
    let userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      userRef = db.collection("nutritionists").doc(uid);
      userSnapshot = await userRef.get();
      if (!userSnapshot.exists) {
        return res.status(404).json({ error: "User not found." });
      }
    }
    const userData = userSnapshot.data();
    res.status(200).json({ message: "Social login successful", user: userData });
    
  } catch (error) {
    console.error("Social auth error:", error);
    res.status(500).json({ error: error.message || "Social authentication failed." });
  }
};

module.exports = { login, register, socialAuth };
