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

## App Flow
Login → Security Activation Screen → Dashboard → Voice Listening → "alpha" detected → Emergency Trigger → SMS + Location + Recording → Save Evidence → Show in Evidence Page

## Security Activation Screen
- Shown after login, before dashboard (only once per session)
- Displays keyword: ALPHA (read-only)
- User clicks "Activate Protection" to proceed
- Activation state stored in `localStorage` under key `"resqher-activated"`

## Emergency Contact
The recipient phone number is hardcoded to `+916384215014` in `useEmergency.ts`.
This number receives the Twilio SMS on every emergency trigger.

## Camera Recording
- Records front camera for 30 seconds, then back camera for 30 seconds
- Videos are saved directly to the user's local device via browser download
- No video files are uploaded to Firebase — only metadata is stored

## Evidence Page (`/evidence`)
- Lists all past emergency events from Firebase
- Each entry shows: timestamp, location link, video download buttons
- Video download links point to local blob URLs generated during recording

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
