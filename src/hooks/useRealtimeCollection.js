import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

export function useRealtimeCollection(collectionName, filters = [], sortBy = null) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Serialize filters/sortBy to primitive values for stable dependency comparison
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (!collectionName) return;

    setLoading(true);
    const parsedFilters = JSON.parse(filtersKey);
    const constraints = [];
    parsedFilters.forEach(([field, op, value]) => {
      constraints.push(where(field, op, value));
    });
    if (sortBy) {
      constraints.push(orderBy(sortBy));
    }

    let q = collection(db, collectionName);
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDocuments(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, filtersKey, sortBy]);

  return { documents, loading, error };
}

