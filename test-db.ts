import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

import admin from 'firebase-admin';
import firebaseConfig from "./firebase-applet-config.json";

function testAdmin() {
  console.log("Testing Admin...");
  admin.initializeApp({
      projectId: firebaseConfig.projectId,
      credential: admin.credential.applicationDefault() 
  }, "test-admin");
  const db = admin.firestore(admin.app("test-admin"));
  if (firebaseConfig.firestoreDatabaseId) {
      db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });
  }

  db.collection("markets").get()
  .then(snap => {
     console.log("ADMIN SUCCESS:", snap.docs.length);
     process.exit(0);
  })
  .catch(err => {
     console.error("ADMIN FAILED:", err.code, err.message);
     process.exit(1);
  });
}
testAdmin();
