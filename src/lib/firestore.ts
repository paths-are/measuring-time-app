// import { app } from "./firebase";
// import { getFirestore } from "firebase/firestore";
import {
  getFirestore,
  doc,
  // DocumentReference,
  collection,
  // query,
  // where,
  // getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  // FieldPath,
  onSnapshot,
  // getDocFromCache,
  // serverTimestamp,
  connectFirestoreEmulator,
} from "firebase/firestore";

const db = getFirestore();
if (process.env.NEXT_PUBLIC_MODE === "LOCAL_DEVELOP") {
  connectFirestoreEmulator(db, "localhost", 8080);
}

export async function addCollectionTest() {
  // const citiesRef = collection(db, "cities");

  // collection(db, "cities", "SF");
  // db.collection()

  // const messageRef = db.collection('rooms').doc('roomA')
  // .collection('messages').doc('message1');
  // const docRef = doc(db, "cities", "SF", "sub","HMhnoBgSN7i1sSMBNol4");

  // console.log(docRef)

  const collectionRef = collection(db, "collection", "doc1", "sub-col1");

  // Docment ID 自動生成
  await addDoc(collectionRef, {
    name: "Tokyo",
    country: "Japan",
  });

  // Docment ID 指定（すでにある場合は上書き）
  await setDoc(doc(collectionRef, "SF"), {
    name: "San Francisco",
    state: "CA",
    country: "USA",
    capital: false,
    population: 860000,
    regions: ["west_coast", "norcal"],
  });
  await setDoc(doc(collectionRef, "LA"), {
    name: "Los Angeles",
    state: "CA",
    country: "USA",
    capital: false,
    population: 3900000,
    regions: ["west_coast", "socal"],
  });
  await setDoc(doc(collectionRef, "DC"), {
    name: "Washington, D.C.",
    state: null,
    country: "USA",
    capital: true,
    population: 680000,
    regions: ["east_coast"],
  });
  await setDoc(doc(collectionRef, "TOK"), {
    name: "Tokyo",
    state: null,
    country: "Japan",
    capital: true,
    population: 9000000,
    regions: ["kanto", "honshu"],
  });
  await setDoc(doc(collectionRef, "BJ"), {
    name: "Beijing",
    state: null,
    country: "China",
    capital: true,
    population: 21500000,
    regions: ["jingjinji", "hebei"],
  });
}

/**
 * MeasuredItem
 */
export async function deleteMeasuredItem(docId: string, removeItem: any) {
  const collectionName = "MeasuredItem";
  const docRef = doc(db, collectionName, docId);

  await updateDoc(docRef, {
    items: arrayRemove(removeItem),
  });

  let newData = {
    ...removeItem,
    isDelete: true,
  };

  await updateDoc(docRef, {
    items: arrayUnion(newData),
  });

  return;
}

export async function fetchMeasuredItem(docId: string, onUpdate: any) {
  const collectionName = "MeasuredItem";
  const docRef = doc(db, collectionName, docId);
  onSnapshot(docRef, async (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      console.log("onUpdate----");
      onUpdate(data.items);
    } else {
      console.log("fetchMeasuredItem -> No such document!");
    }
  });
}

export async function addMeasuredItem(docId: string, data: any) {
  const collectionName = "MeasuredItem";
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, { items: [data] });
  } else {
    await updateDoc(docRef, {
      items: arrayUnion(data),
    });
  }
}

export async function updateMeasuredItem(docId: string, newItems: any) {
  const collectionName = "MeasuredItem";
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    await setDoc(docRef, { items: newItems });
  } else {
    await updateDoc(docRef, {
      items: newItems,
    });
  }
}

/**
 * MeasuredItem
 *****************************************************
 */

/**
 * MeasuredTime
 */
export async function fetchMeasuredTime(
  uid: string,
  docId: string,
  onUpdate: any
) {
  const collectionName = "User";
  const docRef = doc(db, collectionName, uid, "times", docId);

  onSnapshot(docRef, async (doc) => {
    if (doc.exists()) {
      console.log("fetchMeasuredTime---");
      console.log(doc.data());
      const data = doc.data();
      onUpdate(data);
    } else {
      console.log("No such document!");
    }
  });
}
export async function updateMeasuredTime(
  uid: string,
  month: string,
  data: {
    measuringItem: any;
    times?: any;
  },
  key?: "measuringItem" | "times"
) {
  const collectionName = "User";
  const docRef = doc(db, collectionName, uid, "times", month);

  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    if (key) {
      await updateDoc(docRef, {
        [key]: data[key],
      });
    } else {
      await updateDoc(docRef, data);
    }
  } else {
    await setDoc(docRef, data);
  }
}
/**
 * MeasuredTime
 *****************************************************
 */
