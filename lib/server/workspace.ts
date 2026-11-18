import type { WorkspaceIdentity } from "@/types";
import { isAdminRequest } from "./admin";
import { DEV_WORKSPACE_ID, DEV_WORKSPACE_NAME, PLATFORM_WORKSPACE_ID } from "./scope";
import { getSessionUser, type SessionUser } from "./session";

export { DEV_WORKSPACE_ID, DEV_WORKSPACE_NAME, PLATFORM_WORKSPACE_ID };

/**
 * Which workspace a request belongs to.
 *
 * When an account is signed in, its id is the workspace; otherwise everything
 * belongs to one shared development workspace. Every stored record carries
 * this id, so turning authentication back on partitions the data without
 * changing a single query. The ids themselves live in `./scope`.
 */

export type CurrentWorkspace = {
  id: string;
  name: string;
  /** Null while the dashboard is open without an account. */
  user: SessionUser | null;
};

/** The workspace behind this request, resolved from the session cookie. */
export async function currentWorkspace(): Promise<CurrentWorkspace> {
  const user = await getSessionUser();
  return {
    id: user?.id ?? DEV_WORKSPACE_ID,
    name: user?.workspace ?? DEV_WORKSPACE_NAME,
    user,
  };
}

export async function currentWorkspaceId(): Promise<string> {
  return (await currentWorkspace()).id;
}

/**
 * How the workspace is presented in the dashboard chrome.
 *
 * Signed out this is the development workspace, which the UI labels as such
 * rather than implying an account exists.
 */
export async function currentIdentity(): Promise<WorkspaceIdentity> {
  const { name, user } = await currentWorkspace();
  // Drives the one admin-only entry in the dashboard chrome. The panel itself
  // re-checks on the server, so this is presentation only.
  const isAdmin = await isAdminRequest();
  if (!user) {
    return { name, user: "Demo User", initials: "RW", signedIn: false, isAdmin };
  }
  return {
    name,
    user: user.fullName,
    initials: user.initials,
    signedIn: true,
    email: user.email,
    isAdmin,
  };
}
