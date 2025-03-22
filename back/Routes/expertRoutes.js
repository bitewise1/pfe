const express = require ('express');
const router = express.Router();
const expertForm = require ('../controllers/expertForm');
const multer = require('multer');
const path = require('path');


// Configurer le stockage de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Définir le dossier où stocker les fichiers
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    // Définir un nom de fichier unique
    cb(null, Date.now() + path.extname(file.originalname));  // Utilisation du timestamp + extension du fichier
  }
});


// Créer l'instance de multer avec la configuration de stockage
const upload = multer({ storage });

//Route de sign up
router.post('/register', upload.fields([
  { name: 'professionalCertificate', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 }
]), expertForm.registerNutritionist); 

module.exports = router;

