type YoutubeSearchResponseItem = {
  id?: { videoId?: string };
  snippet?: { title?: string; channelTitle?: string };
};

type YoutubeVideoCandidate = {
  title?: string;
  youtubeUrl: string;
  channelTitle?: string;
};

export function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host.includes('youtube.com')) {
      const fromQuery = parsed.searchParams.get('v')?.trim();
      if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) {
        return fromQuery;
      }

      const segments = parsed.pathname.split('/').filter(Boolean);
      const isShorts = segments[0] === 'shorts' && segments[1];
      const isEmbed = segments[0] === 'embed' && segments[1];
      const candidate = isShorts ? segments[1] : isEmbed ? segments[1] : null;
      if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
        return candidate;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function verifyYoutubeUrlExists(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: controller.signal },
    );
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchYoutubeVideoCandidates(input: {
  apiKey: string;
  query: string;
  maxResults?: number;
}): Promise<YoutubeVideoCandidate[]> {
  if (!input.apiKey) return [];

  const normalizedMaxResults = Math.max(1, Math.min(5, input.maxResults ?? 3));

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('q', input.query);
    url.searchParams.set('maxResults', String(normalizedMaxResults));
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('safeSearch', 'moderate');
    url.searchParams.set('key', input.apiKey);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    let response: Response;
    try {
      response = await fetch(url.toString(), { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) return [];

    const payload = (await response.json()) as {
      items?: YoutubeSearchResponseItem[];
    };

    const candidates: YoutubeVideoCandidate[] = [];
    for (const item of payload.items ?? []) {
      const videoId = item.id?.videoId?.trim();
      if (!videoId) continue;

      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      candidates.push({
        title: item.snippet?.title,
        youtubeUrl,
        channelTitle: item.snippet?.channelTitle,
      });
    }

    return candidates;
  } catch {
    return [];
  }
}
