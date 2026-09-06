@echo off
cd /d "%~dp0"
echo Updating Dilva...
powershell -NoProfile -Command "Expand-Archive -Path '_update\dilva-patch.zip' -DestinationPath '.' -Force"
if errorlevel 1 (
  echo.
  echo Something went wrong unpacking the update.
  pause
  exit /b 1
)
rd /s /q "_update"
echo.
echo Files updated. Refreshing the language list in your database...
call npm run db:seed
echo.
echo Done! Now just run: npm run dev
echo (and open a fresh browser tab to see the changes)
pause