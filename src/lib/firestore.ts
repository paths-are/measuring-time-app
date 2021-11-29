// import { app } from "./firebase";
// import { getFirestore } from "firebase/firestore";
import {
  getFirestore,
  doc,
  // collection,
  // query,
  // where,
  // getDocs,
  getDoc,
  // addDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  // arrayRemove,
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

/**
 * MeasuredItem
 */
export async function fetchMeasuredItem(docId: string, onUpdate: any, q?: any) {
  const collectionName = "MeasuredItem";
  const docRef = doc(db, collectionName, docId);
  console.log(q);
  onSnapshot(docRef, async (doc) => {
    if (doc.exists()) {
      console.log(doc.data());
      const data = doc.data();
      onUpdate(data.items);
    } else {
      console.log("No such document!");
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

export async function updateMeasuredItem(docId: string, data: any) {
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
/**
 * MeasuredItem
 *****************************************************
 */

/**
 * MeasuredTime
 */
export async function fetchMeasuredTime(
  docId: string,
  onUpdate: any
  // where?: any
) {
  const collectionName = "MeasuredTime";
  const docRef = doc(db, collectionName, docId);

  onSnapshot(docRef, async (doc) => {
    if (doc.exists()) {
      console.log(doc.data());
      const data = doc.data();
      onUpdate(data);
    } else {
      console.log("No such document!");
    }
  });
}
export async function updateMeasuredTime(
  docId: string,
  key: string,
  data: any
) {
  console.log(data);
  const collectionName = "MeasuredTime";
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    console.log("hello----0");
    // TODO:差分だけ更新するようにしたい
    const res = await updateDoc(docRef, {
      [key]: data,
    });
    console.log("res----");
    console.log(res);
  } else {
    console.log("hello----1");
    const res = await setDoc(docRef, { [key]: data });
    console.log("res----");
    console.log(res);
  }
}
/**
 * MeasuredTime
 *****************************************************
 */
