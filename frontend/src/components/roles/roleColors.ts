// ─── Role color map ────────────────────────────────────────────────────────────
type RoleColor = {
  dot: string;
  badge: string;
  text: string;
  border: string;
  hoverBorder: string;
};

export const ROLE_COLORS: Record<string, RoleColor> = {
  Administrador: {
    dot: "bg-red",
    badge: "bg-red/10 text-red ring-red/20",
    text: "text-red",
    border: "border-red/40",
    hoverBorder: "hover:border-red/40",
  },
  Tesoreria: {
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary-dark ring-primary/20",
    text: "text-primary-dark",
    border: "border-primary/40",
    hoverBorder: "hover:border-primary/40",
  },
  Usuario: {
    dot: "bg-green",
    badge: "bg-green/10 text-green ring-green/20",
    text: "text-green",
    border: "border-green/40",
    hoverBorder: "hover:border-green/40",
  },
  default: {
    dot: "bg-purple",
    badge: "bg-purple/10 text-purple ring-purple/20",
    text: "text-purple",
    border: "border-purple/40",
    hoverBorder: "hover:border-purple/40",
  },
};

export function getRoleColor(name: string): RoleColor {
  return ROLE_COLORS[name] ?? ROLE_COLORS.default;
}
