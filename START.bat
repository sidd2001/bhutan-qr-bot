@echo off
title Bhutan QR Bot - Setup and Run
color 0B
setlocal EnableDelayedExpansion

echo.
echo ========================================================
echo    BHUTAN QR BOT - FULL SETUP AND RUN
echo ========================================================
echo.

REM ── Step 1: Check Node.js ───────────────────────────────
echo [Step 1 of 4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Please install Node.js first:
    echo  1. Go to https://nodejs.org
    echo  2. Download the LTS version
    echo  3. Run the installer - keep "Add to PATH" ticked
    echo  4. Restart this script after install
    echo.
    start https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo  Node.js OK: %%v
echo.

REM ── Step 2: Check .env file ─────────────────────────────
echo [Step 2 of 4] Checking config file...
if not exist ".env" (
    echo.
    echo  First-time setup - creating .env file...
    echo.
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
    ) else (
        (
            echo BOT_TOKEN=paste_your_bot_token_here
            echo ADMIN_ID=your_telegram_id_here
            echo PRICE_INR=99
            echo UPI_ID=yourname@okhdfcbank
            echo PAYEE_NAME=Bhutan QR Bot
        ) > .env
    )
    echo.
    echo  Opening .env in Notepad. Please fill in:
    echo    1. BOT_TOKEN - get from @BotFather on Telegram
    echo    2. ADMIN_ID  - get from @userinfobot on Telegram
    echo    3. UPI_ID    - your UPI ID e.g. 9876543210@okhdfcbank
    echo.
    echo  Save the file and close Notepad to continue...
    notepad .env
)

REM Quick validate .env
findstr /C:"paste_your_bot_token" .env >nul 2>&1
if not errorlevel 1 (
    echo.
    echo  ERROR: You have not filled in BOT_TOKEN yet!
    echo  Opening .env - please paste your real token from @BotFather
    echo.
    notepad .env
    pause
    exit /b 1
)
echo  Config OK
echo.

REM ── Step 3: Install packages ────────────────────────────
echo [Step 3 of 4] Installing packages...
if not exist "node_modules" (
    echo  First run - installing dependencies ^(takes 3-5 min^)...
    echo  This includes Chrome for browser automation - be patient.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo  ERROR during npm install. Check your internet.
        pause
        exit /b 1
    )
) else (
    echo  Already installed - skipping
)
echo.

REM ── Step 4: Run the bot ─────────────────────────────────
echo [Step 4 of 4] Starting bot...
echo.
echo ========================================================
echo    BOT IS RUNNING - DO NOT CLOSE THIS WINDOW
echo    Press Ctrl+C to stop
echo ========================================================
echo.

call npm start

echo.
echo Bot stopped. Press any key to close.
pause >nul
