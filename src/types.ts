export interface TranslationRow {
    key: string;
    [language: string]: string;
  }
  
  export interface SheetData {
    sheetName: string;
    rows: TranslationRow[];
  }
  
  export interface TranslationsByLanguage {
    [language: string]: {
      [category: string]: {
        [key: string]: string;
      };
    };
  }