
import {
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  Timestamp,
} from 'firebase/firestore';
import type { Integration } from '@/contexts/integrations-context';

export const integrationConverter: FirestoreDataConverter<Integration> = {
  toFirestore(integration: Integration): DocumentData {
    return { 
        ...integration,
        createdAt: integration.createdAt || Timestamp.now()
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Integration {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
    } as Integration;
  },
};
