import React, { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  FieldPath,
  onSnapshot,
  connectFirestoreEmulator,
} from "firebase/firestore";

const db = getFirestore();
connectFirestoreEmulator(db, "localhost", 8080);

export function useUser(id: string | null) {
  console.log(id);
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState([]);

  useEffect(() => {
    if (id) {
      const unsubscribe = onSnapshot(
        doc(db, "user", id),
        (snapshot: any) => {
          const user: any = [];
          console.log(snapshot)
          if (snapshot)
            snapshot.forEach((doc: any) => {
              user.push(doc);
            });
          setLoading(false);
          setUser(user);
        },
        (err: any) => {
          setError(err);
        }
      );

      return () => unsubscribe();
    }
  }, [id]);

  return {
    error,
    loading,
    user,
  };
}
