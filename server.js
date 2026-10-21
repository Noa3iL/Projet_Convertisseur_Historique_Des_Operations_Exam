const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.use(session({
    secret: process.env.SESSION_SECRET || 'un_secret_par_defaut_très_long',
    resave: false,
    saveUninitialized: false
}));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
            if (err) {
                return res.status(400).json({ error: "Ce nom d'utilisateur existe déjà." });
            }
            res.status(201).json({ message: "Utilisateur créé avec succès !" });
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'inscription." });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Identifiants incorrects." });
        }

        req.session.userId = user.id;
        res.json({ message: "Connecté avec succès !" });
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: "Déconnecté." });
});

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.status(401).json({ error: "Accès refusé. Veuillez vous connecter pour convertir un PDF." });
};

app.post('/upload-pdf', isAuthenticated, upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier n'a été envoyé." });
    }

    db.run(`INSERT INTO conversions (user_id, filename) VALUES (?, ?)`, [req.session.userId, req.file.originalname]);

    try {
        const cheminFichierExcel = __dirname + '/resultat.xlsx';

        await extraireDonneesBancaires(req.file.path, cheminFichierExcel); 

        res.download(cheminFichierExcel, 'Releve_Converti.xlsx', (err) => {
            if (err) {
                console.error("Erreur lors de l'envoi du fichier au navigateur :", err);
            }
        });
    } catch (error) {
        console.error("Erreur de conversion :", error);
        res.status(500).send("Une erreur est survenue pendant la conversion.");
    }
});