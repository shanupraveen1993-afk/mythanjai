import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers", "reports", "audit_logs"];

async function wipeAllData() {
  console.log("Starting full Firestore database wipe...");
  let deletedCount = 0;
  let failedCount = 0;

  for (const colName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Checking '${colName}': found ${snap.size} documents.`);

      for (const d of snap.docs) {
        const itemTitle = d.data().title || d.data().name || d.data().shop_name || d.id;
        try {
          await deleteDoc(doc(db, colName, d.id));
          console.log(`✓ Deleted ${colName}/${d.id} ("${itemTitle}")`);
          deletedCount++;
        } catch (err) {
          console.error(`✗ Failed to delete ${colName}/${d.id}:`, err?.message);
          failedCount++;
        }
      }
    } catch (err) {
      console.error(`Error reading ${colName}:`, err?.message);
    }
  }

  console.log(`\n==========================================`);
  console.log(`Purge finished: ${deletedCount} deleted, ${failedCount} failed.`);
  if (failedCount > 0) {
    console.log(`NOTE: ${failedCount} items failed because Firebase Console Security Rules currently block unauthenticated deletes.`);
    console.log(`To fix: Go to Firebase Console -> Firestore -> Rules, set 'allow read, write, delete: if true;' and re-run this script.`);
  }
  console.log(`==========================================\n`);
  process.exit(0);
}

wipeAllData();
