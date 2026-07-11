# Contributing to Open Booking

Open Booking is a headless booking engine for small business websites. The
project is organized as a pnpm workspace with a pure TypeScript core and
framework adapters layered on top.

## Ground Rules

- Keep scheduling logic in `@openbooking/core`.
- Keep framework packages focused on adaptation, composition, and rendering.
- Do not move booking rules into `@openbooking/react` or future Vue packages.
- Prefer small, reviewable changes over broad refactors.
- Add or update tests when behavior changes.

## Local Setup

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

## Workspace Layout

- `packages/booking-core`: booking rules, validation, availability, conflicts
- `packages/booking-react`: React hooks and starter components
- `packages/booking-vue`: future Vue/Nuxt adapter package
- `packages/booking-ui`: optional shared UI styles
- `apps/docs`: Vite docs and demo app

## Development Expectations

- Use TypeScript throughout.
- Keep public APIs explicit and documented.
- Preserve UTC-safe behavior in the MVP unless the change is intentionally
  expanding timezone support.
- Add focused tests before broadening abstractions.

## Verification

Before opening a pull request, run:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

## Pull Requests

Open pull requests should explain:

- what changed
- why it changed
- how it was verified
- any follow-up work or limitations

## Reporting Issues

Use the issue templates in `.github/ISSUE_TEMPLATE` and include:

- expected behavior
- actual behavior
- reproduction steps
- package and environment details
