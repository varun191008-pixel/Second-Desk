import documentsData from '../data/documents.json';
import type { DocumentItem, Ticker } from '../types';

const STOP_WORDS = new Set(['the', 'a', 'of', 'and', 'to', 'in', 'for', 'on', 'is', 'was', 'are', 'at', 'by', 'an']);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !STOP_WORDS.has(t));
}

function computeTf(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  if (tokens.length === 0) return tf;
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  return tf;
}

export function retrieve(
  query: string,
  ticker: Ticker,
  topK: number = 2,
  disabled: boolean = false,
  docs: DocumentItem[] = documentsData as DocumentItem[]
): DocumentItem[] {
  if (disabled) {
    return [];
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const queryTf = computeTf(queryTokens);
  const nDocs = docs.length;

  // Compute DF across corpus
  const docTokensList = docs.map(d => tokenize(d.text));
  const df = new Map<string, number>();

  for (const tokens of docTokensList) {
    const unique = new Set(tokens);
    for (const t of unique) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }

  // Helper to compute IDF
  const getIdf = (term: string): number => {
    const docFreq = df.get(term) || 0;
    return Math.log((nDocs + 1) / (docFreq + 1)) + 1;
  };

  // Compute query vector and norm
  const queryVec = new Map<string, number>();
  let queryNormSq = 0;
  for (const [term, count] of queryTf.entries()) {
    const weight = count * getIdf(term);
    queryVec.set(term, weight);
    queryNormSq += weight * weight;
  }
  const queryNorm = Math.sqrt(queryNormSq);

  const scoredDocs: { doc: DocumentItem; score: number }[] = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const tokens = docTokensList[i];
    const docTf = computeTf(tokens);

    let dotProduct = 0;
    let docNormSq = 0;

    for (const [term, count] of docTf.entries()) {
      const weight = count * getIdf(term);
      docNormSq += weight * weight;
      if (queryVec.has(term)) {
        dotProduct += (queryVec.get(term) || 0) * weight;
      }
    }

    const docNorm = Math.sqrt(docNormSq);
    const cosine = (queryNorm > 0 && docNorm > 0) ? (dotProduct / (queryNorm * docNorm)) : 0;

    const tickerMatchScore = doc.tickers.includes(ticker) ? 3 : 0;
    const kindBoost = (doc.kind === 'filing' || doc.kind === 'transcript') ? 0.4 : 0;

    const totalScore = tickerMatchScore + cosine + kindBoost;
    scoredDocs.push({ doc, score: totalScore });
  }

  scoredDocs.sort((a, b) => b.score - a.score);

  return scoredDocs.slice(0, topK).map(item => item.doc);
}
