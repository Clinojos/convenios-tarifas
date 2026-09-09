// src/config/endpoints.ts
export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    ME: "/auth/me",
    ME_ALIAS: "/auth/me/alias",
    LOGOUT: "/auth/logout",
  },
  USERS: {
    ASSIGNED: "/users/assigned",
    PENDING: "/users/pending",
    ALL: "/users/all",
    SEARCH: "/users/search",
  },
  ROLES: {
    BASE: "/roles/",
    ASSIGN: "/roles/assign",
  },
  SEARCH: "/search/",
  CONTRACTS: "/contracts",
  COMPANIES: {
    BASE: "/agreements",
    TOTAL: "/agreements/total",
    GROUPS: "/agreements/groups",
  },
  PERMISSIONS: "/permissions",
  PROCEDURES: "/procedures",
};
