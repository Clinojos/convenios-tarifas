import { useEffect, useState } from "react";

// Evita disparar una búsqueda al backend en cada tecla — espera a que el
// usuario pare de escribir un rato antes de "confirmar" el valor.
export function useDebouncedValue<T>(value: T, delayMs: number = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debounced;
}
