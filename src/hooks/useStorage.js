import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export function useStorage() {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = (file, path) => {
    return new Promise((resolve, reject) => {
      setUploading(true);
      setError(null);
      setProgress(0);

      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(pct);
        },
        (err) => {
          setError(err.message);
          setUploading(false);
          reject(err);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploading(false);
          setProgress(100);
          resolve(url);
        }
      );
    });
  };

  const deleteFile = async (path) => {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  };

  return { uploadFile, deleteFile, progress, error, uploading };
}
