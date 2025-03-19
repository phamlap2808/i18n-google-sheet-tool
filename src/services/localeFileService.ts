import * as fs from 'fs-extra';
import * as path from 'path';
import { TranslationsByLanguage } from '../types';

export class LocaleFileService {
  private localesDir: string;

  constructor(localesDir: string) {
    this.localesDir = localesDir;
  }

  async cleanLocalesDirectory(): Promise<void> {
    if (await fs.pathExists(this.localesDir)) {
      await fs.remove(this.localesDir);
      console.log(`Cleaned up ${this.localesDir} directory`);
    }
  }

  async ensureLocalesDirectory(): Promise<void> {
    await fs.ensureDir(this.localesDir);
  }

  async writeTranslationFiles(translations: TranslationsByLanguage): Promise<void> {
    // Clean up existing directory first
    await this.cleanLocalesDirectory();
    await this.ensureLocalesDirectory();

    const languages = Object.keys(translations);
    
    for (const language of languages) {
      // Create language directory
      const langDir = path.join(this.localesDir, language);
      await fs.ensureDir(langDir);
      
      // Get all sheets/categories for this language
      const categories = Object.keys(translations[language]);
      
      // Write each category to a separate file
      for (const category of categories) {
        const filePath = path.join(langDir, `${category}.json`);
        await fs.writeJson(filePath, translations[language][category], { spaces: 2 });
        console.log(`Created ${filePath}`);
      }
    }
  }

  async readTranslationFiles(): Promise<TranslationsByLanguage> {
    await this.ensureLocalesDirectory();
    
    const translations: TranslationsByLanguage = {};
    
    // Read all language directories
    const langDirs = await fs.readdir(this.localesDir);
    
    for (const langDir of langDirs) {
      const langPath = path.join(this.localesDir, langDir);
      
      // Skip if not a directory
      if (!(await fs.stat(langPath)).isDirectory()) continue;
      
      translations[langDir] = {};
      
      // Read all JSON files in the language directory
      const files = await fs.readdir(langPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const category = path.basename(file, '.json');
        const filePath = path.join(langPath, file);
        
        try {
          const content = await fs.readJson(filePath);
          
          // Validate content is an object
          if (typeof content !== 'object' || content === null || Array.isArray(content)) {
            console.warn(`Warning: ${filePath} does not contain a valid translation object, skipping...`);
            continue;
          }
          
          translations[langDir][category] = content;
          console.log(`Read ${filePath}`);
        } catch (error) {
          if (error instanceof SyntaxError) {
            console.warn(`Warning: ${filePath} contains invalid JSON, skipping...`);
          } else {
            console.error(`Error reading ${filePath}:`, error);
          }
        }
      }
    }
    
    return translations;
  }
} 