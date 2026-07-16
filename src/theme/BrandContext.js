import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { CONFIG, getSession } from '../api/odoo';
import { applyBrandColor, colors } from './index';

const DEFAULT_COLOR = colors.accent;
const BrandContext = createContext({ primaryColor: DEFAULT_COLOR, refreshBrand: () => {} });

export function BrandProvider({ children }) {
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLOR);

  const refreshBrand = useCallback(async () => {
    if (!CONFIG.USE_API || !getSession()) return;   // لا تنادِ بدون جلسة
    try {
      const res = await api.fetchBranding();
      if (res?.ok && res.primary_color) {
        applyBrandColor(res.primary_color);
        setPrimaryColor(res.primary_color);
      }
    } catch (e) {
      console.log('BRANDING >>>', e.message);
    }
  }, []);

  return (
    <BrandContext.Provider value={{ primaryColor, refreshBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => useContext(BrandContext);