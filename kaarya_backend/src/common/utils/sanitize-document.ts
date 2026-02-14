type DocumentInput = unknown;

export type TSanitizedDocument = Record<string, unknown> | null;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const sanitizeDocument = (input: DocumentInput): TSanitizedDocument => {
  if (!input) return null;

  const raw = (() => {
    if (
      typeof (input as { toObject?: (options?: unknown) => unknown }).toObject ===
      'function'
    ) {
      return (
        input as {
          toObject: (options?: {
            virtuals?: boolean;
            getters?: boolean;
            flattenObjectIds?: boolean;
          }) => unknown;
        }
      ).toObject({
        virtuals: true,
        getters: true,
        flattenObjectIds: true,
      });
    }

    if (typeof (input as { toJSON?: () => unknown }).toJSON === 'function') {
      return (input as { toJSON: () => unknown }).toJSON();
    }

    return (input as { _doc?: unknown })._doc ?? input;
  })();

  if (!isObject(raw)) return null;

  const data: Record<string, unknown> = { ...raw };
  const id =
    (data.id as string | undefined) ??
    (data._id as { toString?: () => string } | undefined)?.toString?.();

  if (id) {
    data.id = id;
  }

  delete data._id;
  delete data.__v;
  return data;
};
