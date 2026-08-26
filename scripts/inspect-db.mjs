import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARIlmmsFmp6plkviJYVNEifLZH-vAw8yA",
  authDomain: "mythanjai-40db2.firebaseapp.com",
  projectId: "mythanjai-40db2",
  storageBucket: "mythanjai-40db2.firebasestorage.app",
  messagingSenderId: "368011719475",
  appId: "1:368011719475:web:1bd4950b7dbd8d5ffa0446",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers", "reports", "users", "audit_logs"];

async function inspectDatabase() {
  console.log("=== CURRENT FIRESTORE CLOUD DATABASE SNAPSHOT ===");
  for (const colName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`\nCollection '${colName}': ${snap.size} documents`);
      snap.docs.forEach((doc, idx) => {
        const d = doc.data();
        console.log(`  [${idx + 1}] ID: ${doc.id} | Title/Name: "${d.title || d.name || d.shop_name || d.displayName || "N/A"}" | Created: ${d.created_at || d.createdAt || "N/A"}`);
      });
    } catch (err) {
      console.error(`Error reading ${colName}:`, err?.message);
    }
  }
  process.exit(0);
}

inspectDatabase();
