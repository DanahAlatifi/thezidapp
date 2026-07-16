import React, { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [curProvider, setCurProvider] = useState('');
  const [curStore, setCurStore] = useState('');
  const [curStoreId, setCurStoreId] = useState(null);   // ← معرّف المتجر المختار (للفلترة)
  const [role, setRole] = useState('manager');
  const [plan] = useState('full');

  const [profile, setProfile] = useState({
    name: '',
    company: '',
    email: '',
    accountType: 'company',
  });

  // pick(provider, storeName, storeId) — نحفظ الـ id للفلترة
  const pick = (p, s, id = null) => {
    setCurProvider(p);
    setCurStore(s);
    setCurStoreId(id);
  };
  const updateProfile = (patch) => setProfile((p) => ({ ...p, ...patch }));

  const initials = (profile.name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('');

  return (
    <Ctx.Provider value={{
      curProvider, curStore, curStoreId,
      role, setRole, plan, pick,
      profile, updateProfile, initials,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
