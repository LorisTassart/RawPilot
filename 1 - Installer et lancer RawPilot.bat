@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================================
echo   RawPilot - Premiere installation
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installe sur cet ordinateur.
    echo.
    echo Va sur https://nodejs.org, telecharge la version "LTS",
    echo installe-la, puis relance ce fichier.
    echo.
    pause
    exit /b 1
)

echo Node.js detecte, installation des dependances...
echo (ca peut prendre 2 a 3 minutes la premiere fois)
echo.

call npm install
if errorlevel 1 (
    echo.
    echo [ERREUR] L'installation a echoue.
    echo Copie tout ce message et montre-le a Claude pour qu'il t'aide.
    echo.
    pause
    exit /b 1
)

echo.
echo Installation terminee ! Lancement de RawPilot...
echo.

call npm run dev

echo.
echo RawPilot s'est ferme. Tu peux fermer cette fenetre.
pause
