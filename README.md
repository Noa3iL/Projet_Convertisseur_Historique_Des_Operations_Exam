
# Analyseur .pdf to .xlsx 📊

Une application web locale en Node.js permettant de convertir automatiquement les relevés de compte bancaire au format PDF (spécifiquement optimisé pour le Crédit Agricole) en fichiers structurés Excel (.xlsx).

## 🎯 Objectif du projet

L'extraction de données depuis des relevés bancaires PDF est souvent complexe car les banques génèrent des PDF "plats" (sans délimiteurs de colonnes et avec des sauts de ligne arbitraires).
Cet outil résout ce problème en utilisant une approche hybride :

1. **Analyse des coordonnées (X, Y)** de chaque mot pour reconstituer les lignes physiques.
2. **Buffer de mémoire flottante** pour réassembler les transactions écrites sur plusieurs lignes (ex: virements WERO).
3. **Tri spatial et sémantique** pour classer intelligemment les montants dans les colonnes Débit ou Crédit.

## 🚀 Fonctionnalités

* **Respect de la vie privée (Local-first) :** Le traitement du PDF se fait entièrement en local via un serveur Express. Aucune donnée financière ne transite sur internet.
* **Extraction intelligente :** Reconstitution des libellés tronqués et séparation automatique des dates collées.
* **Formatage Excel natif :** Génération d'un fichier `.xlsx` propre avec 5 colonnes prêtes à être exploitées (Date, Date valeur, Libellé, Débit euros, Crédit euros).

## 🛠️ Technologies utilisées

* **Backend :** Node.js, Express
* **Middleware :** Multer (gestion de l'upload des fichiers)
* **Traitement PDF :** pdf2json (extraction des données brutes et des coordonnées)
* **Génération Excel :** ExcelJS

## 📦 Installation et Lancement

1. Cloner le dépôt :
   ```bash
   git clone [https://github.com/votre-nom-utilisateur/analyseur-pdf-xlsx.git](https://github.com/votre-nom-utilisateur/analyseur-pdf-xlsx.git)
   ```
