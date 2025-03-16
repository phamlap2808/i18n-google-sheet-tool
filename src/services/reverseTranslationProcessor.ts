import { TranslationsByLanguage, SheetData, TranslationRow } from '../types';

export class ReverseTranslationProcessor {
  convertToSheetData(translations: TranslationsByLanguage): SheetData[] {
    if (Object.keys(translations).length === 0) {
      return [];
    }

    // Extract all page names/categories
    const pages = new Set<string>();
    
    // Get all available languages
    const languages = Object.keys(translations);
    
    // For each language, collect all page names
    for (const language of languages) {
      const pageNames = Object.keys(translations[language]);
      pageNames.forEach(page => pages.add(page));
    }

    // Convert to sheet data
    const sheetsData: SheetData[] = [];
    
    for (const page of pages) {
      // Get all keys used across all languages
      const allKeys = new Set<string>();
      
      for (const language of languages) {
        if (translations[language][page]) {
          Object.keys(translations[language][page]).forEach(key => allKeys.add(key));
        }
      }
      
      // Create rows
      const rows = Array.from(allKeys).map(key => {
        const row: { [key: string]: string } = { key };
        
        // Add translation for each language
        for (const language of languages) {
          if (translations[language][page] && translations[language][page][key]) {
            row[language] = translations[language][page][key];
          } else {
            row[language] = ''; // Empty string if translation not found
          }
        }
        
        return row;
      });
      
      sheetsData.push({
        sheetName: page,
        rows: rows as TranslationRow[],
      });
    }
    
    return sheetsData;
  }

  convertToSpreadsheetRows(sheetData: SheetData): {
    headers: string[];
    rows: string[][];
  } {
    if (sheetData.rows.length === 0) {
      return { headers: ['key'], rows: [] };
    }
    
    // Determine all headers from the first row
    const firstRow = sheetData.rows[0];
    const headers = ['key', ...Object.keys(firstRow).filter(key => key !== 'key')];
    
    // Convert rows to array format for Google Sheets
    const rows = sheetData.rows.map(row => {
      return headers.map(header => row[header] || '');
    });
    
    return {
      headers,
      rows,
    };
  }
} 