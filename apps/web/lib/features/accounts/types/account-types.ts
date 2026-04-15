import type {
  OpenAIAccountRecord,
  TeamAccountRecord,
} from "@workspace/database";

export type AccountKind = "openai" | "team-owner" | "team-member";
export type AccountFilterKind = "all" | AccountKind | "plus";
export type AccountItem = (OpenAIAccountRecord | TeamAccountRecord) & {
  kind: AccountKind;
};

export type ConfirmDialogState = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  action: null | (() => Promise<void>);
};

export type SubmitMode = "create" | "relogin";

export type WorkspaceChoice = {
  id: string;
  name: string | null;
  kind: string | null;
  planType: string | null;
};

/**
 * Finite state machine for the account login flow.
 *
 * Legal transitions:
 *   idle ──START──► credentials
 *   credentials ──OTP_REQUIRED──► pending_otp
 *   credentials ──WORKSPACE_REQUIRED──► pending_workspace
 *   credentials ──SUCCESS──► done
 *   credentials ──ERROR──► idle
 *   pending_otp ──WORKSPACE_REQUIRED──► pending_workspace
 *   pending_otp ──SUCCESS──► done
 *   pending_workspace ──SUCCESS──► done
 *   any ──RESET──► idle
 */
export type LoginPhase =
  | { type: "idle" }
  | { type: "credentials" }
  | { type: "pending_otp"; sessionId: string }
  | { type: "pending_workspace"; sessionId: string; choices: WorkspaceChoice[] }
  | { type: "done" };

export type LoginEvent =
  | { type: "START" }
  | { type: "OTP_REQUIRED"; sessionId: string }
  | {
      type: "WORKSPACE_REQUIRED";
      sessionId: string;
      choices: WorkspaceChoice[];
    }
  | { type: "SUCCESS" }
  | { type: "ERROR" }
  | { type: "RESET" };

export function transitionLoginPhase(
  phase: LoginPhase,
  event: LoginEvent,
): LoginPhase {
  switch (phase.type) {
    case "idle":
      if (event.type === "START") return { type: "credentials" };
      break;
    case "credentials":
      if (event.type === "OTP_REQUIRED")
        return { type: "pending_otp", sessionId: event.sessionId };
      if (event.type === "WORKSPACE_REQUIRED")
        return {
          type: "pending_workspace",
          sessionId: event.sessionId,
          choices: event.choices,
        };
      if (event.type === "SUCCESS") return { type: "done" };
      if (event.type === "ERROR") return { type: "idle" };
      break;
    case "pending_otp":
      if (event.type === "WORKSPACE_REQUIRED")
        return {
          type: "pending_workspace",
          sessionId: event.sessionId,
          choices: event.choices,
        };
      if (event.type === "SUCCESS") return { type: "done" };
      break;
    case "pending_workspace":
      if (event.type === "SUCCESS") return { type: "done" };
      break;
  }
  if (event.type === "RESET") return { type: "idle" };
  return phase;
}

export type SavedAccountSummary = {
  email: string;
  accountUserRole: string | null;
  planType: string | null;
  teamMemberCount: number | null;
};

export type TeamOwnerAvailableSlotsResponse = {
  ok?: boolean;
  error?: string;
  teamMemberCount?: number;
  pendingInvites?: number;
  availableSlots?: number;
};

export type TeamOwnerFillState = {
  availableSlots: number;
  missingMembers: number;
};

export type TeamOwnerMemberItem = {
  id: string;
  email: string;
  role: string | null;
  name: string | null;
  status: string | null;
};

export type AccountTranslationKey =
  | "accounts.kindOpenAI"
  | "accounts.kindTeamOwner"
  | "accounts.kindTeamMember"
  | "accounts.kindPlus"
  | "accounts.autoFillMembersTitle"
  | "accounts.autoFillMembersDescription"
  | "accounts.autoFillMembersConfirm"
  | "accounts.autoFillMembersQueued"
  | "accounts.autoFillMembersQueueFailed"
  | "status.active"
  | "status.disabled"
  | "status.coolingDown";
