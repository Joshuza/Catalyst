import type { ReceiptResult } from './receipts';
import type { TaskDetails, Profile, DataOf } from './model';
export interface ReceiptParser {
  parse(file: File, date: string): Promise<ReceiptResult>;
}
export type AiContext = {
  title: string;
  details: TaskDetails;
  notes: string;
  workingWeek: Profile['shifts'];
};
export type ProposedStep = { title: string; minutes: number };
export interface AiProvider {
  name: string;
  propose(context: AiContext): Promise<ProposedStep[] | null>;
}
export interface FeedResolver {
  resolve(name: string): Promise<{ name: string; url: string }>;
}
export interface PlaceProvider {
  list(): Promise<{ title: string; data: DataOf<'place'> }[]>;
}
export interface TrailProvider {
  list(): Promise<{ title: string; data: DataOf<'trail'> }[]>;
}

export interface DocumentReader {
  read(file: File): Promise<string>;
}
