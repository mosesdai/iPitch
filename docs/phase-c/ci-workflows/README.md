# GitHub Actions CI (archived copies)

These workflow files are **not active**. They were moved out of `.github/workflows/` so the repository can be pushed with a GitHub token that does not include the `workflow` scope.

## Restore CI later

1. Copy (or move) the YAML files back:
   - `deploy-pages.yml` → `.github/workflows/deploy-pages.yml`
   - `deploy-worker.yml` → `.github/workflows/deploy-worker.yml`
2. Push with a token or credential that has **`workflow`** scope (or use SSH / GitHub CLI with appropriate permissions).
3. Configure repository secrets and Pages/Worker settings as documented in `docs/phase-c/CLOUD_DEPLOYMENT.md`.
