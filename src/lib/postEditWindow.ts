/**
 * How long after posting a Moment its own author may still edit or
 * delete it. Shared between the API route (server-side enforcement,
 * the one that actually matters) and PostCard (so the Edit/Delete
 * buttons hide themselves once the window has passed, instead of
 * being clicked and only then rejected).
 */
export const POST_EDIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function withinPostEditWindow(createdAt: Date | string): boolean {
  return Date.now() - new Date(createdAt).getTime() < POST_EDIT_WINDOW_MS;
}
