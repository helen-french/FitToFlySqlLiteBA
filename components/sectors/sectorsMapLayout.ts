/**
 * Sectors map layout reference.
 *
 * Active route: `app/(tabs)/(sectors)/index.tsx` → `SectorsScreen.tsx` (immersive).
 * Classic preserved in `SectorsScreen.classic.tsx` (snapshot from commit cda8468).
 *
 * To roll back after client feedback, change the export in `index.tsx` to:
 *   export { default } from "@/components/sectors/SectorsScreen.classic";
 */
export const USE_IMMERSIVE_SECTORS_MAP = true;
