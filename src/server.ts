import express, { Request, Response } from 'express';
import { GoogleSheetService } from './services/googleSheetService';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.OAUTH_PORT || 8591; // Using 8591 as default port

app.get('/oauth2callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  
  if (!code) {
    res.status(400).send('No authorization code provided');
    return;
  }

  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID not found in environment variables');
    }

    const googleSheetService = new GoogleSheetService(sheetId);
    await googleSheetService.authorize(code as string);
    
    res.send('Authorization successful! You can close this window and return to the terminal.');
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).send(`Authorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

app.listen(port, () => {
  console.log(`OAuth2 callback server is running at http://localhost:${port}`);
}); 