"use client";

import { useState } from "react";
import type { LocaleKey } from "@/locales";
import { transitionLoginPhase } from "@/lib/features/accounts/types/account-types";
import type {
  LoginPhase,
  SavedAccountSummary,
  SubmitMode,
} from "@/lib/features/accounts/types/account-types";
import { emptyForm } from "@/lib/features/accounts/utils/account-utils";
import { useAccountLoginActions } from "./use-account-login-actions";

export function useAccountSubmitFlow(props: {
  t: (key: LocaleKey) => string;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
  refresh: () => void;
  setActingEmail: React.Dispatch<React.SetStateAction<string | null>>;
  onAccountSaved: (
    account: SavedAccountSummary | null,
    mode: SubmitMode,
  ) => Promise<void> | void;
}) {
  const { t, toast, refresh, setActingEmail, onAccountSaved } = props;
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitMode, setSubmitMode] = useState<SubmitMode>("create");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");

  // FSM: single phase state replaces loginSessionId + requiresManualOtp + workspaceChoices.
  // Legal transitions: idle → credentials → pending_otp | pending_workspace → done
  const [phase, setPhase] = useState<LoginPhase>({ type: "idle" });

  const closeSubmitDialog = () => {
    setSubmitOpen(false);
    setSubmitMode("create");
    setForm(emptyForm());
    setSelectedWorkspaceId("");
    setPhase((prev) => transitionLoginPhase(prev, { type: "RESET" }));
  };

  const {
    startLogin,
    verifyOtpAndContinue,
    completeWorkspaceAndContinue,
    openReloginDialog,
  } = useAccountLoginActions({
    t,
    toast,
    refresh,
    submitMode,
    form,
    phase,
    selectedWorkspaceId,
    setActingEmail,
    setSubmitOpen,
    setSubmitting,
    setSubmitMode,
    setForm,
    setPhase,
    setSelectedWorkspaceId,
    onAccountSaved,
  });

  return {
    submitOpen,
    submitMode,
    submitting,
    form,
    phase,
    selectedWorkspaceId,
    // Derived helpers kept for backward-compatible consumption in UI components.
    loginSessionId:
      phase.type === "pending_otp" || phase.type === "pending_workspace"
        ? phase.sessionId
        : null,
    requiresManualOtp: phase.type === "pending_otp",
    workspaceChoices: phase.type === "pending_workspace" ? phase.choices : [],
    setSubmitOpen,
    setSubmitMode,
    setSelectedWorkspaceId,
    setForm,
    closeSubmitDialog,
    submitAccount: () => startLogin(),
    verifyOtp: verifyOtpAndContinue,
    completeWorkspaceSelection: completeWorkspaceAndContinue,
    openReloginDialog,
  };
}
