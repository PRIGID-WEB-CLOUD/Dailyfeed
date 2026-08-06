
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "./types";

/**
 * Retrieves all user profiles from Firestore.
 * @returns A promise that resolves to an array of user profiles.
 */
export async function getAllAuthors(): Promise<User[]> {
  const usersCollection = collection(db, "users");
  const usersSnapshot = await getDocs(usersCollection);
  const usersList = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];
  return usersList;
}
