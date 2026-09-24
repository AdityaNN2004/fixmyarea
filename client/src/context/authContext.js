import { createContext, useContext } from 'react';

// The shared "box" holding auth state. Lives in a component-free file
// so AuthContext.jsx can export only components (Fast Refresh's requirement).
export const AuthContext = createContext(null);

// Any component calls useAuth() to read/update auth state
export function useAuth() {
  return useContext(AuthContext);
}