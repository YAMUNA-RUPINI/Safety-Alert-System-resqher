import admin from "firebase-admin";
import { logger } from "./logger";

const firebaseConfig = {
  databaseURL: "https://resqher-d3d5e-default-rtdb.firebaseio.com",
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      ...firebaseConfig,
    });
  } catch {
    admin.initializeApp({
      ...firebaseConfig,
    });
    logger.info("Firebase Admin initialized without credential (using public DB rules)");
  }
}

export const db = admin.database();
export default admin;
