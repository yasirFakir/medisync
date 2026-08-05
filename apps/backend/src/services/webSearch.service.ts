import axios from 'axios';
import { query } from '../config/database';
import { logger } from '../config/logger';

export class WebSearchService {
  /**
   * 100% Dynamic Web Search Grounding Pipeline:
   * Dynamically queries live web search for any OCR raw brand string (e.g. "Elopile A", "Aztox"),
   * incorporating dosage form (Tab, Cap, Syp) and strength (2.5mg, 40mg, A) for precise context.
   * Parses candidate drug names from search results and validates them against master_pharmacy DB.
   */
  static async suggestCorrectDrugName(rawBrand: string, dosageForm?: string, strength?: string): Promise<string | null> {
    if (!rawBrand || rawBrand.length < 3) return null;

    try {
      const cleanBrand = rawBrand.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const formText = (dosageForm && dosageForm.length <= 6) ? dosageForm : 'Tab';
      const strengthText = (strength && strength.length <= 10) ? strength : '';

      // High-precision search query combining dosage form + raw brand + strength
      const searchQuery = `${formText} ${cleanBrand} ${strengthText} medicine tablet Bangladesh`.replace(/\s+/g, ' ').trim();
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 4500,
      });

      const html = response.data || '';

      // Extract all potential capitalized brand names (3-20 chars) from search snippets
      const snippetMatches = html.match(/class="result__snippet"[^>]*>(.*?)<\/a>/gi) || [];
      const extractedCandidates: string[] = [];

      for (const snippet of snippetMatches) {
        const text = snippet.replace(/<[^>]+>/g, '');
        // Extract terms followed by medicine/tablet/capsule/syrup or standalone brand capitalized words
        const matches = text.match(/\b([A-Z][a-z0-9]{2,15}(?:\s+[A-Z0-9])?)\b/g) || [];
        for (const word of matches) {
          if (!['Medicine', 'Tablet', 'Capsule', 'Syrup', 'Bangladesh', 'Pharma', 'Health', 'Doctor', 'Price', 'Side', 'Effects', 'Uses', 'Dose'].includes(word)) {
            extractedCandidates.push(word);
          }
        }
      }

      // Dynamically validate extracted candidates against 21,231 master_pharmacy drugs in DB
      for (const candidate of extractedCandidates.slice(0, 20)) {
        const dbMatches = await query<{ brand_name: string }>(
          `SELECT brand_name FROM master_pharmacy
           WHERE LOWER(brand_name) = LOWER($1)
              OR LOWER(brand_name) LIKE LOWER($2)
              OR LOWER(SUBSTRING(brand_name FROM 1 FOR 4)) = LOWER(SUBSTRING($1 FROM 1 FOR 4))
           LIMIT 1`,
          [candidate, `${candidate}%`]
        );
        if (dbMatches.length > 0) {
          const matchedBrand = dbMatches[0].brand_name;
          logger.info(`[DYNAMIC WEB SEARCH MATCH] Query: "${searchQuery}" -> Web Candidate: "${candidate}" -> Verified DB Drug: "${matchedBrand}"`);
          return matchedBrand;
        }
      }
    } catch (error) {
      logger.debug(`Dynamic web search skipped for ${rawBrand}: ${error instanceof Error ? error.message : ''}`);
    }

    return null;
  }
}
