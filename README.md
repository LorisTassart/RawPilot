# RawPilot 📷

Application de bureau (Windows/macOS) qui automatise ton organisation de shootings :
création de l'arborescence Année / Mois / Session, import RAW (Nikon, Canon, Sony,
Fujifilm, Panasonic, Olympus, Pentax, Samsung, DNG — ou aucun RAW du tout) avec
conversion optionnelle en JPEG, tableau de bord de progression personnalisable, recherche.

## 1. Installer les outils de base (une seule fois)

Tu as dit connaître un peu le dev, donc si tu as déjà Node.js, passe directement à l'étape 2.

1. Installe **Node.js** (version 18 ou plus) : https://nodejs.org (prends la version "LTS")
2. Vérifie l'installation dans un terminal / PowerShell :
   ```
   node -v
   npm -v
   ```

## 2. Installer et lancer (Windows) — la méthode simple

Deux fichiers sont fournis à la racine du dossier `rawpilot` pour éviter de taper des
commandes :

- **`1 - Installer et lancer RawPilot.bat`** : à double-cliquer **une seule fois**, la
  toute première fois. Il installe tout ce qu'il faut (2-3 minutes), puis lance
  directement l'application.
- **`2 - Lancer RawPilot.bat`** : à double-cliquer à chaque fois ensuite, pour ouvrir
  RawPilot sans tout réinstaller.

Si Node.js n'est pas encore installé, le premier fichier te l'indique et te redirige vers
https://nodejs.org (prends la version "LTS").

Une fenêtre noire (le terminal) reste ouverte pendant que RawPilot tourne — c'est normal,
ne la ferme pas tant que tu utilises l'application. Si quelque chose ne fonctionne pas,
cette fenêtre affiche le message d'erreur : copie-le et montre-le à Claude.

## 3. Installer et lancer (Mac, ou en ligne de commande)

Décompresse le dossier `rawpilot`, ouvre un terminal dedans, puis :

```bash
npm install
```

Ça télécharge toutes les dépendances (React, Electron, le moteur de lecture des NEF, etc.).
Ça peut prendre 2-3 minutes la première fois.

## 4. Lancer l'application en mode développement (Mac / terminal)

```bash
npm run dev
```

Une fenêtre RawPilot s'ouvre. Au premier lancement, elle te demande de choisir le
**dossier racine** de tes archives (celui qui contient déjà tes dossiers par année, ou
un dossier vide si tu démarres de zéro).

## 5. Construire un vrai .exe installable

Quand tu es content du résultat et que tu veux une version installable, sans passer par
le terminal à chaque fois :

```bash
npm run dist:win
```

Cette commande produit **deux fichiers** dans le dossier `release/` :

- Un installeur classique (`.exe`) — s'installe dans le dossier utilisateur, **aucun
  droit administrateur requis**.
- Une version **portable** (`.exe` autonome, sans installation) — pense à cocher/vérifier
  qu'electron-builder l'a bien généré si tu veux l'utiliser sur une clé USB (voir
  section suivante).

Sur Mac, utilise `npm run dist` pour un `.dmg`.

## 🔌 Version portable (clé USB)

Le fichier `.exe` portable généré ci-dessus peut être copié tel quel sur une clé USB et
lancé sur n'importe quel PC Windows, **sans installation ni droit administrateur**.

Contrairement à l'installeur classique (qui stocke tes sessions suivies, tes réglages et
le journal de diagnostic dans le dossier `AppData` du PC), la version portable range
automatiquement toutes ces données dans un dossier `RawPilotData` créé **juste à côté
du .exe** — donc directement sur la clé. Tout voyage avec toi d'un PC à l'autre : tes
sessions suivies, tes réglages (dont le format RAW choisi et les étapes de suivi
personnalisées).

Une seule chose ne voyage pas automatiquement : **tes photos elles-mêmes**, si ton
dossier racine (`rootPath`) est sur le disque interne d'un PC plutôt que sur la clé.
Si tu changes de PC et que ce dossier n'est plus au même endroit, RawPilot te
proposera de le retrouver ou de le relocaliser (Paramètres → Vérifier les dossiers
manquants / Changer le dossier racine) — comme pour un dossier simplement déplacé ou
renommé.

