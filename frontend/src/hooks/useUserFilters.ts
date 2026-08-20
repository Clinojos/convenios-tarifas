import { useState, useEffect } from "react";

export function useUserFilters() {
  const [filterValues, setFilterValues] = useState({
    status: "",
    sort: "name",
    search: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce lógico
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filterValues.search);
    }, 500);
    return () => clearTimeout(handler);
  }, [filterValues.search]);

  const handleFilterChange = (key: string, val: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: val }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterValues({ status: "", sort: "name", search: "" });
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Derivados de estado
  const userType =
    filterValues.status === "no-role"
      ? "pending"
      : filterValues.status === "active"
        ? "with_access" // 👈 antes era "assigned"; ahora filtra por acceso, no por rol
        : "all";

  const filterConfig = {
    status: {
      value: filterValues.status,
      options: [
        { label: "Activos (Con Acceso)", value: "active" },
        { label: "Sin Rol (Pendientes)", value: "no-role" },
      ],
    },
    sortBy: {
      value: filterValues.sort,
      options: [
        { label: "A-Z (Alfabeto)", value: "name-asc" },
        { label: "Z-A (Alfabeto)", value: "name-desc" },
      ],
    },
  };

  return {
    filterValues,
    debouncedSearch,
    currentPage,
    setCurrentPage,
    handleFilterChange,
    clearFilters,
    userType,
    filterConfig,
  };
}
