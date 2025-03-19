import { SheetData, TranslationsByLanguage } from '../types';

export class TranslationProcessor {
  processSheetData(sheetsData: SheetData[]): TranslationsByLanguage {
    const translations: TranslationsByLanguage = {};

    for (const sheetData of sheetsData) {
      const { sheetName, rows } = sheetData;

      if (rows.length === 0) continue;

      // Get all available languages from the first row
      const languages = Object.keys(rows[0]).filter(key => key !== 'key');

      // Initialize language objects if not already done
      for (const language of languages) {
        if (!translations[language]) {
          translations[language] = {};
        }
      }

      // Process each row
      for (const row of rows) {
        const key = row.key.trim();
        
        // Skip empty keys
        if (!key) continue;

        // Add translation for each language
        for (const language of languages) {
          if (!translations[language][sheetName]) {
            translations[language][sheetName] = {};
          }
          const translation = row[language]?.trim() || '';
          translations[language][sheetName][key] = translation;
        }
      }
    }

    return translations;
  }
} 