@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title MozPN Setup Wizard
mode con: cols=70 lines=40
color 0E

:: ═══════════════════════════════════════════════════════════════
:: LOADING ANIMATION
:: ═══════════════════════════════════════════════════════════════
:LOADING
cls
echo.
echo.
echo.
echo            Loading MozPN Setup Wizard
echo.
echo                    [          ]
ping -n 1 127.0.0.1 >nul
cls
echo.
echo.
echo.
echo            Loading MozPN Setup Wizard
echo.
echo                    [##        ]
ping -n 1 127.0.0.1 >nul
cls
echo.
echo.
echo.
echo            Loading MozPN Setup Wizard
echo.
echo                    [####      ]
ping -n 1 127.0.0.1 >nul
cls
echo.
echo.
echo.
echo            Loading MozPN Setup Wizard
echo.
echo                    [######    ]
ping -n 1 127.0.0.1 >nul
cls
echo.
echo.
echo.
echo            Loading MozPN Setup Wizard
echo.
echo                    [########  ]
ping -n 1 127.0.0.1 >nul
cls
echo.
echo.
echo.
echo            Loading MozPN Setup Wizard
echo.
echo                    [##########]
ping -n 1 127.0.0.1 >nul


:: ═══════════════════════════════════════════════════════════════
:: ANIMATED BANNER
:: ═══════════════════════════════════════════════════════════════
:BANNER
cls
echo.
echo   **
ping -n 1 127.0.0.1 >nul
cls
echo.
echo   ****
ping -n 1 127.0.0.1 >nul
cls
echo.
echo   ******
ping -n 1 127.0.0.1 >nul
cls
echo.
echo   ****************************************************************
echo   *                                                              *
ping -n 1 127.0.0.1 >nul
cls
echo.
echo   ****************************************************************
echo   *                                                              *
echo   *    M   M  OOO  ZZZZZ PPPP  N   N                             *
echo   *    MM MM O   O    Z  P   P NN  N                             *
ping -n 1 127.0.0.1 >nul
cls
echo.
echo   ****************************************************************
echo   *                                                              *
echo   *    M   M  OOO  ZZZZZ PPPP  N   N                             *
echo   *    MM MM O   O    Z  P   P NN  N                             *
echo   *    M M M O   O   Z   PPPP  N N N                             *
echo   *    M   M O   O  Z    P     N  NN                             *
echo   *    M   M  OOO  ZZZZZ P     N   N                             *
echo   *                                                              *
ping -n 1 127.0.0.1 >nul
cls
echo.
echo   ****************************************************************
echo   *                                                              *
echo   *    M   M  OOO  ZZZZZ PPPP  N   N                             *
echo   *    MM MM O   O    Z  P   P NN  N                             *
echo   *    M M M O   O   Z   PPPP  N N N                             *
echo   *    M   M O   O  Z    P     N  NN                             *
echo   *    M   M  OOO  ZZZZZ P     N   N                             *
echo   *                                                              *
echo   *              Setup Wizard v3.0                               *
echo   *                                                              *
echo   *      Cloudflare Worker VPN Panel Installer                   *
echo   *                                                              *
echo   ****************************************************************
echo.
echo.
echo      This wizard will automatically set up your VPN panel!
echo.
echo      Steps:
echo        [1] Check requirements
echo        [2] Login to Cloudflare  
echo        [3] Configure project
echo        [4] Create storage
echo        [5] Deploy!
echo.
echo   ****************************************************************
echo.
echo      Press any key to start...
pause >nul


:: ═══════════════════════════════════════════════════════════════
:: STEP 1: CHECK REQUIREMENTS
:: ═══════════════════════════════════════════════════════════════
:STEP1
cls
echo.
echo   ****************************************************************
echo   *  STEP 1/5  -  Checking Requirements                          *
echo   ****************************************************************
echo.
echo      Scanning system...
echo.

:: Spinner animation for Node check
echo      [ ] Checking Node.js...
ping -n 1 127.0.0.1 >nul
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo      [X] Node.js NOT FOUND!
    echo.
    echo      Download from: https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set "NODE_VER=%%i"
cls
echo.
echo   ****************************************************************
echo   *  STEP 1/5  -  Checking Requirements                          *
echo   ****************************************************************
echo.
echo      Scanning system...
echo.
echo      [OK] Node.js !NODE_VER!

:: npm check
echo      [ ] Checking npm...
ping -n 1 127.0.0.1 >nul
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo      [X] npm NOT FOUND!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set "NPM_VER=%%i"
cls
echo.
echo   ****************************************************************
echo   *  STEP 1/5  -  Checking Requirements                          *
echo   ****************************************************************
echo.
echo      Scanning system...
echo.
echo      [OK] Node.js !NODE_VER!
echo      [OK] npm v!NPM_VER!

:: Wrangler check
echo      [ ] Checking Wrangler...
ping -n 1 127.0.0.1 >nul
call npx wrangler --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo      [..] Installing Wrangler...
    call npm install -g wrangler >nul 2>&1
)
cls
echo.
echo   ****************************************************************
echo   *  STEP 1/5  -  Checking Requirements                          *
echo   ****************************************************************
echo.
echo      Scanning system...
echo.
echo      [OK] Node.js !NODE_VER!
echo      [OK] npm v!NPM_VER!
echo      [OK] Wrangler CLI
echo.
echo   ****************************************************************
echo      All requirements satisfied!
echo   ****************************************************************
echo.
timeout /t 2 >nul


:: ═══════════════════════════════════════════════════════════════
:: STEP 2: CLOUDFLARE LOGIN
:: ═══════════════════════════════════════════════════════════════
:STEP2
cls
echo.
echo   ****************************************************************
echo   *  STEP 2/5  -  Cloudflare Login                               *
echo   ****************************************************************
echo.
echo      Your browser will open for authentication.
echo.
echo      Instructions:
echo        1. Login to your Cloudflare account
echo        2. Click "Allow" to authorize
echo        3. Come back here when done
echo.
echo   ****************************************************************
echo.
echo      Press any key to open browser...
pause >nul

:: Connecting animation
cls
echo.
echo   ****************************************************************
echo   *  STEP 2/5  -  Cloudflare Login                               *
echo   ****************************************************************
echo.
echo      Connecting to Cloudflare  .
ping -n 1 127.0.0.1 >nul
cls
echo.
echo   ****************************************************************
echo   *  STEP 2/5  -  Cloudflare Login                               *
echo   ****************************************************************
echo.
echo      Connecting to Cloudflare  ..
ping -n 1 127.0.0.1 >nul
cls
echo.
echo   ****************************************************************
echo   *  STEP 2/5  -  Cloudflare Login                               *
echo   ****************************************************************
echo.
echo      Connecting to Cloudflare  ...
echo.

call npx wrangler login
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo      [X] Login failed!
    pause
    exit /b 1
)

cls
echo.
echo   ****************************************************************
echo   *  STEP 2/5  -  Cloudflare Login                               *
echo   ****************************************************************
echo.
echo      [OK] Connected to Cloudflare!
echo.
echo   ****************************************************************
timeout /t 2 >nul


:: ═══════════════════════════════════════════════════════════════
:: STEP 3: PROJECT SETTINGS
:: ═══════════════════════════════════════════════════════════════
:STEP3
cls
echo.
echo   ****************************************************************
echo   *  STEP 3/5  -  Project Configuration                          *
echo   ****************************************************************
echo.

:: Worker Name
echo      WORKER NAME
echo      -----------
echo      This is your worker's name on Cloudflare.
echo      (lowercase letters, numbers, and dashes only)
echo.
set "WORKER_NAME=mozpn-worker"
set /p "WORKER_NAME=      Enter name [mozpn-worker]: "
if "!WORKER_NAME!"=="" set "WORKER_NAME=mozpn-worker"

:: تبدیل به حروف کوچک و جایگزینی کاراکترهای غیرمجاز
for /f "tokens=*" %%i in ('powershell -Command "$name = '!WORKER_NAME!'.ToLower() -replace '[^a-z0-9-]', '-' -replace '--+', '-' -replace '^-|-$', ''; if($name -eq '') { 'mozpn-worker' } else { $name }"') do set "WORKER_NAME=%%i"
echo.
echo      [OK] Name: !WORKER_NAME!
echo.
echo   ----------------------------------------------------------------
echo.

:: UUID
echo      UUID (Secret Access Key)
echo      ------------------------
echo      [1] Generate automatically  ** RECOMMENDED **
echo      [2] Enter my own
echo.
set "UUID_CHOICE=1"
set /p "UUID_CHOICE=      Choice [1]: "
if "!UUID_CHOICE!"=="" set "UUID_CHOICE=1"

if "!UUID_CHOICE!"=="1" (
    echo.
    echo      Generating UUID  .
    ping -n 1 127.0.0.1 >nul
    echo      Generating UUID  ..
    ping -n 1 127.0.0.1 >nul
    echo      Generating UUID  ...
    for /f "tokens=*" %%i in ('powershell -Command "[guid]::NewGuid().ToString().ToLower()"') do set "UUID=%%i"
    echo.
    echo      [OK] UUID: !UUID!
) else (
    set /p "UUID=      Enter UUID: "
    echo      [OK] UUID set!
)
echo.
echo   ----------------------------------------------------------------
echo.

:: Trojan Password
echo      TROJAN PASSWORD
echo      ---------------
echo      [1] Use UUID as password  ** RECOMMENDED **
echo      [2] Generate random password
echo      [3] Enter my own
echo      [4] Skip Trojan
echo.
set "TP_CHOICE=1"
set /p "TP_CHOICE=      Choice [1]: "
if "!TP_CHOICE!"=="" set "TP_CHOICE=1"

set "TROJAN_PASS="
if "!TP_CHOICE!"=="2" (
    for /f "tokens=*" %%i in ('powershell -Command "-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})"') do set "TROJAN_PASS=%%i"
    echo      [OK] Password: !TROJAN_PASS!
)
if "!TP_CHOICE!"=="3" (
    set /p "TROJAN_PASS=      Enter password: "
    echo      [OK] Password set!
)
if "!TP_CHOICE!"=="4" (
    echo      [--] Trojan skipped
)
if "!TP_CHOICE!"=="1" (
    echo      [OK] Will use UUID
)
echo.
echo   ----------------------------------------------------------------
echo.

:: KV Storage
echo      KV STORAGE (Save Settings)
echo      --------------------------
echo      [1] Create new  ** RECOMMENDED **
echo      [2] Use existing ID
echo      [3] Skip (settings won't save)
echo.
set "KV_CHOICE=1"
set /p "KV_CHOICE=      Choice [1]: "
if "!KV_CHOICE!"=="" set "KV_CHOICE=1"

set "KV_ID="
if "!KV_CHOICE!"=="2" (
    set /p "KV_ID=      Enter KV ID: "
    echo      [OK] KV ID set!
)
if "!KV_CHOICE!"=="3" (
    echo      [--] KV skipped
)
if "!KV_CHOICE!"=="1" (
    echo      [OK] Will create new KV
)
echo.
echo   ****************************************************************
timeout /t 1 >nul


:: ═══════════════════════════════════════════════════════════════
:: STEP 4: SETUP
:: ═══════════════════════════════════════════════════════════════
:STEP4
cls
echo.
echo   ****************************************************************
echo   *  STEP 4/5  -  Setting Up                                     *
echo   ****************************************************************
echo.

:: Install deps with animation
echo      Installing dependencies  .
ping -n 1 127.0.0.1 >nul
echo      Installing dependencies  ..
ping -n 1 127.0.0.1 >nul
echo      Installing dependencies  ...
if exist "package.json" (
    call npm install >nul 2>&1
    echo      [OK] Dependencies installed!
) else (
    echo      [--] No package.json
)
echo.

:: Obfuscate code
echo      Obfuscating code  .
ping -n 1 127.0.0.1 >nul
echo      Obfuscating code  ..
ping -n 1 127.0.0.1 >nul
echo      Obfuscating code  ...
call node obfuscate.cjs >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo      [X] Obfuscation failed!
    echo      Continuing with source code...
    set "USE_OBFUSCATED=0"
) else (
    echo      [OK] Code obfuscated!
    set "USE_OBFUSCATED=1"
)
echo.

:: Create KV
if "!KV_CHOICE!"=="1" (
    echo      Creating KV storage  .
    ping -n 1 127.0.0.1 >nul
    echo      Creating KV storage  ..
    ping -n 1 127.0.0.1 >nul
    echo      Creating KV storage  ...
    echo.
    
    :: اسم KV داینامیک بر اساس اسم worker + رندوم
    for /f "tokens=*" %%i in ('powershell -Command "Get-Random -Minimum 1000 -Maximum 9999"') do set "RAND=%%i"
    set "KV_NAME=!WORKER_NAME!-kv-!RAND!"
    
    echo      Creating new KV namespace "!KV_NAME!"...
    for /f "tokens=*" %%i in ('npx wrangler kv namespace create "!KV_NAME!" 2^>^&1') do (
        echo      %%i
        echo %%i | findstr /C:"id = " >nul && (
            for /f "tokens=3 delims= " %%j in ("%%i") do set "KV_ID=%%~j"
        )
    )
    
    if "!KV_ID!"=="" (
        echo.
        echo      [!] Could not auto-detect KV ID
        echo      Run: npx wrangler kv namespace list
        set /p "KV_ID=      Enter KV ID manually: "
    )
    echo.
    echo      [OK] KV ID: !KV_ID!
)
echo.

:: Create config with animation
echo      Creating config file  .
ping -n 1 127.0.0.1 >nul
echo      Creating config file  ..
ping -n 1 127.0.0.1 >nul
echo      Creating config file  ...

:: Use obfuscated file if available
if "!USE_OBFUSCATED!"=="1" (
    set "MAIN_FILE=dist/MozPN-obfuscated.js"
) else (
    set "MAIN_FILE=src/worker.js"
)

(
echo name = "!WORKER_NAME!"
echo main = "!MAIN_FILE!"
echo compatibility_date = "2024-01-01"
echo compatibility_flags = ["nodejs_compat"]
echo.
echo [vars]
echo u = "!UUID!"
) > wrangler.toml

if not "!TROJAN_PASS!"=="" (
    echo tp = "!TROJAN_PASS!" >> wrangler.toml
)

if not "!KV_ID!"=="" (
    echo. >> wrangler.toml
    echo [[kv_namespaces]] >> wrangler.toml
    echo binding = "C" >> wrangler.toml
    echo id = "!KV_ID!" >> wrangler.toml
)

echo      [OK] wrangler.toml created!
echo.
echo   ****************************************************************
timeout /t 2 >nul


:: ═══════════════════════════════════════════════════════════════
:: STEP 5: DEPLOY
:: ═══════════════════════════════════════════════════════════════
:STEP5
cls
echo.
echo   ****************************************************************
echo   *  STEP 5/5  -  Deploy to Cloudflare                           *
echo   ****************************************************************
echo.
echo      Ready to deploy your VPN panel!
echo.
echo      [Y] Deploy now  ** RECOMMENDED **
echo      [N] Skip - deploy later
echo.
set "DO_DEPLOY=Y"
set /p "DO_DEPLOY=      Deploy? [Y]: "
if /i "!DO_DEPLOY!"=="n" goto :SKIP_DEPLOY

:: Deploy animation
cls
echo.
echo   ****************************************************************
echo   *  STEP 5/5  -  Deploying...                                   *
echo   ****************************************************************
echo.
echo      Uploading to Cloudflare  [          ]
ping -n 1 127.0.0.1 >nul
cls
echo.
echo   ****************************************************************
echo   *  STEP 5/5  -  Deploying...                                   *
echo   ****************************************************************
echo.
echo      Uploading to Cloudflare  [##        ]
ping -n 1 127.0.0.1 >nul
cls
echo.
echo   ****************************************************************
echo   *  STEP 5/5  -  Deploying...                                   *
echo   ****************************************************************
echo.
echo      Uploading to Cloudflare  [####      ]
ping -n 1 127.0.0.1 >nul
cls
echo.
echo   ****************************************************************
echo   *  STEP 5/5  -  Deploying...                                   *
echo   ****************************************************************
echo.
echo      Uploading to Cloudflare  [######    ]
echo.
echo      Please wait...
echo.

set "WORKER_URL="
for /f "tokens=*" %%i in ('npx wrangler deploy 2^>^&1') do (
    echo      %%i
    echo %%i | findstr /C:"https://" >nul && set "WORKER_URL=%%i"
)

for /f "tokens=2 delims= " %%i in ("!WORKER_URL!") do set "WORKER_URL=%%i"
echo.
goto :RESULT

:SKIP_DEPLOY
echo      [--] Skipped. Run "npx wrangler deploy" later.
set "WORKER_URL=https://!WORKER_NAME!.YOUR-SUBDOMAIN.workers.dev"


:: ═══════════════════════════════════════════════════════════════
:: SUCCESS ANIMATION
:: ═══════════════════════════════════════════════════════════════
:RESULT
cls
echo.
echo      *
ping -n 1 127.0.0.1 >nul
cls
echo.
echo      * *
ping -n 1 127.0.0.1 >nul
cls
echo.
echo      * * *
ping -n 1 127.0.0.1 >nul
cls
echo.
echo      * * * SUCCESS! * * *
ping -n 1 127.0.0.1 >nul

cls
echo.
echo   ****************************************************************
echo   *                                                              *
echo   *                                                              *
echo   *              SETUP COMPLETE!                                 *
echo   *                                                              *
echo   *                                                              *
echo   ****************************************************************
echo.
echo.
echo      YOUR PROJECT INFO
echo      =================
echo.
echo      Worker Name:  !WORKER_NAME!
echo      UUID:         !UUID!
if not "!TROJAN_PASS!"=="" echo      Trojan Pass:  !TROJAN_PASS!
if not "!KV_ID!"=="" echo      KV ID:        !KV_ID!
echo.
echo.

set "PANEL_URL=!WORKER_URL!/!UUID!"
set "SUB_URL=!WORKER_URL!/!UUID!/sub"

echo      YOUR LINKS
echo      ==========
echo.
echo      Panel URL:
echo      !PANEL_URL!
echo.
echo      Subscription URL:
echo      !SUB_URL!
echo.
echo.

:: Save to file
(
echo ========================================
echo MozPN Installation Info
echo %date% %time%
echo ========================================
echo.
echo Worker: !WORKER_NAME!
echo UUID: !UUID!
echo Trojan: !TROJAN_PASS!
echo KV ID: !KV_ID!
echo.
echo Panel: !PANEL_URL!
echo Subscription: !SUB_URL!
echo ========================================
) > MozPN-Info.txt

echo      [OK] Saved to MozPN-Info.txt
echo.
echo   ****************************************************************
echo      NEXT STEPS:
echo      1. Open Panel URL in browser
echo      2. Configure your settings
echo      3. Copy Subscription URL to VPN client
echo   ****************************************************************
echo.
set /p "OPEN=      Open panel now? [Y/n]: "
if /i not "!OPEN!"=="n" start "" "!PANEL_URL!"
echo.
echo      Thank you for using MozPN!
echo.
echo      Press any key to exit...
pause >nul
exit /b 0