## Format RAW — pour qui n'utilise pas de Nikon (ou pas de RAW du tout)

RawPilot n'est plus réservé aux photographes Nikon. Dans **Paramètres → Format RAW**,
tu choisis :

- **Aucun format RAW** : RawPilot devient un simple organiseur de photos JPEG (ou autre
  format déjà fini). Le bouton "Importer" copie directement les photos dans le dossier
  JPEG, sans dossier RAW ni conversion.
- **Un ou plusieurs formats RAW** : Nikon (NEF), Canon (CR2/CR3), Sony (ARW), Fujifilm
  (RAF), Panasonic (RW2), Olympus (ORF), Pentax (PEF), Samsung (SRW), ou DNG universel —
  plusieurs à la fois si besoin (par exemple un studio avec des photographes de marques
  différentes).
- **Conversion automatique RAW → JPEG** : à activer ou désactiver indépendamment. Si
  désactivée, RawPilot range juste les fichiers RAW dans leur dossier, et c'est à toi de
  produire les JPEG (Lightroom, etc.).

## Étapes de suivi personnalisables

Le tableau de bord de chaque session propose une liste d'étapes à cocher (par défaut :
Importé Google Drive → Importé sur téléphone → Retouché → Terminé). Dans
**Paramètres → Étapes de suivi**, tu peux ajouter, supprimer, renommer et réordonner ces
étapes comme tu veux — elles s'appliquent à toutes tes sessions. Si tu coches une étape
en sautant une précédente, RawPilot te le signale (confirmation + rappel visuel).

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
dans `.RAW` (ou équivalent, `.NEF` compris pour les archives déjà existantes), `.JPEG` et
`.JPEG Retouché`, et détecte si un dossier `Montage Réseaux`
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

- **Type de session, client et notes** : chaque session peut être marquée "Client" (avec
  un nom) ou "Événement", avec un lieu et des notes libres. Visible et modifiable via
  "✎ modifier".
- **📊 Tableau de bord** (icône en haut de la barre latérale) : nombre de sessions ce
  mois-ci / cette année, total de photos livrées, délai moyen entre la date du shooting
  et "Terminé", répartition par statut et par type.
- **Filtres** : sous la barre de recherche, filtre par statut, par type (Client /
  Événement) et par année.

## 📄 Documents

Nouvel onglet accessible via l'icône 📄 en haut de la barre latérale, pour tes modèles
vierges (contrats, décharges de droit à l'image, etc.) — rangés dans un dossier
"_Documents RawPilot" à la racine de tes archives.

Chaque session a aussi sa propre section "📄 Documents de cette session" (en bas du
détail de la session), pour les documents remplis propres à ce shooting précis (contrat
signé, décharge complétée...) — rangés dans un sous-dossier "Documents" de la session.

Dans les deux cas :
- **+ Ajouter un document** copie le(s) fichier(s) choisi(s) dans le dossier RawPilot
  concerné (l'original sur ton disque n'est pas déplacé).
- **Ouvrir** lance le fichier avec l'application associée par défaut sur ton PC (Word
  pour un .docx, Bloc-notes pour un .txt, etc.).
- **📁** ouvre l'Explorateur de fichiers directement sur ce document.
- **✎** renomme le document, **🗑** le supprime (uniquement la copie dans RawPilot).

## 🖼️ Affiche d'événement

Pour une session catégorisée "📅 Événement", une petite section "Affiche de
l'événement" apparaît en haut du détail de la session, avec un bouton "+ Ajouter une
affiche". L'image choisie (png/jpg/webp) est copiée dans le dossier de la session sous
le nom `affiche.<extension>` — tu peux la changer ou la retirer à tout moment. Rien
n'apparaît pour les sessions "Client" ou sans catégorie.

## 🖥️ Fenêtre propre, sécurité et lancement quotidien

