// Envoi d'emails
const nodemailer = require('nodemailer'); 
require("dotenv").config();

// Configuration de Nodemailer(transporteur pour l'envoi des e-mails)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.Email_user,
        pass: process.env.Email_pass,
    },
});

module.exports = transporter;
