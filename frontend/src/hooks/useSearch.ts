import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";

export function useSearch(query: string) {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}${ENDPOINTS.SEARCH}?q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (error) {
        console.error("Error buscando:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  return { results, isLoading, isOpen, setIsOpen };
}
