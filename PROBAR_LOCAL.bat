@echo off
setlocal
title Estimador TCH CASUR v2.6.0
cd /d "%~dp0"
echo ============================================================
echo     ESTIMADOR TCH CASUR v2.6.0 - PRUEBA LOCAL
echo ============================================================
echo.
echo No cierres esta ventana mientras probas la aplicacion.
echo.
where node >nul 2>&1
if %errorlevel%==0 (
  start "" cmd /c "timeout /t 1 /nobreak >nul & start http://127.0.0.1:4173/"
  node tools\local-server.mjs
  goto END
)
where py >nul 2>&1
if %errorlevel%==0 (
  start "" cmd /c "timeout /t 1 /nobreak >nul & start http://127.0.0.1:4173/"
  py -m http.server 4173 --bind 127.0.0.1
  goto END
)
where python >nul 2>&1
if %errorlevel%==0 (
  start "" cmd /c "timeout /t 1 /nobreak >nul & start http://127.0.0.1:4173/"
  python -m http.server 4173 --bind 127.0.0.1
  goto END
)
echo.
echo No se encontro Node.js ni Python.
echo Instala uno de los dos y volve a ejecutar este archivo.
pause
:END
