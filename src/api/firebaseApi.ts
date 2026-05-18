import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import type { Message } from '../types';

export async function sendMessageToFirestore(message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
  const ref = await addDoc(collection(db, 'channels', message.channelId, 'messages'), {
    ...message,
    timestamp: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchMessages(channelId: string): Promise<Message[]> {
  const q = query(
    collection(db, 'channels', channelId, 'messages'),
    orderBy('timestamp', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() ?? new Date(),
  })) as Message[];
}
