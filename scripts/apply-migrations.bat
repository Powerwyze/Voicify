@echo off
echo Running Supabase migrations...
echo.

REM Read the database URL from .env.local
for /f "tokens=2 delims==" %%a in ('findstr "DATABASE_URL" .env.local') do set DB_URL=%%a

if "%DB_URL%"=="" (
    echo Error: DATABASE_URL not found in .env.local
    echo.
    echo Please add your Supabase connection string:
    echo DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
    pause
    exit /b 1
)

echo Applying migration 005: Add venue background image column...
psql "%DB_URL%" -f supabase\migrations\005_add_venue_background_image.sql
if %errorlevel% neq 0 (
    echo Migration 005 failed, but continuing...
)

echo.
echo Applying migration 006: Setup venue images storage...
psql "%DB_URL%" -f supabase\migrations\006_setup_venue_images_storage.sql
if %errorlevel% neq 0 (
    echo Migration 006 failed, but continuing...
)

echo.
echo ✅ Migrations completed!
pause
