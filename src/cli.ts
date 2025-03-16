#!/usr/bin/env node

import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import fs from 'fs-extra';
import { GoogleSheetService } from './services/googleSheetService';
import { LocaleFileService } from './services/localeFileService';
import { TranslationProcessor } from './services/translationProcessor';
import { ReverseTranslationProcessor } from './services/reverseTranslationProcessor';

// Load environment variables
dotenv.config();

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('direction', {
    alias: 'd',
    description: 'Sync direction: to-json (from Sheet to JSON) or to-sheet (from JSON to Sheet)',
    type: 'string',
    choices: ['to-json', 'to-sheet'],
    default: 'to-json'
  })
  .option('sheet-id', {
    alias: 's',
    description: 'Google Sheet ID (overrides env variable)',
    type: 'string'
  })
  .option('credentials', {
    alias: 'c',
    description: 'Path to Google API credentials JSON file (overrides env variable)',
    type: 'string'
  })
  .option('output-dir', {
    alias: 'o',
    description: 'Output directory for locales (overrides env variable)',
    type: 'string'
  })
  .option('config', {
    description: 'Path to config file',
    type: 'string'
  })
  .help()
  .alias('help', 'h')
  .parseSync();

// Load config file if provided
let config: Record<string, string> = {};
if (argv.config) {
  try {
    const configPath = path.resolve(process.cwd(), argv.config);
    if (fs.existsSync(configPath)) {
      config = fs.readJsonSync(configPath);
    }
  } catch (error) {
    console.error('Error loading config file:', error);
  }
}

// Get configuration from env vars, config file, or command line arguments
const sheetId = argv['sheet-id'] || config.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_ID;
const credentialsPath = argv.credentials || config.GOOGLE_API_CREDENTIALS || process.env.GOOGLE_API_CREDENTIALS;
const localesDir = argv['output-dir'] || config.LOCALES_DIR || process.env.LOCALES_DIR || './locales';

async function syncFromSheetToJson(
  googleSheetService: GoogleSheetService,
  fileService: LocaleFileService,
  translationProcessor: TranslationProcessor
): Promise<void> {
  // Get all sheet names
  console.log('Fetching Google Sheet pages...');
  const sheetNames = await googleSheetService.getSheetNames();
  console.log(`Found ${sheetNames.length} pages: ${sheetNames.join(', ')}`);

  // Get data from each sheet
  console.log('Processing sheets data...');
  const sheetsData = await Promise.all(
    sheetNames.map(sheetName => googleSheetService.getSheetData(sheetName))
  );

  // Process the data into translations by language
  const translations = translationProcessor.processSheetData(sheetsData);
  
  // Write translation files
  console.log('Writing translation files...');
  await fileService.writeTranslationFiles(translations);
  
  console.log('Translation sync to JSON completed successfully!');
}

async function syncFromJsonToSheet(
  googleSheetService: GoogleSheetService,
  fileService: LocaleFileService,
  reverseProcessor: ReverseTranslationProcessor
): Promise<void> {
  // Read the local JSON files
  console.log('Reading local translation files...');
  const translations = await fileService.readTranslationFiles();
  
  // Convert to sheet data format
  console.log('Converting to Google Sheets format...');
  const sheetsData = reverseProcessor.convertToSheetData(translations);
  
  // Update each sheet
  console.log('Updating Google Sheets...');
  for (const sheetData of sheetsData) {
    const { headers, rows } = reverseProcessor.convertToSpreadsheetRows(sheetData);
    await googleSheetService.updateSheetData(sheetData.sheetName, headers, rows);
  }
  
  console.log('Translation sync to Google Sheets completed successfully!');
}

async function main(): Promise<void> {
  try {
    if (!sheetId || !credentialsPath) {
      throw new Error('Missing required configuration. Please provide Google Sheet ID and credentials path.');
    }

    console.log(`Starting i18n translation sync (${argv.direction})...`);
    
    // Initialize services
    const googleSheetService = new GoogleSheetService(credentialsPath, sheetId);
    const fileService = new LocaleFileService(localesDir);
    const translationProcessor = new TranslationProcessor();
    const reverseProcessor = new ReverseTranslationProcessor();

    // Run sync in appropriate direction
    if (argv.direction === 'to-json') {
      await syncFromSheetToJson(googleSheetService, fileService, translationProcessor);
    } else {
      await syncFromJsonToSheet(googleSheetService, fileService, reverseProcessor);
    }
  } catch (error) {
    console.error('Error during translation sync:', error);
    process.exit(1);
  }
}

main(); 