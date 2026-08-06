
'use server';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import slugify from 'slugify';

/**
 * Adds a new category to the 'categories' collection.
 * @param name The name of the category.
 */
export async function addCategory(name: string): Promise<void> {
  const categoriesCollection = collection(db, 'categories');
  const slug = slugify(name, { lower: true, strict: true });

  await addDoc(categoriesCollection, {
    name,
    slug,
    postCount: 0,
    createdAt: serverTimestamp(),
  });
}

/**
 * Updates an existing category.
 * @param id The ID of the category document.
 * @param name The new name for the category.
 */
export async function updateCategory(id: string, name: string): Promise<void> {
  const categoryRef = doc(db, 'categories', id);
  const slug = slugify(name, { lower: true, strict: true });

  await updateDoc(categoryRef, {
    name,
    slug,
  });
}

/**
 * Deletes a category from Firestore.
 * @param id The ID of the category document to delete.
 */
export async function deleteCategory(id: string): Promise<void> {
  const categoryRef = doc(db, 'categories', id);
  await deleteDoc(categoryRef);
}
