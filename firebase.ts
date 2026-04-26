import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling for better stability in proxied/iframe environments.
// Force standardized settings to bypass internal proxy issues.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  ignoreUndefinedProperties: true
}, firebaseConfig.firestoreDatabaseId);

/**
 * Force a network reconnection attempt.
 * Useful in iframe environments when the connection gets stuck.
 */
let isReconnecting = false;
export const reconnectDb = async () => {
  if (isReconnecting) return true;
  isReconnecting = true;
  
  const { disableNetwork, enableNetwork } = await import('firebase/firestore');
  try {
    console.log('Sovereign DB: Synchronizing national registry connection...');
    await disableNetwork(db);
    
    // Highly aggressive jitter for Cloud Run performance
    await new Promise(resolve => setTimeout(resolve, 50));
    
    await enableNetwork(db);
    
    // Minimal handshake wait
    await new Promise(resolve => setTimeout(resolve, 100));
    
    isReconnecting = false;
    return true;
  } catch (err) {
    // Last ditch: just try enabling
    try { await enableNetwork(db); } catch {}
    isReconnecting = false;
    return false;
  }
};

export const auth = getAuth(app);
// Explicitly set persistence to local to handle iframe storage issues
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Auth persistence failed:", err));

export const storage = getStorage(app);

// Validate Connection to Firestore
async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc to test connectivity
    // Using getDocFromServer forces a network request
    await getDocFromServer(doc(db, '_internal_', 'connectivity_test'));
    console.log("Firestore connection verified.");
  } catch (error: any) {
    // If it's just "not found" or "permission-denied", that's a success for connectivity
    if (error.code === 'not-found' || error.code === 'permission-denied') {
      console.log("Firestore connection verified (reached server).");
      return;
    }
    
    if (error.code === 'unavailable' || (error.message && error.message.includes('the client is offline'))) {
      console.warn("Firestore is currently in offline mode. The app will sync when connection is restored.");
    } else {
      console.error("Firestore connection test failed:", error.message || error);
    }
  }
}

testConnection();
