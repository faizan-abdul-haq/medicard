
'use server';

import { db } from '@/lib/firebase';
import type { CardSettingsData } from '@/lib/types';
import { DEFAULT_CARD_SETTINGS } from '@/lib/types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const SETTINGS_COLLECTION = 'app_settings';

type SettingsType = 'student' | 'faculty' | 'staff';

export async function getCardSettings(type: SettingsType = 'student'): Promise<CardSettingsData> {
  const CARD_SETTINGS_DOC_ID = `cardCustomization_${type}`;
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, CARD_SETTINGS_DOC_ID);
    const docSnap = await getDoc(settingsDocRef);

    if (docSnap.exists()) {
      const { lastUpdated, ...clientData } = docSnap.data();
      return { ...DEFAULT_CARD_SETTINGS, ...(clientData as Partial<CardSettingsData>) };
    } else {
      await setDoc(settingsDocRef, { ...DEFAULT_CARD_SETTINGS, lastUpdated: serverTimestamp() });
      return DEFAULT_CARD_SETTINGS;
    }
  } catch (error) {
    console.error(`Error fetching ${type} card settings: `, error);
    return DEFAULT_CARD_SETTINGS;
  }
}

export async function saveCardSettings(settings: Partial<CardSettingsData>, type: SettingsType): Promise<void> {
  const CARD_SETTINGS_DOC_ID = `cardCustomization_${type}`;
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, CARD_SETTINGS_DOC_ID);
    await setDoc(settingsDocRef, { ...settings, lastUpdated: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error(`Error saving ${type} card settings: `, error);
    throw new Error(`Failed to save ${type} card settings to Firestore.`);
  }
}
