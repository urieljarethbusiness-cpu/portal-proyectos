@echo off

:: Start the Next.js development server

echo Starting Next.js development server...

:: Change directory to the project root (where this script resides)
cd /d "%~dp0"

:: Run the dev script defined in package.json
npm run dev
