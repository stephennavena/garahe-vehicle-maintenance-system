import { createContext, useContext, useState, useEffect } from 'react';

const GarageContext = createContext(null);

const STORAGE_KEY_ID = 'garahe:garage_id';
const STORAGE_KEY_NAME = 'garahe:garage_name';

export function generateGarageCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GRH-${rand}`;
}

export function getActiveGarageId() {
  try {
    return localStorage.getItem(STORAGE_KEY_ID) || 'demo';
  } catch {
    return 'demo';
  }
}

export function GarageProvider({ children }) {
  const [garage, setGarageState] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('garage') || params.get('code');
      const urlName = params.get('name');
      if (urlCode) {
        const cleanCode = urlCode.trim().toLowerCase();
        const cleanName = urlName ? urlName.trim() : (cleanCode === 'demo' ? 'Demo Showcase' : `Garage ${cleanCode.toUpperCase()}`);
        localStorage.setItem(STORAGE_KEY_ID, cleanCode);
        localStorage.setItem(STORAGE_KEY_NAME, cleanName);
        return { id: cleanCode, name: cleanName };
      }
    }

    // Check localStorage
    const savedId = localStorage.getItem(STORAGE_KEY_ID);
    const savedName = localStorage.getItem(STORAGE_KEY_NAME);
    if (savedId) {
      return {
        id: savedId.trim().toLowerCase(),
        name: savedName || (savedId.toLowerCase() === 'demo' ? 'Demo Showcase' : `Garage ${savedId.toUpperCase()}`),
      };
    }

    // Default to demo
    return { id: 'demo', name: 'Demo Showcase' };
  });

  const [modalOpen, setModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ID, garage.id);
    localStorage.setItem(STORAGE_KEY_NAME, garage.name);
  }, [garage]);

  function switchGarage(id, name) {
    const cleanId = (id || 'demo').trim().toLowerCase().slice(0, 64);
    const cleanName = name && name.trim() ? name.trim() : (cleanId === 'demo' ? 'Demo Showcase' : `Garage ${cleanId.toUpperCase()}`);
    setGarageState({ id: cleanId, name: cleanName });
    window.dispatchEvent(new CustomEvent('garahe:garage_changed', { detail: { id: cleanId, name: cleanName } }));
  }

  function createGarage(name, customCode) {
    const code = (customCode && customCode.trim() ? customCode.trim() : generateGarageCode()).toLowerCase();
    const garageName = name && name.trim() ? name.trim() : `Garage ${code.toUpperCase()}`;
    switchGarage(code, garageName);
    return { id: code, name: garageName };
  }

  function switchToDemo() {
    switchGarage('demo', 'Demo Showcase');
  }

  function getShareLink() {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('garage', garage.id);
    return url.toString();
  }

  return (
    <GarageContext.Provider
      value={{
        garage,
        isDemo: garage.id === 'demo',
        switchGarage,
        createGarage,
        switchToDemo,
        getShareLink,
        modalOpen,
        openModal: () => setModalOpen(true),
        closeModal: () => setModalOpen(false),
      }}
    >
      {children}
    </GarageContext.Provider>
  );
}

export function useGarage() {
  const ctx = useContext(GarageContext);
  if (!ctx) {
    throw new Error('useGarage must be used within a GarageProvider');
  }
  return ctx;
}
