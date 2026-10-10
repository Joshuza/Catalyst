export interface OcrReader {
  read(file: File): Promise<{ text: string; confidence: number }>;
}
