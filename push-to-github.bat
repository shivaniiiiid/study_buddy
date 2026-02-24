@echo off
echo Pushing StudyBuddy to GitHub...
echo.

REM Check if Git is initialized
if not exist ".git" (
    echo Initializing Git repository...
    "C:\Program Files\Git\bin\git-bash.exe" -c "cd /c/Users/Shivani/OneDrive/Desktop/studybuddy && git init"
)

REM Add all files
echo Adding files to Git...
"C:\Program Files\Git\bin\git-bash.exe" -c "cd /c/Users/Shivani/OneDrive/Desktop/studybuddy && git add ."

REM Commit changes
echo Committing changes...
"C:\Program Files\Git\bin\git-bash.exe" -c "cd /c/Users/Shivani/OneDrive/Desktop/studybuddy && git commit -m 'Add AI summarization with multiple providers and instant local summarization'"

echo.
echo Repository initialized and changes committed!
echo.
echo Now you need to:
echo 1. Create a repository on GitHub.com
echo 2. Add remote: git remote add origin https://github.com/shivaniiiiid/study_buddy.git
echo 3. Push: git push -u origin main
echo.
pause
