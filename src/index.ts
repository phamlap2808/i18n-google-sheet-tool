import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
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
  .help()
  .alias('help', 'h')
  .parseSync();

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
    // Get config from env variables
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const credentialsPath = process.env.GOOGLE_API_CREDENTIALS;
    const localesDir = process.env.LOCALES_DIR || './locales';

    if (!sheetId || !credentialsPath) {
      throw new Error('Missing required environment variables. Please check your .env file.');
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