import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, setDoc, doc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

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
const auth = getAuth(app);

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers"];

async function deactivateAllListings() {
  console.log("Signing in to Firebase Auth...");
  try {
    const cred = await signInAnonymously(auth);
    console.log("Authenticated as UID:", cred.user.uid);
  } catch (e) {
    console.warn("Auth error:", e?.message);
  }

  let count = 0;

  for (const colName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Checking ${colName}: found ${snap.size} documents.`);

      for (const d of snap.docs) {
        const itemTitle = d.data().title || d.data().name || d.data().shop_name || d.id;
        console.log(`Deactivating ${colName}/${d.id} ("${itemTitle}")...`);
        try {
          await setDoc(doc(db, colName, d.id), {
            is_inactive: true,
            is_sold: true,
            is_expired: true,
            is_offline: true,
            status: "inactive",
          }, { merge: true });
          console.log(`✓ Deactivated ${colName}/${d.id}`);
          count++;
        } catch (err) {
          console.error(`Failed to update ${colName}/${d.id}:`, err?.message);
        }
      }
    } catch (err) {
      console.error(`Error reading ${colName}:`, err?.message);
    }
  }

  console.log(`\n🎉 Successfully deactivated ${count} items in Cloud Firestore!`);
  process.exit(0);
}

deactivateAllListings();
