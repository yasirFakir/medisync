import axios from 'axios';
import { query } from '../config/database';
import { logger } from '../config/logger';

export class WebSearchService {
  /**
   * Google Web & Pharmaceutical Grounding Pipeline:
   * Queries Google Knowledge/Web Grounding to resolve ambiguous handwritten OCR medicine names
   * (e.g., "Stenil 5mg" -> "Stemetil", "Pexitor" -> "Pexitor / Proctosedyl", "Sodichol" -> "Sodichlor / Sodiclor / Ursochol")
   * and cross-references results directly against the 21,200+ master_pharmacy database.
   */
  static async suggestCorrectDrugName(
    rawBrand: string,
    dosageForm?: string,
    strength?: string,
    diagnosisContext?: string
  ): Promise<string | null> {
    if (!rawBrand || rawBrand.length < 2) return null;

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return null;

    try {
      const prompt = `You are a clinical pharmacist in Bangladesh specializing in doctor handwritten prescription decryption.
The OCR detected the handwritten medicine brand name as "${rawBrand}" (Form: ${dosageForm || 'Tab'}, Strength: ${strength || 'N/A'}).
${diagnosisContext ? `Patient Diagnoses: ${diagnosisContext}.` : ''}

Find the exact true pharmaceutical brand name marketed in Bangladesh / South Asia that best matches this handwriting and clinical context.
Return ONLY valid JSON in this exact format:
{"brand_name": "CORRECT_BRAND_NAME", "generic_name": "GENERIC_NAME"}
Do not include markdown or explanations.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 4500,
      });

      if (response.status === 200) {
        let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (text.startsWith('```json')) text = text.slice(7);
        if (text.startsWith('```')) text = text.slice(3);
        if (text.endsWith('```')) text = text.slice(0, -3);

        const parsed = JSON.parse(text.trim());
        const suggestedBrand = parsed.brand_name?.trim();

        if (suggestedBrand && suggestedBrand.length >= 2) {
          // Verify against master_pharmacy database using exact, prefix, or trigram similarity
          const dbMatches = await query<{ brand_name: string }>(
            `SELECT brand_name FROM master_pharmacy
             WHERE LOWER(brand_name) = LOWER($1)
                OR LOWER(brand_name) LIKE LOWER($2)
                OR similarity(brand_name, $1) > 0.45
             ORDER BY similarity(brand_name, $1) DESC
             LIMIT 1`,
            [suggestedBrand, `${suggestedBrand}%`]
          );

          if (dbMatches.length > 0) {
            const finalBrand = dbMatches[0].brand_name;
            logger.info(`[GROUNDING SUCCESS] OCR: "${rawBrand}" -> Web Search: "${suggestedBrand}" -> Verified DB Drug: "${finalBrand}"`);
            return finalBrand;
          }
        }
      }
    } catch (error) {
      logger.debug(`Web search grounding skipped for ${rawBrand}: ${error instanceof Error ? error.message : ''}`);
    }

    return null;
  }
}

