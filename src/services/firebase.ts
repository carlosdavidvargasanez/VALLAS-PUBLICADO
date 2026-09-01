import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Client, Vehicle, Quotation, Contract, Invoice, FollowUp, MessageTemplate, AuditLog, Settings, UserSession, PendingQuotationRequest } from '../types';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (using custom databaseId if configured)
export const firestore = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const COLLECTIONS = {
  VEHICLES: 'vehicles',
  CLIENTS: 'clients',
  QUOTATIONS: 'quotations',
  CONTRACTS: 'contracts',
  INVOICES: 'invoices',
  FOLLOW_UPS: 'follow_ups',
  TEMPLATES: 'templates',
  SETTINGS: 'settings',
  USERS: 'users',
  PENDING_REQUESTS: 'pending_requests',
  AUDIT_LOGS: 'audit_logs',
};

export class FirebaseSyncService {
  private static isInitialized = false;
  private static isSyncing = false;

  /**
   * Check if Firebase is configured and available
   */
  public static isAvailable(): boolean {
    return Boolean(firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey);
  }

  /**
   * Save a single document to Firestore
   */
  public static async saveDoc(collectionName: string, id: string, data: any): Promise<boolean> {
    try {
      if (!this.isAvailable()) return false;
      const cleanData = JSON.parse(JSON.stringify(data)); // strip undefined
      const docRef = doc(firestore, collectionName, String(id));
      await setDoc(docRef, cleanData, { merge: true });
      return true;
    } catch (error) {
      console.warn(`[Firebase] Error guardando ${collectionName}/${id}:`, error);
      return false;
    }
  }

  /**
   * Delete a document from Firestore
   */
  public static async removeDoc(collectionName: string, id: string): Promise<boolean> {
    try {
      if (!this.isAvailable()) return false;
      const docRef = doc(firestore, collectionName, String(id));
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.warn(`[Firebase] Error eliminando ${collectionName}/${id}:`, error);
      return false;
    }
  }

  /**
   * Bulk upload an entire collection to Firestore
   */
  public static async syncCollection(collectionName: string, items: any[]): Promise<boolean> {
    try {
      if (!this.isAvailable() || !items || items.length === 0) return false;
      const batch = writeBatch(firestore);
      
      for (const item of items) {
        if (!item.id) continue;
        const cleanData = JSON.parse(JSON.stringify(item));
        const docRef = doc(firestore, collectionName, String(item.id));
        batch.set(docRef, cleanData, { merge: true });
      }
      
      await batch.commit();
      return true;
    } catch (error) {
      console.warn(`[Firebase] Error sincronizando colección ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Fetch all items in a Firestore collection
   */
  public static async getCollectionItems<T>(collectionName: string): Promise<T[]> {
    try {
      if (!this.isAvailable()) return [];
      const colRef = collection(firestore, collectionName);
      const snapshot = await getDocs(colRef);
      const items: T[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as T);
      });
      return items;
    } catch (error) {
      console.warn(`[Firebase] Error leyendo colección ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Listen to real-time updates for a collection
   */
  public static subscribeToCollection<T>(collectionName: string, onUpdate: (items: T[]) => void): () => void {
    try {
      if (!this.isAvailable()) return () => {};
      const colRef = collection(firestore, collectionName);
      return onSnapshot(colRef, (snapshot) => {
        const items: T[] = [];
        snapshot.forEach(docSnap => {
          items.push(docSnap.data() as T);
        });
        onUpdate(items);
      }, (error) => {
        console.warn(`[Firebase Snapshot] Error en ${collectionName}:`, error);
      });
    } catch (e) {
      console.warn(`[Firebase] Error suscribiendo a ${collectionName}:`, e);
      return () => {};
    }
  }

  /**
   * Export all collections to a unified JSON backup
   */
  public static async exportEntireDatabase(): Promise<string> {
    const backup = {
      app: 'PUBLI-X BOLIVIA',
      export_date: new Date().toISOString(),
      version: '2.0.0',
      database_source: 'Firebase Firestore + Local Storage',
      data: {
        vehicles: await this.getCollectionItems<Vehicle>(COLLECTIONS.VEHICLES),
        clients: await this.getCollectionItems<Client>(COLLECTIONS.CLIENTS),
        quotations: await this.getCollectionItems<Quotation>(COLLECTIONS.QUOTATIONS),
        contracts: await this.getCollectionItems<Contract>(COLLECTIONS.CONTRACTS),
        invoices: await this.getCollectionItems<Invoice>(COLLECTIONS.INVOICES),
        follow_ups: await this.getCollectionItems<FollowUp>(COLLECTIONS.FOLLOW_UPS),
        templates: await this.getCollectionItems<MessageTemplate>(COLLECTIONS.TEMPLATES),
        users: await this.getCollectionItems<UserSession>(COLLECTIONS.USERS),
        pending_requests: await this.getCollectionItems<PendingQuotationRequest>(COLLECTIONS.PENDING_REQUESTS),
      }
    };
    return JSON.stringify(backup, null, 2);
  }
}
