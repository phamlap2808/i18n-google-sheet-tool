import { google, sheets_v4 } from 'googleapis';
import * as path from 'path';
import { SheetData, TranslationRow } from '../types';

export class GoogleSheetService {
  private sheets: sheets_v4.Sheets;
  private sheetId: string;

  constructor(credentialsPath: string, sheetId: string) {
    this.sheetId = sheetId;
    const auth = new google.auth.GoogleAuth({
      keyFile: path.resolve(credentialsPath),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async getSheetNames(): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.sheetId,
      });

      if (!response.data.sheets) {
        throw new Error('No sheets found in the spreadsheet');
      }

      return response.data.sheets.map(sheet => sheet.properties?.title || '').filter(Boolean);
    } catch (error) {
      console.error('Error fetching sheet names:', error);
      throw error;
    }
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
      }

      // First, clear the existing content (if any)
      try {
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId: this.sheetId,
          range: sheetName,
        });
      } catch (error) {
        // If clearing fails (e.g., because the sheet is new/empty), continue anyway
        console.log(`Could not clear sheet ${sheetName}, continuing with update.`);
      }

      // Then, update with the new content
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetId,
        range: sheetName,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers, ...rows],
        },
      });

      console.log(`Updated sheet: ${sheetName}`);
    } catch (error) {
      console.error(`Error updating sheet ${sheetName}:`, error);
      throw error;
    }
  }
} 