import { useEffect, useState } from "react";
import { atom, useRecoilValue, useSetRecoilState } from "recoil";
import {
  User,
  getAuth,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  connectAuthEmulator,
} from "firebase/auth";

import { app } from "./firebase";

const auth = getAuth(app);
connectAuthEmulator(auth, "http://localhost:9099");

type UserState = User | null;

const userState = atom<UserState>({
  key: "firebaseUserState",
  default: null,
  dangerouslyAllowMutability: true,
});

export const login = (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  return signInWithRedirect(auth, provider);
};

export const logout = (): Promise<void> => {
  return signOut(auth);
};

export const useAuth = (): boolean => {
  const [isLoading, setIsLoading] = useState(true);
  const setUser = useSetRecoilState(userState);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
  }, [setUser]);

  return isLoading;
};

export const useUser = (): UserState => {
  return useRecoilValue(userState);
};
