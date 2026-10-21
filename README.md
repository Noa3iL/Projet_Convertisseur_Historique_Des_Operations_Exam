
# Analyseur d'historiques d'opérations bancaires (.pdf to .xlsx) 📊

Une application web en Node.js permettant de convertir automatiquement les historiques d'opérations bancaires au format PDF en fichiers structurés Excel (.xlsx).

## 1. Sujet et fonctionnalités

- Interface web sécurisée nécessitant la création d'un compte.
- Upload de relevés bancaires au format PDF.
- Extraction des données (Date, Date valeur, Libellé, Débit, Crédit) via `pdf2json`.
- Génération et téléchargement instantané d'un fichier `.xlsx` via `exceljs`.
- Historisation des conversions dans une base de données.

## 2. Étapes d'installation et de démarrage

1. Cloner le dépôt.
2. Installer les dépendances : `npm install`
3. Créer un fichier `.env` à la racine en s'inspirant de `.env.example`.
4. Démarrer le serveur : `npm start` (ou `node server.js`).
5. Accéder à l'application via `http://localhost:3000`.

## 3. Préparation de la base de données

Aucune action manuelle n'est requise. La base de données SQLite (`database.sqlite`) et ses tables (`users` et `conversions`) sont générées automatiquement au premier lancement du serveur via le fichier `database.js`.

## 4. Procédure de test de la fonctionnalité protégée

1. Aller sur la page d'accueil. L'outil d'extraction est invisible.
2. Utiliser le formulaire pour "Créer mon compte" avec des identifiants fictifs.
3. Se connecter avec ces mêmes identifiants. L'interface d'extraction apparaît.
4. Sélectionner un fichier PDF de relevé bancaire (le fichier `test_releve.pdf` peut être utilisé pour la démonstration) et cliquer sur Convertir.
5. Si un utilisateur non connecté tente d'envoyer une requête POST sur `/upload-pdf`, il recevra une erreur 401 "Accès refusé".

## 5. Limites connues

- L'algorithme de parsing (coordonnées spatiales du PDF) est spécifiquement optimisé pour l'architecture des extraits de compte du **Crédit Agricole**. L'utilisation d'un PDF d'une autre banque pourrait entraîner un décalage des colonnes.
