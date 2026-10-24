# RawPilot 📷

Application de bureau (Windows/macOS) qui automatise ton organisation de shootings :
création de l'arborescence Année / Mois / Session, import des NEF, conversion en JPEG,
tableau de bord de progression, recherche.

## 1. Installer les outils de base (une seule fois)

si tu as déjà Node.js, passe directement à l'étape 2.

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
  pour trier, prévisualiser, ou envoyer un aperçu.