- **Une seule fenêtre** : plus de menu "Fichier / Édition / Affichage…" et plus d'outils de
  développement qui s'ouvrent tout seuls. En mode développement, `Ctrl+Shift+I` (ou `F12`)
  les ouvre à la demande.
- **Barre de titre aux couleurs de l'appli** (Windows) : la bande blanche est remplacée par
  une bande sombre ; réduire / agrandir / fermer restent les boutons natifs. Glisse la bande
  du haut pour déplacer la fenêtre.
- **Sécurité renforcée** : l'appli tourne en mode "sandbox", avec une politique de sécurité
  du contenu stricte (aucun script distant, aucun `eval`) une fois packagée.
- **Pour un usage quotidien sans terminal ni avertissement** : construis l'appli une fois
  (`npm run dist:win`, ou double-clique sur le .bat d'installation puis lance la commande
  dans le dossier), puis utilise le `.exe` généré dans `release/` (installeur ou portable).
  L'avertissement "Insecure Content-Security-Policy" n'existe qu'en mode développement
  (`npm run dev`) et disparaît dans l'appli construite.

## Comment ça marche

- **Création d'un shooting** : tu donnes une date + un numéro de session (proposé
  automatiquement d'après ta dernière session, modifiable). RawPilot crée :
  ```
  [Racine]/2026/Août/Session 49 - 01-08-2026/
      .RAW/                (si un format RAW est activé dans Paramètres)
      .JPEG/
      .JPEG Retouché/
      Montage Réseaux/     (si coché)
  ```
- **Import des photos** : selon ta config, tu sélectionnes tes fichiers RAW (copiés dans
  `.RAW`, puis convertis en JPEG dans `.JPEG` si l'auto-conversion est activée), ou
  directement tes JPEG (copiés dans `.JPEG`) si tu n'utilises pas de format RAW.
- **Suivi de progression** : "Dossiers créés" et "JPEG créés" se cochent tout seuls
  ("RAW importés" aussi si un format RAW est activé). Les étapes suivantes sont celles
  que tu as configurées dans Paramètres → Étapes de suivi (par défaut : Importé Google
  Drive, Importé sur téléphone, Retouché, Terminé).
- **Modifier une session** : le lien "✎ modifier" en haut du détail d'une session permet
  de changer sa date, son numéro, ou d'ajouter/retirer le dossier "Montage Réseaux".
  Si la date ou le numéro changent, le dossier réel sur le disque est renommé et déplacé
  automatiquement pour rester cohérent avec l'arborescence Année / Mois.
- **Recherche** : tape un numéro de session, un mois ou une année dans la barre de recherche.
- Toutes tes photos restent sur ton disque. L'app ne fait que les organiser : les données
  de suivi (cases cochées, compteurs) sont stockées dans un petit fichier local
  (`rawpilot-db.json`, dans le dossier de données de l'application).

## ⚠️ Une limite importante à connaître (mode RAW avec conversion automatique)

La conversion RAW → JPEG **n'est pas un vrai développement RAW** (comme le ferait
Lightroom). Elle extrait le JPEG que ton appareil photo a lui-même enregistré à
l'intérieur du fichier RAW au moment de la prise de vue, quel que soit le fabricant.
Concrètement :

- Si ton appareil est réglé pour enregistrer une prévisualisation JPEG pleine résolution
  dans le RAW (souvent le cas par défaut), le résultat est très proche de ce que tu
  obtiendrais en exportant directement en JPEG depuis l'appareil.
- Si ton appareil n'embarque qu'une petite miniature, le JPEG obtenu sera plus petit /
  moins bon.
- Ce n'est donc pas destiné à remplacer ta retouche dans Lightroom — c'est un JPEG rapide
  pour trier, prévisualiser, ou envoyer un aperçu (l'étape "Retouché" reste un import
  manuel depuis Lightroom vers le dossier `.JPEG Retouché`). Si tu préfères t'en passer
  entièrement, désactive l'auto-conversion dans Paramètres.

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
