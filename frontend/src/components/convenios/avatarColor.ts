// Misma paleta/hash en todas las tarjetas y headers de convenio,
// para que el color de cada empresa sea siempre el mismo en toda la app.
const AVATAR_PALETTE = [
  "bg-primary",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
];

export function avatarColor(nombre: string) {
  const hash = [...nombre].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
