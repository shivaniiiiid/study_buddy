@echo off
echo Pushing StudyBuddy to GitHub...
echo.

REM Check if Git is initialized
if not exist ".git" (
    echo Initializing Git repository...
    "C:\Program Files\Git\cmd\git.exe" init
)

REM Set Git user identity (fixes author issues)
"C:\Program Files\Git\cmd\git.exe" config user.email "shivani@example.com"
"C:\Program Files\Git\cmd\git.exe" config user.name "Shivani"

REM Add all files
echo Adding files to Git...
"C:\Program Files\Git\cmd\git.exe" add .

REM Commit changes
echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "Add AI summarization with multiple providers and instant local summarization"

echo.
echo Repository initialized and changes committed!
echo.
echo Now you need to:
echo 1. Create a repository on GitHub.com
echo 2. Add remote: git remote add origin https://github.com/shivaniiiiid/study_buddy.git
echo 3. Push: git push origin main
echo.
pause
