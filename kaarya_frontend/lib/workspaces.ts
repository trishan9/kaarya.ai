import type { TCollegeWorkspace, TRecruiterWorkspace } from "./definitions";

type WorkspaceResponseLike = {
  data?: {
    workspaces?: unknown;
  } | null;
} | null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const extractWorkspaceRows = (response: WorkspaceResponseLike) =>
  Array.isArray(response?.data?.workspaces) ? response.data.workspaces : [];

export const extractRecruiterWorkspaces = (rows: unknown[]) =>
  rows.filter(
    (workspace): workspace is TRecruiterWorkspace =>
      typeof (workspace as TRecruiterWorkspace | undefined)?.company?.id ===
      "string",
  );

export const extractCollegeWorkspaces = (rows: unknown[]) =>
  rows.filter(
    (workspace): workspace is TCollegeWorkspace =>
      typeof (workspace as TCollegeWorkspace | undefined)?.college?.id ===
      "string",
  );

export const resolveRecruiterWorkspace = (input: {
  workspaces: TRecruiterWorkspace[];
  requestedId?: string | null;
  fallbackIds?: Array<string | null | undefined>;
}) => {
  const candidateIds = [
    input.requestedId,
    ...(input.fallbackIds ?? []),
  ].filter(isNonEmptyString);

  for (const candidateId of candidateIds) {
    const matched = input.workspaces.find(
      (workspace) => workspace.company?.id === candidateId,
    );
    if (matched) {
      return matched;
    }
  }

  return input.workspaces[0];
};

export const resolveCollegeWorkspace = (input: {
  workspaces: TCollegeWorkspace[];
  requestedId?: string | null;
  fallbackIds?: Array<string | null | undefined>;
}) => {
  const candidateIds = [
    input.requestedId,
    ...(input.fallbackIds ?? []),
  ].filter(isNonEmptyString);

  for (const candidateId of candidateIds) {
    const matched = input.workspaces.find(
      (workspace) => workspace.college?.id === candidateId,
    );
    if (matched) {
      return matched;
    }
  }

  return input.workspaces[0];
};
