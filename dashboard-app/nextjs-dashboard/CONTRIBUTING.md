# Contributing Guidelines

Welcome! This document outlines how we collaborate, write code, and review pull requests for this project.

## 1. Branch Naming Conventions
Always create your feature or fix branches from `main` using a clear prefix and the issue number/short description:
- **Features:** `feature/t1.5-contributing-guide` (or `feature/issue-5`)
- **Bug Fixes:** `bugfix/login-redirect`
- **Hotfixes:** `hotfix/critical-security-patch`

## 2. Commit Style
Write clear, concise commit messages in the imperative mood (e.g., "Add", "Fix", "Update" rather than "Added" or "Fixing").
- Example: `git commit -m "feat: add CONTRIBUTING.md with team workflow rules"`
- Keep commits focused on a single logical change.

## 3. Review Rules
- **No direct pushes to `main`:** All changes must go through a Pull Request.
- **Required Approvals:** Every PR requires at least **1 approval** from your assigned review partner before merging.
- **PR Template:** Always use the pull request template and fill out what changed, how to test, and check off the checklist items.

---

## 4. Class Definition of Ready (DoR)
*An issue must meet all of these criteria before work begins:*
- User story and value are clearly defined.
- Acceptance criteria are written and testable.
- Out of scope items are explicitly stated.
- Dependencies are identified and resolved.
- Estimated effort is understood and small enough to finish in one sprint.
- Test approach is agreed upon.
- Review partner is assigned.

## 5. Class Definition of Done (DoD)
*An issue is only considered finished when:*
- Code is written and fulfills all acceptance criteria.
- Automated tests or manual testing steps pass successfully.
- Code has been reviewed and approved by your review partner.
- The Pull Request has been successfully merged into `main`.
- The corresponding issue card on the Project Board has been moved to **Done**.