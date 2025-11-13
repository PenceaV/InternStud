const admin = require('firebase-admin');

/**
 * Build an Admin credential from environment variables.
 *
 * Supported options:
 *  - FIREBASE_SERVICE_ACCOUNT: base64 encoded JSON for the service account.
 *  - GOOGLE_APPLICATION_CREDENTIALS: filesystem path to the JSON file.
 *
 * Any other configuration should throw so that missing credentials are
 * immediately visible during local development or deployment.
 */
function resolveCredential() {
  const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (base64ServiceAccount) {
    try {
      const decoded = Buffer.from(base64ServiceAccount, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(decoded);
      return admin.credential.cert(serviceAccount);
    } catch (error) {
      throw new Error(`Failed to decode FIREBASE_SERVICE_ACCOUNT: ${error.message}`);
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.credential.applicationDefault();
  }

  throw new Error(
    'Firebase Admin credential not configured. Set FIREBASE_SERVICE_ACCOUNT (base64 JSON) or GOOGLE_APPLICATION_CREDENTIALS (path to JSON file).'
  );
}

const storageBucket =
  process.env.FIREBASE_STORAGE_BUCKET || 'internstud0411.firebasestorage.app';

const app = admin.initializeApp({
  credential: resolveCredential(),
  storageBucket,
});

const db = admin.firestore(app);
const storage = admin.storage(app);

module.exports = { app, db, storage };