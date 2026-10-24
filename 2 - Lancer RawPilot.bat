@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================================
echo   RawPilot
echo ================================================
echo.

if not exist "node_modules" (
    echo [ERREUR] L'installation n'a pas encore ete faite sur cet ordinateur.
    echo.
    echo Lance d'abord "1 - Installer et lancer RawPilot.bat", une seule fois.
    echo.
    pause
    exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installe sur cet ordinateur.
    echo Va sur https://nodejs.org, telecharge la version "LTS", puis reessaie.
    echo.
    pause
    exit /b 1
)

echo Lancement de RawPilot...
echo.

call npm run dev

echo.
echo RawPilot s'est ferme. Tu peux fermer cette fenetre.
pause
