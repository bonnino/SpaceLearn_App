const FLASHCARDS_SHEET_NAME = 'Flashcards'; // Remplace par le nom de ta feuille si nécessaire
const CATEGORIES_SHEET_NAME = 'Categories'; // Nom de ta feuille des catégories
const CONST_BOITES_NAME = 'Boites';
const CONFIG_SHEET_NAME = 'Config' ;

// aigullage des pages
/*
function doGet(e) {
  
  // Loguer les paramètres reçus au début de la fonction
  debug.log('doGet exécuté avec les paramètres:', e.parameter);
    
  let page = e.parameter.mode || "index";
  let html = HtmlService.createTemplateFromFile(page).evaluate();
  let htmlOutput = HtmlService.createHtmlOutput(html);
  htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1');

  //Replace {{NAVBAR}} with the Navbar content
  htmlOutput.setContent(htmlOutput.getContent().replace("{{NAVBAR}}",getNavbar(page)));
  return htmlOutput;
}*/
// aigullage des pages
function doGet(e) {

  // Loguer les paramètres reçus au début de la fonction
  debug.log('doGet exécuté avec les paramètres:', e.parameter);

  let pageName = e.parameter.mode || "index"; // Renommé pour la clarté, mais 'page' marche aussi

  // --- Modifications minimales ici ---
  // 1. Créer l'objet template SANS l'évaluer tout de suite
  const htmlTemplate = HtmlService.createTemplateFromFile(pageName); // Utilisez 'pageName' ici

  // 2. ASSIGNER la variable au template AVANT l'évaluation
  //    Assurez-vous que la variable globale DEBUG_MODE (celle lue depuis la feuille ou hardcodée) est définie.
  htmlTemplate.DEBUG_MODE_CLIENT = typeof DEBUG_MODE !== 'undefined' ? DEBUG_MODE : false; // Assignation de la variable au template

  // 3. ÉVALUER l'objet template MAINTENANT qu'il a la variable.
  //    .evaluate() retourne directement l'objet HtmlOutput.
  const htmlOutput = htmlTemplate.evaluate(); // <-- htmlOutput est MAINTENANT le résultat évalué directement
  // Note : Vous n'avez plus besoin de 'let html = ...' ni 'let htmlOutput = HtmlService.createHtmlOutput(html);'

  // --- Le reste de votre code continue d'utiliser cet objet htmlOutput ---
  htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1');

  //Replace {{NAVBAR}} with the Navbar content
  // Continuez à utiliser htmlOutput.getContent() sur l'objet évalué
  htmlOutput.setContent(htmlOutput.getContent().replace("{{NAVBAR}}",getNavbar(pageName))); // Utilisez 'pageName' ici aussi si vous voulez

  debug.log('Template évalué pour la page', pageName, 'et prêt à être retourné.'); // Optionnel : loguer l'étape

  return htmlOutput;
}


//Create Navigation Bar
function getNavbar(activePage) {
  var scriptURLHome = getScriptURL();
  var scriptURLPage1 = getScriptURL("mode=about");
//  var scriptURLPage2 = getScriptURL("mode=Page2");
//  var scriptURLPage3 = getScriptURL("mode=Page3");

  var navbar = 
    `<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
        <a class="navbar-brand" href="${scriptURLHome}">Flashcards</a>
<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
          <div class="navbar-nav">
            <a class="nav-item nav-link ${activePage === 'index' ? 'active' : ''}" href="${scriptURLHome}">Home</a>
            <a class="nav-item nav-link ${activePage === 'about' ? 'active' : ''}" href="${scriptURLPage1}">About</a>
          </div>
        </div>
        </div>
      </nav>`;
  return navbar;
}


//returns the URL of the Google Apps Script web app
function getScriptURL(qs = null) {
  var url = ScriptApp.getService().getUrl();
  if(qs){
    if (qs.indexOf("?") === -1) {
      qs = "?" + qs;
    }
    url = url + qs;
  }
  return url;
}

//INCLUDE HTML PARTS, EG. JAVASCRIPT, CSS, OTHER HTML FILES
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ---
   Partie de gestion du debug
   --- */
// --- Configuration lue depuis une feuille Google Sheet ---
let DEBUG_MODE = false; // Valeur par défaut en cas d'échec de lecture

try {
  
  const debugFlagCell = 'A1'; // <--- Remplacez par la cellule contenant "oui" ou "non"

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  const debugValue = sheet.getRange(debugFlagCell).getValue();

  // Assigner true si la valeur est "oui" (insensible à la casse)
  if (typeof debugValue === 'string' && debugValue.toLowerCase() === 'oui') {
    DEBUG_MODE = true;
  }

  // Log pour vérifier si la lecture a réussi (ce log s'exécute TOUJOURS au démarrage du script)
  Logger.log('Mode débogage lu depuis la feuille : ' + DEBUG_MODE);

} catch (e) {
  // En cas d'erreur de lecture (feuille non trouvée, cellule vide, etc.)
  Logger.log('AVERTISSEMENT: Impossible de lire le mode débogage depuis la feuille. Utilisation du mode par défaut (' + DEBUG_MODE + '). Erreur: ' + e.message);
  // DEBUG_MODE reste à false ou sa valeur par défaut
}
// Helper pour le débogage côté serveur
const debug = {
  /**
   * Log un message dans Logger.log uniquement si le mode DEBUG est activé.
   * Gère la sérialisation basique des objets pour Logger.log.
   * @param {...*} args Les arguments à logger.
   */
  log: function(...args) {
    // Assurez-vous que la variable DEBUG_MODE est définie et vraie
    if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
      // Logger.log ne gère pas les objets JS de manière aussi jolie que console.log
      // On essaie de convertir les objets en JSON pour un affichage plus clair.
      const logMessage = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return '[Objet non sérialisable]';
          }
        }
        return arg;
      }).join(' '); // Rejoindre les arguments par un espace
      Logger.log("DEBUG SERVER: " + logMessage);
    }
  },

  /**
   * Log une information de debug côté serveur.
   * @param {...*} args Les arguments à logger.
   */
  info: function(...args) {
    if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
       const logMessage = args.map(arg => { /* ... serialization logic ... */ return arg; }).join(' ');
       Logger.log("DEBUG SERVER INFO: " + logMessage);
    }
  },

  /**
   * Log un avertissement de debug côté serveur.
   * @param {...*} args Les arguments à logger.
   */
  warn: function(...args) {
    if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
       const logMessage = args.map(arg => { /* ... serialization logic ... */ return arg; }).join(' ');
       Logger.log("DEBUG SERVER WARNING: " + logMessage);
    }
  }

  // Ajoutez d'autres méthodes si besoin
};
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