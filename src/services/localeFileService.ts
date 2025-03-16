import * as fs from 'fs-extra';
import * as path from 'path';
import { TranslationsByLanguage } from '../types';

export class LocaleFileService {
  private localesDir: string;

  constructor(localesDir: string) {
    this.localesDir = localesDir;
  }

  async ensureLocalesDirectory(): Promise<void> {
    await fs.ensureDir(this.localesDir);
  }

  async writeTranslationFiles(translations: TranslationsByLanguage): Promise<void> {
    await this.ensureLocalesDirectory();

    const languages = Object.keys(translations);
    
    for (const language of languages) {
      const filePath = path.join(this.localesDir, `${language}.json`);
      await fs.writeJson(filePath, translations[language], { spaces: 2 });
      console.log(`Created ${filePath}`);
    }
  }

  async readTranslationFiles(): Promise<TranslationsByLanguage> {
    await this.ensureLocalesDirectory();
    
    const translations: TranslationsByLanguage = {};
    const files = await fs.readdir(this.localesDir);
    
    // Filter for .json files
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const language = path.basename(file, '.json');
      const filePath = path.join(this.localesDir, file);
      
      try {
        const content = await fs.readJson(filePath);
        translations[language] = content;
        console.log(`Read ${filePath}`);
      } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
      }
    }
    
    return translations;
  }
} 