const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { extraireDonneesBancaires } = require('./extractor');

const app = express();
const port = 3000;

const uploadDir = path.join(__dirname, 'uploads');
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

const upload = multer({ dest: uploadDir });
app.use(express.static('public'));

app.post('/upload', upload.single('fichier_pdf'), async (req, res) => {
    if (!req.file || req.file.mimetype !== 'application/pdf') {
        return res.status(400).send("Veuillez fournir un fichier PDF valide.");
    }
    const pdfPath = req.file.path;
    const excelName = req.file.originalname.replace('.pdf', '.xlsx');
    const excelPath = path.join(downloadDir, excelName);

    try {
        await extraireDonneesBancaires(pdfPath, excelPath);
        res.download(excelPath, excelName, (err) => {
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
            if (fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
        });
    } catch (error) {
        console.error("Erreur d'extraction :", error);
        res.status(500).send("Erreur lors de la conversion du fichier.");
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    }
});

app.listen(port, () => {
    console.log(`✅ Serveur Node opérationnel sur http://localhost:${port}`);
});