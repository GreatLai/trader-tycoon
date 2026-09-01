# GitHub Repository Maintenance Design

## Goal

Present Trader Tycoon as a professionally maintained, owner-led public project while keeping all code rights reserved and avoiding community-maintenance promises.

## Repository Positioning

- Chinese-first project documentation.
- Public source for viewing and hosted gameplay, maintained by the repository owner.
- No open-source license and no implied permission to redistribute or republish the code.
- Issues remain available for bug and idea tracking; Wiki is disabled because project documentation lives in the repository.

## Deliverables

- Replace the outdated README with an accurate v1.4.1 overview, live demo, gameplay, architecture, local usage, testing, project status, and rights notice.
- Add a current game screenshot used by the README.
- Add a concise changelog covering v1.4.1 and v1.4.0.
- Add structured bug and feature-request issue forms.
- Add a small repository `.gitignore` for editor and operating-system noise.
- Update repository description, homepage, topics, and Wiki setting.
- Publish a v1.4.1 GitHub Release from the existing stability commit.

## Non-Goals

- No LICENSE or CONTRIBUTING file.
- No gameplay, balance, UI, or production JavaScript changes.
- No Discussions, project board, sponsorship, or external contribution workflow.
- No automated deployment replacement; GitHub Pages continues using the current branch deployment.

## Verification

- README facts match v1.4.1 source and tests.
- All Markdown links and referenced local assets exist.
- Issue forms parse as valid YAML.
- `npm test` passes locally.
- GitHub API confirms metadata, topics, Wiki status, and v1.4.1 Release.
