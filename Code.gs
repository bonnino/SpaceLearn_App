const FLASHCARDS_SHEET_NAME = 'Flashcards'; // Remplace par le nom de ta feuille si nécessaire
const CATEGORIES_SHEET_NAME = 'Categories'; // Nom de ta feuille des catégories

const BOITES_NAME = 'Boites';

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


/*
function initData() {
  getBoites() ;
  getFlashcards() ;
}
*/

function getCategories() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const categories = [];
  const idColumnIndex = headers.indexOf('Id');
  const nomColumnIndex = headers.indexOf('Nom');

  if (idColumnIndex === -1 || nomColumnIndex === -1) {
    Logger.log("Les colonnes 'Id' ou 'Nom' n'ont pas été trouvées dans la feuille des catégories.");
    return [];
  }

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    categories.push({
      Id: values[i][idColumnIndex],
      Nom: values[i][nomColumnIndex]
    });
  }
  return categories;
}

function getBoites() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(BOITES_NAME);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  // Récupérer les noms des colonnes à partir de la première ligne
  const headers = values[0];
  const boites = [];

  // Parcourir les lignes de données (en commençant à la deuxième ligne pour éviter les headers)
  for (let i = 1; i < values.length; i++) {
    const boite = {};
    for (let j = 0; j < headers.length; j++) {
      boite[headers[j]] = values[i][j];
    }
    boites.push(boite);
  }
  return boites;
}

function getFlashcardsForBoiteAndCategory(idBoite, idCategorie) {
  Logger.log(`getFlashcardsForBoiteAndCategory appelée avec boite ID: ${idBoite} et catégorie ID: ${idCategorie}`);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(FLASHCARDS_SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const flashcardsForBoiteAndCategory = [];
  const idBoiteColumnIndex = headers.indexOf('Id_Boite');
  const idCategorieColumnIndex = headers.indexOf('Id_Categorie');

  if (idBoiteColumnIndex === -1 || idCategorieColumnIndex === -1) {
    Logger.log("Erreur : Les colonnes 'Id_Boite' ou 'Id_Categorie' n'ont pas été trouvées dans les en-têtes de la feuille des flashcards.");
    return [];
  }

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][idBoiteColumnIndex] === idBoite && values[i][idCategorieColumnIndex] === idCategorie) {
      const flashcard = {};
      flashcard['rowNumber'] = i + 1; // Stocke le numéro de ligne (ajoute 1 car i commence à 1)
      for (let j = 0; j < headers.length; j++) {
        if (headers[j] !== 'Last_Reviewed') { // Ajout de cette condition
          flashcard[headers[j]] = values[i][j];
        }
      }
      flashcardsForBoiteAndCategory.push(flashcard);
    }
  }
  Logger.log("Contenu de flashcardsForBoiteAndCategory : " + JSON.stringify(flashcardsForBoiteAndCategory)); // Affiche le contenu de 'flashcardsForBoiteAndCategory'
  Logger.log(`Nombre de flashcards renvoyées : ${flashcardsForBoiteAndCategory.length}`);

  return flashcardsForBoiteAndCategory;
}

/* 
   --- MISE A JOUR DES STATS DE LA CARTE ---
   Compteur de visualisations
   Date de dernière visualisation
*/
function updateCardStats(rowNumber) {
  Logger.log(`Numéro de ligne ${rowNumber}`);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(FLASHCARDS_SHEET_NAME); // Remplace par le nom réel
  if (!sheet || !rowNumber || typeof rowNumber !== 'number' || rowNumber < 2) {
    Logger.log("Feuille non trouvée ou numéro de ligne invalide.");
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const compteurColumnIndex = headers.indexOf("Nb_Affichages"); // Nom de ta colonne
  const lastReviewedColumnIndex = headers.indexOf("Last_Reviewed");
  if (compteurColumnIndex === -1) {
    Logger.log("Colonne 'Nb_Affichage' non trouvée.");
    return;
  }

  // mise à jour compteur
  const compteurColumnLetter = String.fromCharCode('A'.charCodeAt(0) + compteurColumnIndex); // Convertit l'index en lettre de colonne
  const compteurCell = sheet.getRange(`${compteurColumnLetter}${rowNumber}`);
  const currentValue = compteurCell.getValue();
  compteurCell.setValue(Number(currentValue) + 1);

  // mise à jour date
  const lastReviewedColumnLetter = String.fromCharCode('A'.charCodeAt(0) + lastReviewedColumnIndex);
  const lastReviewedCell = sheet.getRange(`${lastReviewedColumnLetter}${rowNumber}`);
  lastReviewedCell.setValue(new Date()); // Enregistre la date actuelle

  Logger.log(`Compteur 'Nb_Affichage' incrémenté pour la ligne ${rowNumber}.`);
}
