// controllers/expertForm.js
const { firebaseInstances } = require('../config/firebase.js');
const multer = require('multer');

const { admin, db, auth, storage, _initializationError } = firebaseInstances;

// --- Configure multer (remains the same) ---
const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    storage: multer.memoryStorage()
});

// --- Helper function to check Firebase readiness (remains the same) ---
function checkFirebaseReady(res, action = "perform action") {
    if (_initializationError || !admin || !db || !auth || !storage) {
        const missing = [
            !admin && "Admin SDK", !db && "Firestore",
            !auth && "Auth", !storage && "Storage"
        ].filter(Boolean).join(', ');
        const baseMessage = `Firebase Check Failed during "${action}"`;
        const errorMessage = _initializationError
            ? `${baseMessage}: Stored Initialization Error: ${_initializationError.message}`
            : `${baseMessage}: Service(s) Not Ready or Missing: ${missing || 'Unknown service'}`;
        console.error(errorMessage);
        res.status(500).json({ error: `Server configuration error (${action}). Please try again later.` });
        return false;
    }
    return true;
}

// SignUp Controller
exports.registerNutritionist = async (req, res) => {
    // 1. Check Firebase readiness
    if (!checkFirebaseReady(res, "register nutritionist")) {
        return;
    }

    console.log('[Register Nutritionist] Received Request');
    console.log('[Register Nutritionist] Body:', req.body);
    console.log('[Register Nutritionist] Files:', req.files ? {
        professionalCertificate: req.files.professionalCertificate?.[0] ? `${req.files.professionalCertificate[0].originalname} (${req.files.professionalCertificate[0].mimetype}, ${req.files.professionalCertificate[0].size} bytes)` : 'Not provided',
        profileImage: req.files.profileImage?.[0] ? `${req.files.profileImage[0].originalname} (${req.files.profileImage[0].mimetype}, ${req.files.profileImage[0].size} bytes)` : 'Not provided'
    } : 'No files object received');

    try {
        // 2. Destructure and Validate Request Body and Files
        const {
            firstName, lastName, email, password, confirmPassword, phoneNumber,
            yearsOfExperience, // Keep as string from frontend
            specialization, workplace, shortBio, userType
        } = req.body;

        // --- Validation (Keep comprehensive validation) ---
        const requiredFields = [ /* ... keep as before ... */ ];
        // ... keep all validation checks for fields and files ...
        const years = parseInt(yearsOfExperience, 10); // Still parse for validation
        if (isNaN(years) || years < 0 || years > 70) { // Adjusted max years slightly
             return res.status(400).json({ error: "Invalid years of experience (must be a number between 0-70)." });
        }
        // ... other validation rules ...

        // Ensure files exist (keep file validation)
        if (!req.files || !req.files.professionalCertificate || !req.files.professionalCertificate[0]) { /* ... */ }
        const certificate = req.files.professionalCertificate[0];
         if (!req.files || !req.files.profileImage || !req.files.profileImage[0]) { /* ... */ }
        const profileImage = req.files.profileImage[0];
         // ... keep file type/size validation ...

        console.log('[Validation Passed]');
        // --- End Validation ---

        // 3. Create User in Firebase Authentication (remains the same)
        let userRecord;
        try {
          console.log(`[Auth] Attempting to create user for email: ${email}`);
          userRecord = await auth.createUser({ email, password });
          console.log(`[Auth] User created successfully. UID: ${userRecord.uid}`);
        } catch (authError) {
          console.error('[Auth Error] Failed to create user:', authError.code, authError.message);
          return res.status(500).json({ error: "Failed to create user account...", details: authError.message });
        }

        // 4. Upload Files to Firebase Storage (remains the same)
        const bucket = storage.bucket();
        let certificateUrl = '';
        let profileImageUrl = '';
        try {
            console.log(`[Storage] Uploading files for UID: ${userRecord.uid}`);
            // Upload Certificate
            const safeCertificateName = certificate.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            const certificateFileName = `nutritionist_certificates/${userRecord.uid}/${Date.now()}_${safeCertificateName}`;
            const certificateFile = bucket.file(certificateFileName);
            console.log(`[Storage] Saving certificate to: ${certificateFileName}`);
            await certificateFile.save(certificate.buffer, { metadata: { contentType: certificate.mimetype }, public: true });
            certificateUrl = certificateFile.publicUrl();
            console.log(`[Storage] Certificate uploaded successfully: ${certificateUrl}`);

            // Upload Profile Image
            const safeProfileImageName = profileImage.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            const profileImageFileName = `nutritionist_profile_images/${userRecord.uid}/${Date.now()}_${safeProfileImageName}`;
            const profileImageFile = bucket.file(profileImageFileName);
            console.log(`[Storage] Saving profile image to: ${profileImageFileName}`);
            await profileImageFile.save(profileImage.buffer, { metadata: { contentType: profileImage.mimetype }, public: true });
            profileImageUrl = profileImageFile.publicUrl();
            console.log(`[Storage] Profile image uploaded successfully: ${profileImageUrl}`);
        } catch (storageError) {
             // ... handle storage errors, delete user, and return ...
             console.error(`[Storage Error] Failed to upload files for UID: ${userRecord.uid}`, storageError);
             await auth.deleteUser(userRecord.uid).catch(delErr => console.error("Cleanup Error", delErr));
             return res.status(500).json({ error: "User created, but failed to upload required files.", details: storageError.message });
        }

        // 5. Save Additional User Info to Firestore *** (MODIFIED STRUCTURE) ***
        try {
            console.log(`[Firestore] Saving nutritionist details for UID: ${userRecord.uid} with OLD structure`);
            const nutritionistData = {
                firstName,
                lastName,
                email,
                phoneNumber: phoneNumber, // Keep formatted phone number
                // *** Use OLD field names for URLs ***
                professionalCertificate: certificateUrl,
                profileImage: profileImageUrl,
                // *** Use the string directly from req.body for years ***
                yearsOfExperience: yearsOfExperience, // Store as STRING
                specialization,
                workplace,
                shortBio,
                // Keep createdAt for sorting/info
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                userType: userType || "Professional", 
            };

            await db.collection("nutritionists").doc(userRecord.uid).set(nutritionistData);
            console.log(`[Firestore] Nutritionist data saved successfully using OLD structure for UID: ${userRecord.uid}`);

        } catch (firestoreError) {
             // ... handle firestore errors, delete user, and return ...
            console.error(`[Firestore Error] Failed to save data for UID: ${userRecord.uid}`, firestoreError);
            await auth.deleteUser(userRecord.uid).catch(delErr => console.error("Cleanup Error", delErr));
             return res.status(500).json({ error: "User account created and files uploaded, but failed to save details.", details: firestoreError.message });
        }

        // 6. Successful Response (remains the same)
        console.log(`[Success] Registration complete for UID: ${userRecord.uid}`);
        res.status(201).json({
            message: "Nutritionist registration successful!", // Simpler message might be suitable now
            userId: userRecord.uid
        });

    } catch (error) {
        // ... handle unexpected errors ...
        console.error('[Unhandled Registration Error]', error);
        res.status(500).json({ /* ... generic error response ... */ });
    }
};

// Export the Multer middleware (remains the same)
exports.uploadMiddleware = upload.fields([
    { name: 'professionalCertificate', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
]);