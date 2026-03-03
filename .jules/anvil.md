## 2025-03-03 - Add Lint and Test CI Workflow

**Learning:** There was no CI workflow to verify that PRs and pushes to `main` passed the tests and linter. This could lead to broken code being merged into `main` or developers having to fix regressions manually after the fact. Running `pnpm check` locally is good, but automating it in CI is better for the team.
**Action:** Added a `.github/workflows/test.yml` GitHub Actions workflow that runs `pnpm check` (which runs both `pnpm lint` and `pnpm test`) on every push to `main` and every pull request. This ensures all code merged to the main branch is linted and tests pass successfully.
