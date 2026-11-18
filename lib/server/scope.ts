/**
 * Workspace scope constants.
 *
 * Kept in their own module (free of `next/headers`) so server modules that
 * only need the ids — provider lookup, engine resolution — do not have to
 * import the request-scoped workspace helpers.
 */

/**
 * The shared development workspace, used when nobody is signed in.
 *
 * The dashboard is open during development — "Start Free" goes straight in —
 * so there is not always an account behind a request.
 */
export const DEV_WORKSPACE_ID = "workspace_dev";

/** Label for the shared development workspace. */
export const DEV_WORKSPACE_NAME = "Reyvoca Workspace";

/**
 * Where the provider stack lives.
 *
 * Provider keys are Reyvoca's, not the customer's: the operator saves them
 * once under this workspace and every agent in every customer workspace runs
 * on them. A key saved against a customer workspace (an enterprise bringing
 * its own) still wins for that workspace — see `providerKey`.
 */
export const PLATFORM_WORKSPACE_ID = "workspace_platform";
