// utils/storage.ts

/**
 * Verifica si localStorage está disponible
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.log("Error al acceder a localStorage:", error);
    return false;
  }
};

/**
 * Obtiene un item de localStorage de forma segura
 */
export const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== "undefined" && isLocalStorageAvailable()) {
    return localStorage.getItem(key);
  }
  return null;
};

/**
 * Guarda un item en localStorage de forma segura
 */
export const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window !== "undefined" && isLocalStorageAvailable()) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("Error al guardar en localStorage:", error);
    }
  }
};

/**
 * Elimina un item de localStorage de forma segura
 */
export const removeLocalStorageItem = (key: string): void => {
  if (typeof window !== "undefined" && isLocalStorageAvailable()) {
    localStorage.removeItem(key);
  }
};

/**
 * Limpia todos los items de autenticación
 */
export const clearAuthStorage = (): void => {
  removeLocalStorageItem("authToken");
  removeLocalStorageItem("userEmail");
};
