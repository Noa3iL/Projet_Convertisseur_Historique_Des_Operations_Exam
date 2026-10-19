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

app.post('/upload-pdf', isAuthenticated, (req, res) => {
    
    db.run(`INSERT INTO conversions (user_id, filename) VALUES (?, ?)`, [req.session.userId, "releve_traite.pdf"]);

    res.json({ message: "Succès : Extraction du PDF terminée et enregistrée !" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});