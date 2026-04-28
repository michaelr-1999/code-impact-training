# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a documentation/notes repository used for training and practicing git workflows with Claude Code. It contains no build system, tests, or application code.

## Commit Convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

Common types used in this repo: `feat`, `docs`, `chore`, `test`. Scope is optional. Branch names follow the pattern `type/issue-number-short-description` (e.g. `feat/2-add-claude-md`).

## Files

- `notes.md` — working notes file
- `.env` — gitignored; never commit this file
