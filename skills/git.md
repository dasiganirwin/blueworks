# Git Workflow

This document outlines Git conventions and workflows for BlueWork.

## Branching Strategy
- `main` – Production-ready code
- `develop` – Integration branch
- Feature branches – `feature/<name>`
- Bugfix branches – `bugfix/<name>`

## Commit Conventions
- `feat:` – New feature
- `fix:` – Bug fix
- `chore:` – Routine maintenance
- `docs:` – Documentation changes
- `refactor:` – Code restructuring

## Pull Requests
- PRs from feature branches into `develop`
- Require code review from at least one team member
- Include description of changes and testing instructions

## Version Control Tips
- Commit small, logical changes
- Write descriptive commit messages
- Sync frequently with remote