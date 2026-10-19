const fs = require('fs');
const PDFParser = require("pdf2json");
const ExcelJS = require('exceljs');

async function extraireDonneesBancaires(pdfPath, excelPath) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
        
        pdfParser.on("pdfParser_dataReady", async (pdfData) => {
            try {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Transactions');

                worksheet.columns = [
                    { header: "Date", key: 'dateOp', width: 15 },
                    { header: 'Date valeur', key: 'dateVal', width: 15 },
                    { header: 'Libellé', key: 'libelle', width: 60 },
                    { header: 'Débit euros', key: 'debit', width: 15 },
                    { header: 'Crédit euros', key: 'credit', width: 15 }
                ];

                pdfData.Pages.forEach(page => {
                    let pageTextItems = [];
                    
                    page.Texts.forEach(textNode => {
                        pageTextItems.push({
                            x: textNode.x,
                            y: textNode.y,
                            text: decodeURIComponent(textNode.R[0].T).trim()
                        });
                    });

                    pageTextItems.sort((a, b) => a.y - b.y);
                    const lignesY = [];
                    let ligneActuelleY = [];
                    let yCourant = -1;

                    pageTextItems.forEach(item => {
                        if (yCourant === -1 || Math.abs(item.y - yCourant) < 0.4) {
                            ligneActuelleY.push(item);
                            if (yCourant === -1) yCourant = item.y;
                        } else {
                            lignesY.push(ligneActuelleY);
                            ligneActuelleY = [item];
                            yCourant = item.y;
                        }
                    });
                    if (ligneActuelleY.length > 0) lignesY.push(ligneActuelleY);

                    let libelleFlottant = "";
                    
                    lignesY.forEach(ligne => {
                        ligne.sort((a, b) => a.x - b.x); 
                        if (ligne.length === 0) return;

                        let textComplet = ligne.map(i => i.text).join(' ');
                        textComplet = textComplet.replace(/^(\d{2}\/\d{2}\/\d{4})(\d{2}\/\d{2}\/\d{4})/, '$1 $2');
                        
                        const matchDebut = textComplet.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})/);

                        if (matchDebut) {
                            const dateOp = matchDebut[1];
                            const dateVal = matchDebut[2];
                            
                            const elementsMontants = ligne.filter(item => /^(\d{1,3}(?:[ \u00A0]?\d{3})*,\d{2})$/.test(item.text));

                            if (elementsMontants.length > 0) {
                                const elementMontant = elementsMontants[elementsMontants.length - 1];
                                const montantFormatte = parseFloat(elementMontant.text.replace(/\s/g, '').replace(',', '.'));
                                
                                let libelleLigne = textComplet.substring(21).trim(); 
                                
                                const texteMontantFinal = elementMontant.text;
                                const lastIndex = libelleLigne.lastIndexOf(texteMontantFinal);
                                if (lastIndex !== -1) {
                                    libelleLigne = libelleLigne.substring(0, lastIndex).trim();
                                }

                                let libelleFinal = libelleFlottant ? libelleFlottant + " " + libelleLigne : libelleLigne;
                                if (libelleFinal.trim() === "") libelleFinal = "Opération diverse";

                                let debit = "";
                                let credit = "";
                                
                                const libelleMin = libelleFinal.toLowerCase();
                                if (libelleMin.includes('virement en votre faveur') || 
                                    libelleMin.includes('remboursement') || 
                                    libelleMin.includes('remise') ||
                                    libelleMin.includes('wero')) {
                                    credit = montantFormatte;
                                } else {
                                    debit = montantFormatte;
                                }

                                worksheet.addRow({ 
                                    dateOp: dateOp, 
                                    dateVal: dateVal, 
                                    libelle: libelleFinal, 
                                    debit: debit, 
                                    credit: credit 
                                });
                                
                                libelleFlottant = ""; 
                            }
                        } else {
                            const txtMin = textComplet.toLowerCase();
                            const estEnTete = txtMin.includes('solde') || 
                                              txtMin.includes('liste des opérations') || 
                                              txtMin.includes('téléchargement');
                            const aUnMontant = /([\d\s]+,\d{2})$/.test(textComplet);
                            
                            if (!estEnTete && !aUnMontant) {
                                libelleFlottant = libelleFlottant ? libelleFlottant + " " + textComplet : textComplet;
                            }
                        }
                    });
                });

                worksheet.getRow(1).font = { bold: true };
                
                await workbook.xlsx.writeFile(excelPath);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
        
        pdfParser.loadPDF(pdfPath);
    });
}

module.exports = { extraireDonneesBancaires };