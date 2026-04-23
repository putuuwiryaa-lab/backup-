import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

async function runTests() {
  const c = {
    "projectId": "gen-lang-client-0206847589",
    "appId": "1:149378727431:web:8d379706d32b125ed934a2",
    "apiKey": "AIzaSyDjUaVnpieXu3cWH_lUJh5jn-fPWqlVaVg",
    "firestoreDatabaseId": "ai-studio-4a754edd-ef20-4dae-a132-b2cc311e3272"
  };

  console.log(`\n--- TESTING DB VIA WEB SDK ---`);
  const app = initializeApp(c);
  const db = getFirestore(app, c.firestoreDatabaseId);

  try {
     const snap = await getDocs(collection(db, "markets"));
     console.log("==> SUCCESS: Database reachable. Found", snap.docs.length, "docs");
  } catch(e: any) {
     console.log("==> FAILED:", e.message);
  }
  process.exit();
}
runTests();
