MAINTAINER_APPLY.md

Purpose
-------
This file contains exact, copy-paste commands a maintainer (someone with repository push rights) can run to apply the delivered patch (the `appmat-changes.zip` you received from the contributor) into a new branch and open a PR.

Safety notes
------------
- Work in a fresh clone or a new local branch to avoid overwriting other work.
- Review the files after extraction before committing.
- The ZIP excludes `.git` and large folders, but double-check for anything sensitive.

Suggested branch name
---------------------
Use: e2e/playwright-reservations-fix

Windows (PowerShell) apply commands
----------------------------------
# in a machine with a fresh clone of the repo
cd C:\path\to\repo-clone
# create topic branch from default branch (adjust default branch name if not 'main')
git fetch origin
git checkout -b e2e/playwright-reservations-fix origin/main

# extract the uploaded zip (adjust path to the uploaded file)
Expand-Archive -Path 'C:\path\to\appmat-changes.zip' -DestinationPath 'C:\tmp\appmat-changes' -Force

# copy files into the repo root (this overwrites files with the same names)
# Review before committing if you want: inspect C:\tmp\appmat-changes
Copy-Item -Path 'C:\tmp\appmat-changes\*' -Destination (Get-Location) -Recurse -Force

# add, commit and push
git add -A
git commit -m "Apply patch: add e2e/playwright-reservations-fix changes"
git push --set-upstream origin e2e/playwright-reservations-fix

# Create PR (interactive via gh) or open in web UI
gh pr create --fill
# or open compare URL:
# https://github.com/<owner>/<repo>/compare/main...e2e/playwright-reservations-fix?expand=1

Unix / macOS (bash) apply commands
---------------------------------
# in a fresh clone
cd /path/to/repo-clone
git fetch origin
git checkout -b e2e/playwright-reservations-fix origin/main

# extract zip
unzip /path/to/appmat-changes.zip -d /tmp/appmat-changes

# copy
cp -R /tmp/appmat-changes/* .

# add/commit/push
git add -A
git commit -m "Apply patch: add e2e/playwright-reservations-fix changes"
git push --set-upstream origin e2e/playwright-reservations-fix

# create PR
gh pr create --fill
# or visit the compare URL:
# https://github.com/<owner>/<repo>/compare/main...e2e/playwright-reservations-fix?expand=1

Notes for the maintainer
------------------------
- Use `git status` and `git diff --staged` before committing to review the exact changes.
- If the contributor included any new dependencies or build steps, run the project's build/test commands locally before merging (for example `npm ci` and `npx playwright test` where applicable).
- When creating the PR, use the PR body from `scripts/PR_BODY.md` provided in the ZIP as the description (it contains the change summary and test notes).

If any merge conflicts occur
---------------------------
1. Pull the latest changes from the default branch (e.g., `git fetch origin && git rebase origin/main`) and resolve conflicts locally.
2. Repeat `git add`, `git commit` and `git push`.

If you want me to review the PR after it's created, paste the PR URL here and I'll run a code review and CI guidance pass.