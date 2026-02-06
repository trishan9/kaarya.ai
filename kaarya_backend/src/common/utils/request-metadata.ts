export type RequestMetadata = {
  ip: string;
  userAgent?: string;
};

export const getRequestMetadata = (
  request: Record<string, unknown> | undefined,
): RequestMetadata => {
  const headers = (request?.['headers'] ?? {}) as Record<string, unknown>;
  const forwardedFor = headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === 'string'
      ? forwardedFor
      : undefined;
  const ip =
    forwardedValue?.split(',')[0]?.trim() ||
    (request?.['ip'] as string | undefined) ||
    (request?.['connection'] as { remoteAddress?: string } | undefined)
      ?.remoteAddress ||
    'unknown';

  const userAgentHeader = headers['user-agent'];
  const userAgent = Array.isArray(userAgentHeader)
    ? userAgentHeader[0]
    : (userAgentHeader as string | undefined);

  return { ip, userAgent };
};
