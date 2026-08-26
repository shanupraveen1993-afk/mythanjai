import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
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

const COLLECTIONS = ["needs_and_sales", "services", "shops", "offers", "reports", "audit_logs"];

async function wipeDatabase() {
  console.log("Signing in anonymously to Firebase Auth...");
  try {
    const userCred = await signInAnonymously(auth);
    console.log("Signed in anonymously as UID:", userCred.user.uid);
  } catch (authErr) {
    console.warn("Anonymous sign in notice:", authErr?.message);
  }

  console.log("Starting Cloud Firestore database wipe...");
  let totalDeleted = 0;

  for (const colName of COLLECTIONS) {
    try {
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);
      console.log(`Collection '${colName}': found ${snap.size} documents.`);
      
      for (const docSnap of snap.docs) {
        const itemTitle = docSnap.data().title || docSnap.data().name || docSnap.data().shop_name || docSnap.data().offer_title || docSnap.id;
        try {
          await deleteDoc(doc(db, colName, docSnap.id));
          console.log(`✓ Deleted ${colName}/${docSnap.id} ("${itemTitle}")`);
          totalDeleted++;
        } catch (delErr) {
          console.error(`Failed to delete ${colName}/${docSnap.id}:`, delErr?.message);
        }
      }
    } catch (err) {
      console.error(`Error reading collection ${colName}:`, err?.message);
    }
  }

  console.log(`\n🎉 Firestore wipe completed! Total ${totalDeleted} documents deleted.`);
  process.exit(0);
}

wipeDatabase();
