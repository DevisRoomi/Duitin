@echo off
title Duitin - Personal Finance Tracker
echo ============================================================
echo   Menjalankan Duitin (Rust + React) di Komputer Lokal
echo ============================================================
echo.

set "PATH=C:\Users\Lenovo\.cargo\bin;C:\Users\Lenovo\scoop\apps\mingw\current\bin;%PATH%"

echo [1/2] Menjalankan Backend Rust (Port 8080)...
start "Duitin Backend (Port 8080)" cmd /k "cd /d %~dp0backend && set PATH=C:\Users\Lenovo\.cargo\bin;C:\Users\Lenovo\scoop\apps\mingw\current\bin;%%PATH%% && cargo run"

echo [2/2] Menjalankan Frontend React Vite (Port 5173)...
start "Duitin Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Menunggu server siap...
timeout /t 3 >nul

echo Membuka aplikasi Duitin di peramban...
start http://localhost:5173

echo.
echo ============================================================
echo   Aplikasi Duitin berhasil dijalankan!
echo   - Frontend : http://localhost:5173
echo   - Backend  : http://127.0.0.1:8080
echo ============================================================
echo Tekan sembarang tombol untuk menutup jendela bantuan ini.
pause >nul
