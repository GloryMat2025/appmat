# Conventional Commits (examples)

Use the following commit message prefixes to drive automated version bumps and changelogs:

- `feat: add new gallery layout` (minor bump)
- `fix: correct zip path` (patch bump)
- `docs: update README` (no bump)
- `chore: cleanup workflow cache`(no bump)

To trigger a release manually, push a tag:

```bash
git tag v1.2.3
git push origin v1.2.3
```
