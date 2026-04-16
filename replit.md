# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the RESQHER AI Women Safety Emergency System.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Validation**: Zod (`zod/v4`), Orval-generated schemas
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Applications

### RESQHER Frontend (`artifacts/resqher`)
- React + Vite app at `/`
- Firebase Authentication (Google + Email/Password)
- Voice keyword detection ("alpha" triggers emergency)
- GPS location capture + camera recording (local device)
- Multi-language: English + Tamil (react-i18next)
- Firebase Realtime Database for emergency history

### API Server (`artifacts/api-server`)
- Express 5 server at `/api`
- `POST /api/send-alert` — stores emergency metadata in Firebase + sends Twilio SMS
- `GET /api/emergencies/:userId` — fetches emergency history from Firebase

## Firebase Config
- Project: resqher-d3d5e
- Realtime DB: https://resqher-d3d5e-default-rtdb.firebaseio.com/
- Emergency metadata stored under `emergencies/{userId}/`

## Environment Secrets Required
- `TWILIO_ACCOUNT_SID` — Twilio account SID
- `TWILIO_AUTH_TOKEN` — Twilio auth token
- `TWILIO_PHONE_NUMBER` — Twilio sender phone number
- `SESSION_SECRET` — Session secret

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/resqher run dev` — run frontend locally

## Emergency Contact
The recipient phone number is stored in the user's `localStorage` under key `"emergencyContact"`.
Users set this in the Settings page. This number receives the Twilio SMS on emergency.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
