import type { GtdContext } from "@/lib/gtd-system";

export interface AecNotificationSettings {
  weeklyReview: boolean;
  dueDates: boolean;
  boardChanges: boolean;
  aiSummary: boolean;
}

export interface AecSettingsState {
  displayName: string;
  avatarLabel: string;
  defaultContext: GtdContext;
  workingHoursStart: string;
  workingHoursEnd: string;
  notifications: AecNotificationSettings;
}

export const aecSettingsStorageKey = "bnj:aec-settings:v1";

export function createDefaultAecSettings(): AecSettingsState {
  return {
    displayName: "BNJ Studio",
    avatarLabel: "BN",
    defaultContext: "office",
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    notifications: {
      weeklyReview: true,
      dueDates: true,
      boardChanges: true,
      aiSummary: true,
    },
  };
}

export function safeParseAecSettings(value: string | null): AecSettingsState {
  const fallback = createDefaultAecSettings();
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value) as Partial<AecSettingsState>;
    return {
      ...fallback,
      ...parsed,
      notifications: {
        ...fallback.notifications,
        ...(parsed.notifications ?? {}),
      },
    };
  } catch {
    return fallback;
  }
}
