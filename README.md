# RawPilot 📷

Application de bureau (Windows/macOS) qui automatise ton organisation de shootings :
création de l'arborescence Année / Mois / Session, import des NEF, conversion en JPEG,
tableau de bord de progression, recherche.

## 1. Installer les outils de base (une seule fois)

Tu as dit connaître un peu le dev, donc si tu as déjà Node.js, passe directement à l'étape 2.

1. Installe **Node.js** (version 18 ou plus) : https://nodejs.org (prends la version "LTS")
2. Vérifie l'installation dans un terminal / PowerShell :
   ```
   node -v
   npm -v
   ```

## 2. Installer le projet

Décompresse le dossier `rawpilot`, ouvre un terminal dedans, puis :

```bash
npm install
```

Ça télécharge toutes les dépendances (React, Electron, le moteur de lecture des NEF, etc.).
Ça peut prendre 2-3 minutes la première fois.

## 3. Lancer l'application en mode développement

```bash
npm run dev
```

Une fenêtre RawPilot s'ouvre. Au premier lancement, elle te demande de choisir le
**dossier racine** de tes archives (celui qui contient déjà tes dossiers par année, ou
un dossier vide si tu démarres de zéro).

## 4. Construire un vrai .exe installable

Quand tu es content du résultat et que tu veux une version installable, sans passer par
le terminal à chaque fois :

```bash
npm run dist:win
```

L'installeur Windows (`.exe`) apparaît dans le dossier `release/`. Sur Mac, utilise
`npm run dist` pour un `.dmg`.

## Ton archive existante

Au moment où tu choisis ton dossier racine (au premier lancement), RawPilot **scanne
automatiquement** tout ce dossier pour retrouver tes sessions déjà présentes sur le
disque et les ajouter à son suivi. Rien n'est déplacé, copié ou modifié — l'app se
contente de "lire" ce qui existe déjà.

Pour qu'une session soit reconnue, son dossier doit s'appeler exactement comme le
format que RawPilot utilise :

```
Session 49 - 01-08-2026
```

(le mot "Session", un espace, le numéro, un espace-tiret-espace, puis la date au format
JJ-MM-AAAA). Si tes dossiers existants suivent déjà ce format — ce qui est le cas
d'après ce que tu as décrit — ils seront tous retrouvés automatiquement, peu importe à
quelle profondeur ils se trouvent dans l'arborescence.

Pour chaque session retrouvée, RawPilot compte directement les fichiers déjà présents
dans `.NEF`, `.JPEG` et `.JPEG Retouché`, et détecte si un dossier `Montage Réseaux`
existe. En revanche, les cases "Retouché", "Importé sur téléphone" et "Terminé" ne
peuvent pas être devinées depuis le disque : elles démarrent décochées, à toi de les
cocher une fois pour remettre chaque session à son vrai statut.

Si jamais un dossier de session apparaît sur le disque après coup (ajouté à la main, ou
depuis un autre appareil), le bouton **"⟳ Scanner les dossiers existants"** en bas de la
barre de recherche relance ce scan à tout moment, sans dupliquer les sessions déjà
connues.

## Paramètres (icône ⚙ en haut de la barre latérale)

- **Changer le dossier racine** : si tu déplaces ou renommes ton dossier d'archives,
  choisis simplement son nouvel emplacement ici. RawPilot relance aussitôt un scan pour
  retrouver tes sessions à cet endroit.
- **Vérifier les dossiers manquants** : si après un déplacement certaines sessions ne
  retrouvent pas leur dossier automatiquement (chemin différent, sous-dossier renommé...),
  cet écran te les liste une par une avec un bouton "Localiser..." pour repointer chacune
  vers son nouvel emplacement exact, ou "Retirer du suivi" si le dossier a vraiment
  disparu.
- **Revenir à l'écran de premier démarrage** : rouvre l'écran d'accueil initial pour
  reconfigurer proprement le dossier racine. Aucune session suivie n'est supprimée.

## Retirer une session du suivi

Dans le détail d'une session, le lien discret en bas de page "Retirer cette session du
suivi" l'enlève de la liste de RawPilot — **sans jamais supprimer, déplacer ou modifier
le moindre fichier sur ton disque**. Utile si une session a été créée par erreur ou si tu
ne veux plus la suivre.

## Comment ça marche

- **Création d'un shooting** : tu donnes une date + un numéro de session (proposé
  automatiquement d'après ta dernière session, modifiable). RawPilot crée :
  ```
  [Racine]/2026/Août/Session 49 - 01-08-2026/
      .NEF/
      .JPEG/
      .JPEG Retouché/
      Montage Réseaux/   (si coché)
  ```
- **Import des NEF** : tu sélectionnes tes fichiers `.NEF`, ils sont copiés dans `.NEF`,
  puis RawPilot essaie d'extraire le JPEG intégré à chaque fichier NEF (celui que ton
  appareil enregistre à l'intérieur du RAW) et le place dans `.JPEG`.
- **Suivi de progression** : "Dossiers créés", "NEF importés" et "JPEG créés" se cochent
  tout seuls. "Retouché", "Importé sur téléphone" et "Terminé" sont à cocher manuellement,
  comme demandé.
- **Recherche** : tape un numéro de session, un mois ou une année dans la barre de recherche.
- Toutes tes photos restent sur ton disque. L'app ne fait que les organiser : les données
  de suivi (cases cochées, compteurs) sont stockées dans un petit fichier local
  (`rawpilot-db.json`, dans le dossier de données de l'application).

## ⚠️ Une limite importante à connaître

La conversion NEF → JPEG **n'est pas un vrai développement RAW** (comme le ferait
Lightroom). Elle extrait le JPEG que ton appareil photo a lui-même enregistré à
l'intérieur du fichier NEF au moment de la prise de vue. Concrètement :

- Si ton appareil est réglé pour enregistrer une prévisualisation JPEG pleine résolution
  dans le NEF (souvent le cas par défaut sur les Nikon), le résultat est très proche de ce
  que tu obtiendrais en exportant directement en JPEG depuis l'appareil.
- Si ton appareil n'embarque qu'une petite miniature, le JPEG obtenu sera plus petit /
  moins bon.
- Ce n'est donc pas destiné à remplacer ta retouche dans Lightroom — c'est un JPEG rapide
  pour trier, prévisualiser, ou envoyer un aperçu, exactement comme demandé dans ton
  cahier des charges initial (l'étape "Retouché" reste un import manuel depuis
  Lightroom vers le dossier `.JPEG Retouché`).

Si un jour tu veux un vrai développement RAW automatique (avec réglages d'exposition,
balance des blancs, etc.), il faudrait intégrer un moteur comme RawTherapee ou dcraw en
ligne de commande — possible en V2, mais plus lourd à mettre en place et nécessite de
définir tes propres réglages de développement par défaut.

## Prochaines idées (V2 / V3)

- Miniatures des photos directement dans l'app
- Détection automatique de carte SD branchée
- Vraie conversion RAW (RawTherapee / LibRaw) avec un profil de développement
- Vérification automatique des fichiers manquants
- Export CSV de l'historique des sessions

## Structure du projet

```
rawpilot/
  electron/          → processus principal (création dossiers, import, base de données)
    main.js
    preload.js
    db.js
  src/                → interface React
    App.tsx
    components/
    types.ts
  package.json
```
