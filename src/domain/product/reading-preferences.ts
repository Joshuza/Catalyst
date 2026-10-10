import type { Profile, DataOf } from './model';
import { rankReading } from './evolution';
const keywords: Record<string, string[]> = {
  tech: ['technology', 'software', 'computer', 'hardware', 'coding'],
  finance: ['money', 'invest', 'budget', 'saving', 'financial'],
  outdoors: ['hike', 'trail', 'outdoor', 'nature'],
  motorsport: ['formula', 'racing', 'grand prix', 'f1'],
};
export function personalizedReading<
  T extends { title: string; data: DataOf<'news'> },
>(items: T[], today: string, profile: Profile) {
  const priority = (item: T) => {
    const title = item.title.toLowerCase();
    const followed = profile.feeds.some(
      (f) => f.toLowerCase() === item.data.source.toLowerCase(),
    );
    const topic = (profile.mediaTopics ?? []).some((t) =>
      [t.toLowerCase(), ...(keywords[t.toLowerCase()] ?? [])].some((word) =>
        title.includes(word),
      ),
    );
    return Number(followed) * 2 + Number(topic);
  };
  return rankReading(items, today).sort((a, b) => priority(b) - priority(a));
}
