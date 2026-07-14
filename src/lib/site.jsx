import { createContext, useContext, useState } from 'react';

// Situs yang sedang dikelola di panel admin (cari/beer). Pilihan disimpan di
// localStorage supaya bertahan antar-sesi; daftar situsnya sendiri diambil
// dari GET /api/admin/sites (sumber kebenaran: server/sites.js).
const STORAGE_KEY = 'admin_site';
const FALLBACK_SITE = 'cari';

const SiteContext = createContext({ site: FALLBACK_SITE, setSite: () => {} });

export function SiteProvider({ children }) {
  const [site, setSiteState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || FALLBACK_SITE;
    } catch {
      return FALLBACK_SITE;
    }
  });

  function setSite(next) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode dsb. — cukup state in-memory */
    }
    setSiteState(next);
  }

  return (
    <SiteContext.Provider value={{ site, setSite }}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext);
