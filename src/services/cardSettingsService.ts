
'use server';

import { db } from '@/lib/firebase';
import type { CardSettingsData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const SETTINGS_COLLECTION = 'app_settings';
const CARD_SETTINGS_DOC_ID = 'cardCustomization';

export async function getCardSettings(): Promise<CardSettingsData> {
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, CARD_SETTINGS_DOC_ID);
    const docSnap = await getDoc(settingsDocRef);

    if (docSnap.exists()) {
      // Destructure lastUpdated (a Firestore Timestamp) out, as it's not a plain object
      // and not needed by client components for rendering the card.
      const { lastUpdated, ...clientData } = docSnap.data();
      // Combine fetched data (now plain) with defaults.
      // Cast clientData to Partial<CardSettingsData> to ensure type safety during the spread.
      return { ...DEFAULT_CARD_SETTINGS, ...(clientData as Partial<CardSettingsData>) };
    } else {
      // If no settings found, save and return defaults.
      // lastUpdated is added here for the Firestore document but won't be in the returned DEFAULT_CARD_SETTINGS.
      await setDoc(settingsDocRef, { ...DEFAULT_CARD_SETTINGS, lastUpdated: serverTimestamp() });
      return DEFAULT_CARD_SETTINGS;
    }
  } catch (error) {
    console.error("Error fetching card settings: ", error);
    // Fallback to default settings in case of an error
    return DEFAULT_CARD_SETTINGS;
  }
}

export async function saveCardSettings(settings: Partial<CardSettingsData>): Promise<void> {
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, CARD_SETTINGS_DOC_ID);
    // Use setDoc with merge: true to only update provided fields or create if not exists.
    // lastUpdated is set here using serverTimestamp for the Firestore document.
    await setDoc(settingsDocRef, { ...settings, lastUpdated: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Error saving card settings: ", error);
    throw new Error("Failed to save card settings to Firestore.");
  }
}
