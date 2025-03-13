const { admin, db } = require("../config/firebase");
const { MODES } = require("../config/constants");

const selectMode = async (req, res) => {
    try {
        const { userId, selectedMode } = req.body;
        if (!userId || !selectedMode) return res.status(400).json({ error: "Mode requis" });

        if (!MODES.includes(selectedMode)) {
            return res.status(400).json({ error: "Mode invalide" });
        }

        await db.collection("users").doc(userId).update({ mode: selectedMode });
        res.status(200).json({ message: "Mode sélectionné", mode: selectedMode });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const logout = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "userId est requis" });

        await db.collection("logoutlogs").doc().set({
            userId,
            loggedOutAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// add name and lastname
const updateProfile = async (req, res) => {
    try {
        const { uid, firstName, lastName, userType } = req.body;

        console.log("Received data:", { uid, firstName, lastName, userType });

        if (!uid || !firstName || !lastName || !userType) {
            console.error("Missing fields:", { uid, firstName, lastName, userType });
            return res.status(400).json({ error: "All fields are required (uid, firstName, lastName, userType)" });
        }

        const userRef = db.collection("users").doc(uid);

        console.log(` Updating user: ${uid} in Firestore...`);

        await userRef.update({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            userType: userType.trim(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`User ${uid} updated successfully!`);
        res.status(200).json({ message: "Profile updated successfully" });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};




module.exports = { selectMode, logout, updateProfile};
