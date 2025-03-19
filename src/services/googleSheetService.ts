import { google } from 'googleapis';
import { SheetData, TranslationRow } from '../types';
import { OAuth2Client, Credentials } from 'google-auth-library';
import fs from 'fs-extra';
import path from 'path';

export class GoogleSheetService {
  private sheets;
  private auth: OAuth2Client;
  private sheetId: string;
  private readonly tokenPath: string;
  private readonly port: number;

  constructor(sheetId: string) {
    this.sheetId = sheetId;
    this.tokenPath = path.join(process.cwd(), '.google-token.json');
    this.port = parseInt(process.env.OAUTH_PORT || '8591', 10);
    
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `http://localhost:${this.port}/oauth2callback`
    );

    // Try to load existing token
    this.loadSavedToken();
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  private loadSavedToken(): void {
    try {
      if (fs.existsSync(this.tokenPath)) {
        const token = fs.readJsonSync(this.tokenPath);
        this.auth.setCredentials(token);
      }
    } catch (error) {
      console.log('No saved token found or token is invalid');
    }
  }

  private async saveToken(tokens: Credentials): Promise<void> {
    try {
      await fs.writeJson(this.tokenPath, tokens);
      console.log('Token saved successfully');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async startAuthFlow(): Promise<void> {
    const authUrl = this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/spreadsheets']
    });

    console.log('Opening browser for authentication...');
    console.log('If the browser does not open automatically, please visit this URL:', authUrl);
    
    try {
      // Using dynamic import for ESM compatibility
      const { default: open } = await import('open').catch(() => ({ default: null }));
      if (open) {
        await open(authUrl);
      }
    } catch (error) {
      console.log('Could not open browser automatically. Please visit the URL manually.');
    }
  }

  async authorize(code: string): Promise<void> {
    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);
    await this.saveToken(tokens);
  }

  getAuthUrl(): string {
    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/spreadsheets']
    });
  }

  async getSheetNames(): Promise<string[]> {
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId: this.sheetId
    });

    return response.data.sheets?.map(sheet => sheet.properties?.title || '') || [];
  }

  async sheetExists(sheetName: string): Promise<boolean> {
    const sheetNames = await this.getSheetNames();
    return sheetNames.includes(sheetName);
  }

  async createSheet(sheetName: string): Promise<void> {
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.sheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });
      console.log(`Created new sheet: ${sheetName}`);
    } catch (error) {
      console.error(`Error creating sheet ${sheetName}:`, error);
      throw error;
    }
  }

  async getSheetData(sheetName: string): Promise<SheetData> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: sheetName,
      });

      const rows = response.data.values;
      if (!rows || rows.length < 2) {
        throw new Error(`No data found in sheet ${sheetName}`);
      }

      // First row is headers: key, en, vi, de, etc.
      const headers = rows[0] as string[];
      const keyIndex = headers.findIndex(header => header.toLowerCase() === 'key');
      
      if (keyIndex === -1) {
        throw new Error(`No 'key' column found in sheet ${sheetName}`);
      }

      // Map the data rows to objects
      const dataRows = rows.slice(1).map(row => {
        const translationRow: TranslationRow = { key: row[keyIndex] || '' };
        
        headers.forEach((header, index) => {
          if (index !== keyIndex && header) {
            translationRow[header] = row[index] || '';
          }
        });
        
        return translationRow;
      });

      return {
        sheetName,
        rows: dataRows,
      };
    } catch (error) {
      console.error(`Error fetching data from sheet ${sheetName}:`, error);
      throw error;
    }
  }

  async updateSheetData(sheetName: string, headers: string[], rows: string[][]): Promise<void> {
    try {
      // Check if the sheet exists, create it if it doesn't
      const exists = await this.sheetExists(sheetName);
      if (!exists) {
        console.log(`Sheet ${sheetName} does not exist. Creating it...`);
        await this.createSheet(sheetName);
        
        // Wait a bit for the sheet to be fully created
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Only clear existing content if the sheet already exists
        try {
          await this.sheets.spreadsheets.values.clear({
            spreadsheetId: this.sheetId,
            range: sheetName,
          });
        } catch (error) {
          console.log(`Could not clear sheet ${sheetName}, continuing with update.`);
        }
      }

      // Update with the new content
      const values = [headers, ...rows];
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetId,
        range: sheetName,
        valueInputOption: 'RAW',
        requestBody: {
          values
        },
      });

      console.log(`Updated sheet: ${sheetName}`);
    } catch (error) {
      console.error(`Error updating sheet ${sheetName}:`, error);
      throw error;
    }
  }
} 