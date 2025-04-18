const { firebaseInstances } = require('../config/firebase.js');
const multer = require('multer');

const { admin, db, auth, storage, _initializationError } = firebaseInstances;

const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024 
    },
    storage: multer.memoryStorage()
});

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


exports.registerNutritionist = async (req, res) => {
  
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
  
        const {
            firstName, lastName, email, password, confirmPassword, phoneNumber,
            yearsOfExperience, 
            specialization, workplace, shortBio, userType
        } = req.body;

        const requiredFields = [ 'firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phoneNumber', 'yearsOfExperience', 'specialization', 'workplace', 'shortBio' ];
       
        const years = parseInt(yearsOfExperience, 10); 
        if (isNaN(years) || years < 0 || years > 70) { 
             return res.status(400).json({ error: "Invalid years of experience (must be a number between 0-70)." });
        }
        if (!req.files || !req.files.professionalCertificate || !req.files.professionalCertificate[0]) { /* ... */ }
        const certificate = req.files.professionalCertificate[0];
         if (!req.files || !req.files.profileImage || !req.files.profileImage[0]) { /* ... */ }
        const profileImage = req.files.profileImage[0];
        

        console.log('[Validation Passed]');
       
        let userRecord;
        try {
          console.log(`[Auth] Attempting to create user for email: ${email}`);
          userRecord = await auth.createUser({ email, password });
          console.log(`[Auth] User created successfully. UID: ${userRecord.uid}`);
        } catch (authError) {
          console.error('[Auth Error] Failed to create user:', authError.code, authError.message);
          return res.status(500).json({ error: "Failed to create user account...", details: authError.message });
        }

        const bucket = storage.bucket();
        let certificateUrl = '';
        let profileImageUrl = '';
        try {
            console.log(`[Storage] Uploading files for UID: ${userRecord.uid}`);
           
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
           
             console.error(`[Storage Error] Failed to upload files for UID: ${userRecord.uid}`, storageError);
             await auth.deleteUser(userRecord.uid).catch(delErr => console.error("Cleanup Error", delErr));
             return res.status(500).json({ error: "User created, but failed to upload required files.", details: storageError.message });
        }
        try {
            console.log(`[Firestore] Saving nutritionist details for UID: ${userRecord.uid} with OLD structure`);
            const nutritionistData = {
                firstName,
                lastName,
                email,
                phoneNumber: phoneNumber, 
                professionalCertificate: certificateUrl,
                profileImage: profileImageUrl,
             
                yearsOfExperience: yearsOfExperience, 
                specialization,
                workplace,
                shortBio,
               
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                userType: userType || "Professional", 
            };

            await db.collection("nutritionists").doc(userRecord.uid).set(nutritionistData);
            console.log(`[Firestore] Nutritionist data saved successfully using OLD structure for UID: ${userRecord.uid}`);

        } catch (firestoreError) {
           
            console.error(`[Firestore Error] Failed to save data for UID: ${userRecord.uid}`, firestoreError);
            await auth.deleteUser(userRecord.uid).catch(delErr => console.error("Cleanup Error", delErr));
             return res.status(500).json({ error: "User account created and files uploaded, but failed to save details.", details: firestoreError.message });
        }

     
        console.log(`[Success] Registration complete for UID: ${userRecord.uid}`);
        res.status(201).json({
            message: "Nutritionist registration successful!",
            userId: userRecord.uid
        });

    } catch (error) {
       
        console.error('[Unhandled Registration Error]', error);
        res.status(500).json({ error: "An unexpected error occurred during registration.", details: error.message });
    }
};

exports.uploadMiddleware = upload.fields([
    { name: 'professionalCertificate', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
]);