import { useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestore() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addDocument = async (collectionName, data) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (collectionName, id, data) => {
    setLoading(true);
    setError(null);
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (collectionName, id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getDocument = async (collectionName, id) => {
    setLoading(true);
    setError(null);
    try {
      const docSnap = await getDoc(doc(db, collectionName, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getDocuments = async (collectionName, filters = [], sortBy = null) => {
    setLoading(true);
    setError(null);
    try {
      let q = collection(db, collectionName);
      const constraints = [];
      filters.forEach(([field, op, value]) => {
        constraints.push(where(field, op, value));
      });
      if (sortBy) {
        constraints.push(orderBy(sortBy));
      }
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addDocument, updateDocument, deleteDocument, getDocument, getDocuments, loading, error };
}
