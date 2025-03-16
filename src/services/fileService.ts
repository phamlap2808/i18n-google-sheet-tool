import * as fs from 'fs-extra';
import * as path from 'path';
import { TranslationsByLanguage } from '../types';

export class FileService {
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
} 