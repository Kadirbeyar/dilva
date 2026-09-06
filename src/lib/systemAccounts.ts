/**
 * Fixed id of the "Dilva Team" system account, seeded by
 * prisma/sql/10_dilva_team_broadcast.sql. It's a normal row in
 * "users" (no real login behind it) used only as the sender identity
 * for admin broadcast messages — see /api/admin/broadcast. Keeping
 * the id here (rather than looking it up by username every time)
 * avoids an extra DB round-trip on every broadcast send.
 */
export const DILVA_TEAM_USER_ID = "00000000-0000-0000-0000-000000000001";
