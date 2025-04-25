const FLASHCARDS_SHEET_NAME = 'Flashcards'; // Remplace par le nom de ta feuille si nécessaire
const CATEGORIES_SHEET_NAME = 'Categories'; // Nom de ta feuille des catégories

const CONST_BOITES_NAME = 'Boites';

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ---
      Retourne une ligne de la feuille sous-forme de structure
   --- */

function getFlashcardRowData(sheetName, rowNumber) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log(`Feuille "${sheetName}" non trouvée.`);
    return null; // Ou tu pourrais lancer une erreur
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowValues = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const rowData = {};
  for (let i = 0; i < headers.length; i++) {
    rowData[headers[i]] = rowValues[i];
  }
  return rowData;
}

/*
   ---
   Transfère une structure dans une ligne de la sheet
   --- */
   function setFlashcardRowData(sheetName, rowNumber, data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(`Feuille "${sheetName}" non trouvée.`);
      return false; // Indique que l'écriture a échoué
    }
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = [];
    for (let i = 0; i < headers.length; i++) {
      row.push(data[headers[i]] !== undefined ? data[headers[i]] : ""); // Récupère la valeur ou une chaîne vide si non définie
    }
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
    return true; // Indique que l'écriture a réussi
  } 


/* --- 
   Promotion / retrogradation 
   --- */
function traiterPromotionCarte(rowNumber,maxBoites) {
  Logger.log(`Fonction : traiterPromotionCarte, Paramètres : rowNumber = ${rowNumber}, maxBoites = ${maxBoites}`);
  
  const maLigne = getFlashcardRowData(FLASHCARDS_SHEET_NAME, rowNumber);  
  const currentNbOk = maLigne.Nb_Ok || 0; // Récupère la valeur actuelle ou 0 si vide
  maLigne.Nb_Ok = Number(currentNbOk) + 1;

  // promotion de la boite 
  if (maLigne.Id_Boite < maxBoites) {
    maLigne.Id_Boite++ ;
  }
  Logger.log(`nouvel Id Boite = ${maLigne.Id_Boite}`);
  if (setFlashcardRowData(FLASHCARDS_SHEET_NAME, rowNumber, maLigne)) {
    return `Nombre de 'Je le savais' incrémenté pour la carte (ligne ${rowNumber}).`;
  } else {
    return "Erreur : Impossible de mettre à jour la carte.";
  }
}

  

function traiterRetrogradationCarte(rowNumber) {
  Logger.log(`Fonction : traiterRetrogradationCarte, Paramètres : rowNumber = ${rowNumber}`);
  // Ici, tu vas implémenter la logique pour "rétrograder" la carte
  // Cela pourrait impliquer de modifier une colonne dans ta Google Sheet,
  // par exemple, pour indiquer que la carte doit être vue plus souvent,
  // ou déplacée vers une autre "boîte" de révision plus fréquente.

  // Exemple de retour (facultatif) :
  const maLigne = getFlashcardRowData(FLASHCARDS_SHEET_NAME, rowNumber);  
  const currentNbKo = maLigne.Nb_Ko || 0; // Récupère la valeur actuelle ou 0 si vide
  maLigne.Nb_Ko = Number(currentNbKo) + 1;

  // retrogradation de la boite 
  if (maLigne.Id_Boite > 1) {
    maLigne.Id_Boite-- ;
  }
  Logger.log(`nouvel Id Boite = ${maLigne.Id_Boite}`);
  
  if (setFlashcardRowData(FLASHCARDS_SHEET_NAME, rowNumber, maLigne)) {
    return `Nombre de 'Je ne savais pas' incrémenté pour la carte (ligne ${rowNumber}).`;
  } else {
    return "Erreur : Impossible de mettre à jour la carte.";
  }
}

/* --- 
   Récupère les catégories et les renvoie dans un tableau d'objets
   --- */
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

/* --- 
   Récupère les boîtes et les renvoie dans un tableau d'objets 
   --- */
function getBoites() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONST_BOITES_NAME);
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

/* --- 
   Récupère les flashcards pour une catégorie et une boîte spécifiques et retourne un tableau d'objets
   --- */
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

/* ---
      MISE A JOUR DES STATS DE LA CARTE à partir de son numéro de ligne
      - Compteur de visualisations
      - Date de dernière visualisation
   --- */
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

  Logger.log(`Compteur 'Nb_Affichages' incrémenté pour la ligne ${rowNumber}.`);
}