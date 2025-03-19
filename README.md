# i18n Google Sheet Tool

A tool for synchronizing translations between Google Sheets and JSON files for i18n localization.

[🇻🇳 Tiếng Việt](README.vi.md)

## Features

- Two-way synchronization between Google Sheets and JSON files
- Multi-language support
- Automatic sheet creation if not exists
- OAuth2 authentication with Google Sheets API
- Easy integration into existing workflows
- Configurable OAuth callback port to avoid conflicts

## Requirements

- Node.js >= 14
- A Google Cloud Project with Google Sheets API enabled
- OAuth2 credentials from Google Cloud Console

## Installation

```bash
# Global installation
npm install -g git+https://github.com/phamlap2808/i18n-google-sheet-tool.git

# Or as a project dependency
npm install --save-dev git+https://github.com/phamlap2808/i18n-google-sheet-tool.git
```

## Configuration

1. Create a `.env` file in your project root:

```env
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
LOCALES_DIR=./locales
OAUTH_PORT=8591  # Optional, defaults to 8591
```

2. Get Google OAuth2 Credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable Google Sheets API
   - Create OAuth2 credentials:
     - Go to "APIs & Services" > "Credentials"
     - Click "Create Credentials" > "OAuth client ID"
     - Choose "Web application"
     - Add "http://localhost:8591/oauth2callback" to Authorized redirect URIs (or your custom port)
     - Copy Client ID and Client Secret to your `.env` file

## Usage

### First-time Authentication

```bash
# Run the OAuth2 server
ts-node src/server.ts

# In another terminal, run the auth command
i18n-sync --auth
```

### Download from Google Sheets to JSON

```bash
i18n-sync --direction to-json
```

### Upload from JSON to Google Sheets

```bash
i18n-sync --direction to-sheet
```

### Additional Options

```bash
# Specify output directory
i18n-sync --direction to-json --output-dir ./path/to/locales

# Specify Google Sheet ID
i18n-sync --direction to-json --sheet-id your_sheet_id

# Use config file
i18n-sync --direction to-json --config ./config.json
```

## Google Sheet Structure

- Each sheet represents a translation group
- First row is the header with columns:
  - `key`: Translation key
  - Other columns are language codes (e.g., en, vi, de, ...)

Example:
| key | en | vi |
|-----|----|----|
| hello | Hello | Xin chào |
| goodbye | Goodbye | Tạm biệt |

## JSON Structure

```json
{
  "hello": "Hello",
  "goodbye": "Goodbye"
}
```

JSON files will be created in the `locales` directory (or specified directory) with the language code as the filename (e.g., `en.json`, `vi.json`).

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT