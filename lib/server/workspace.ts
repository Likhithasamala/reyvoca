import type { WorkspaceIdentity } from "@/types";
import { getSessionUser, type SessionUser } from "./session";

/**
 * Which workspace a request belongs to.
 *
 * The dashboard is open during development — "Start Free" goes straight in —
 * so there is not always a signed-in account. When there is one, its id is the
 * workspace; otherwise everything belongs to one shared development workspace.
 * Every stored record carries this id, so turning authentication back on
 * partitions the data without changing a single query.
 */
export const DEV_WORKSPACE_ID = "workspace_dev";

/** Label for the shared development workspace, shown when nobody is signed in. */
export const DEV_WORKSPACE_NAME = "Reyvoca Workspace";

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
  if (!user) {
    return { name, user: "Demo User", initials: "RW", signedIn: false };
  }
  return {
    name,
    user: user.fullName,
    initials: user.initials,
    signedIn: true,
    email: user.email,
  };
}
