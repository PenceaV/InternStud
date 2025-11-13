# InternStud

## Setup

1. Install dependencies in both workspaces:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

2. Configure environment variables:
   - Create `client/.env` if needed for frontend configuration.
   - For the backend, **do not** commit service account JSON files. Instead set one of:
     - `FIREBASE_SERVICE_ACCOUNT`: base64 encoded Firebase service account JSON.
     - `GOOGLE_APPLICATION_CREDENTIALS`: absolute path to a local service account JSON file (ignored by git).
   - Optionally set `FIREBASE_STORAGE_BUCKET` if different from the default bucket.
   - Include other secrets such as `GEMINI_API_KEY` in `server/.env` (ignored by git).

3. Start the development servers:
   ```bash
   # In one terminal
   cd server
   npm run dev

   # In another terminal
   cd client
   npm run dev
   ```

## Available Scripts

- `client`: use `npm run dev`, `npm run build`, `npm run preview`.
- `server`: use `npm run dev` (with nodemon) or `npm start`.

## Notes

- Never commit credential files. They are ignored by `.gitignore` and loaded from environment variables.
- Rotate any keys that may have been exposed before these changes.*** End Patch