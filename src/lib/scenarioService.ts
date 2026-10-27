import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { SimulationParams } from '../types/election';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline.');
      return false;
    }
    return true; // Connection tested successfully even with permission denied
  }
}

export interface SavedScenario {
  id: string;
  userId: string;
  name: string;
  params: SimulationParams;
  probabilidadeResultanteC1: number;
  probabilidadeResultanteC2: number;
  createdAt: string;
}

export async function saveScenario(
  name: string,
  params: SimulationParams,
  probC1: number,
  probC2: number
): Promise<SavedScenario | null> {
  const user = auth.currentUser;
  const userId = user ? user.uid : 'anonymous';
  const scenarioId = `scen_${Date.now()}`;
  const path = `users/${userId}/scenarios/${scenarioId}`;

  const scenarioData: SavedScenario = {
    id: scenarioId,
    userId,
    name,
    params,
    probabilidadeResultanteC1: probC1,
    probabilidadeResultanteC2: probC2,
    createdAt: new Date().toISOString(),
  };

  try {
    if (user) {
      await setDoc(doc(db, 'users', userId, 'scenarios', scenarioId), scenarioData);
    } else {
      // Local storage fallback for unauthenticated users
      const stored = localStorage.getItem('eleicoes_scenarios') || '[]';
      const list = JSON.parse(stored);
      list.unshift(scenarioData);
      localStorage.setItem('eleicoes_scenarios', JSON.stringify(list));
    }
    return scenarioData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function loadSavedScenarios(): Promise<SavedScenario[]> {
  const user = auth.currentUser;
  if (!user) {
    const stored = localStorage.getItem('eleicoes_scenarios') || '[]';
    return JSON.parse(stored);
  }

  const path = `users/${user.uid}/scenarios`;
  try {
    const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'scenarios'));
    const list: SavedScenario[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as SavedScenario);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
