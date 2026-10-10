import { z } from 'zod';
import {
  moduleSchema,
  taskDetailSchema,
  shiftSchema,
} from '../../domain/product/model';
import type {
  AiContext,
  AiProvider,
  ProposedStep,
  FeedResolver,
  PlaceProvider,
  TrailProvider,
} from '../../domain/product/providers';
export class ManualAiProvider implements AiProvider {
  name = 'Manual';
  async propose() {
    return null;
  }
}
export class MockAiProvider implements AiProvider {
  name = 'Sample AI';
  async propose(context: AiContext): Promise<ProposedStep[]> {
    z.object({
      title: z.string().min(1).max(300),
      details: taskDetailSchema,
      notes: z.string().max(20000),
      workingWeek: z.array(shiftSchema),
    })
      .strict()
      .parse(context);
    return [
      { title: 'Read the sources and requirements', minutes: 60 },
      { title: 'Build an outline', minutes: 45 },
      { title: 'Write the first draft', minutes: 120 },
      { title: 'Revise and submit', minutes: 60 },
    ];
  }
}
export class ManualFeedResolver implements FeedResolver {
  async resolve(name: string) {
    const clean = name.trim();
    if (!clean || clean.length > 300)
      throw new Error('Enter a publication name or link.');
    if (/^https?:\/\//i.test(clean)) {
      const url = new URL(clean);
      return { name: url.hostname, url: clean };
    }
    return { name: clean, url: '' };
  }
}
export class MockFeedResolver extends ManualFeedResolver {}
export class ManualPlaceProvider implements PlaceProvider {
  constructor(
    private values: Awaited<ReturnType<PlaceProvider['list']>> = [],
  ) {}
  async list() {
    return this.values.map((v) => ({
      title: z.string().min(1).max(300).parse(v.title),
      data: validatePlace(v.data),
    }));
  }
}
export class MockPlaceProvider extends ManualPlaceProvider {}
export class ManualTrailProvider implements TrailProvider {
  constructor(
    private values: Awaited<ReturnType<TrailProvider['list']>> = [],
  ) {}
  async list() {
    return this.values.map((v) => ({
      title: z.string().min(1).max(300).parse(v.title),
      data: validateTrail(v.data),
    }));
  }
}
export class MockTrailProvider extends ManualTrailProvider {}

function validatePlace(value: unknown) {
  const parsed = moduleSchema.parse(value);
  if (parsed.type !== 'place') throw new Error('Expected a place.');
  return parsed;
}
function validateTrail(value: unknown) {
  const parsed = moduleSchema.parse(value);
  if (parsed.type !== 'trail') throw new Error('Expected a trail.');
  return parsed;
}
