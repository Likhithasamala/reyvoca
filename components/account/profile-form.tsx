"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "@/lib/auth/service";
import type { AccountSummary } from "@/types";
import { validateRequired } from "@/lib/validation";
import { ErrorNotice, SavedNotice } from "./account-section";

/** Name and workspace. Neither is security-relevant, so both save directly. */
export function ProfileForm({ user }: { user: AccountSummary }) {
  const router = useRouter();
  const [errors, setErrors] = useState<{ fullName?: string; workspace?: string }>({});
  const [state, setState] = useState<{ saved?: boolean; error?: string }>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fullName = String(data.get("fullName") ?? "").trim();
    const workspace = String(data.get("workspace") ?? "").trim();

    const nextErrors = {
      fullName: validateRequired(fullName, "full name"),
      workspace: validateRequired(workspace, "company or workspace name"),
    };
    setErrors(nextErrors);
    setState({});
    if (nextErrors.fullName || nextErrors.workspace) return;

    setSaving(true);
    const result = await authService.updateProfile({ fullName, workspace });
    setSaving(false);

    if (!result.ok) {
      setState({ error: result.message });
      return;
    }
    setState({ saved: true });
    // The header and workspace chrome read the account server-side.
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormField
        label="Full name"
        name="fullName"
        autoComplete="name"
        defaultValue={user.fullName}
        error={errors.fullName}
      />
      <FormField
        label="Company / workspace"
        name="workspace"
        autoComplete="organization"
        defaultValue={user.workspace}
        error={errors.workspace}
      />
      {state.saved && <SavedNotice>Saved.</SavedNotice>}
      {state.error && <ErrorNotice>{state.error}</ErrorNotice>}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
