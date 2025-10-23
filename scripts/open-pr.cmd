@echo off
cd /d "%~dp0\.."
gh pr create --base main --head feature-xyz --title "feat(docs): add PNG export + CI exporter workflow" --body-file PR_BODY.md