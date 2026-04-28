# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This is a documentation/notes repository used for training and practicing git workflows with Claude Code. It contains no build system, tests, or application code.

## Commands

This repository has no toolchain. There are no build, lint, or test commands.

## Commit Convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

Common types used in this repo: `feat`, `docs`, `chore`, `test`. Scope is optional. Branch names follow the pattern `type/issue-number-short-description` (e.g. `feat/2-add-claude-md`).

## Known Gotchas

- `.env` is gitignored — never commit it
- An early commit used `dos:` instead of `docs:` as the type; use `docs:` going forward
