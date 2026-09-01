# GitHub Repository Maintenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the GitHub repository page into an accurate, professional owner-maintained project presentation.

**Architecture:** Keep project information in versioned repository files and use GitHub-native metadata, issue forms, Actions, and Releases for operational surfaces. Do not alter the game runtime.

**Tech Stack:** Markdown, GitHub Actions, GitHub Issue Forms, GitHub REST API, static HTML/JavaScript project.

---

### Task 1: Project Presentation

**Files:**
- Modify: `README.md`
- Create: `docs/assets/trader-tycoon-preview.png`
- Create: `CHANGELOG.md`
- Create: `.gitignore`

- [ ] Capture a current desktop gameplay screenshot.
- [ ] Rewrite README for v1.4.1 with accurate live, gameplay, architecture, test, and rights information.
- [ ] Add concise release history and repository hygiene rules.

### Task 2: GitHub Maintenance Files

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/workflows/validate.yml`

- [ ] Add owner-friendly structured issue forms.
- [ ] Add a push and pull-request validation workflow that runs `npm test`.
- [ ] Validate YAML structure and local tests.

### Task 3: GitHub Repository Settings And Release

**Files:**
- No production file changes.

- [ ] Update repository description, homepage, topics, and Wiki setting through the GitHub API.
- [ ] Publish the v1.4.1 Release from commit `b0943d6`.
- [ ] Verify the public repository API and live links.
- [ ] Commit and push the maintenance files to `main`.

