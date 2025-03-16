# i18n Google Sheet Tool

A tool for synchronizing translations between Google Sheets and JSON files for multilingual (i18n) support.

## What does this tool do?

This tool helps you:

1. **Sync from Google Sheets to JSON files** - Fetch data from Google Sheets and save it as JSON files
2. **Sync from JSON files to Google Sheets** - Update Google Sheets with data from your JSON files

## Installation

### Option 1: Install globally

```bash
# Install from GitHub
npm install -g git+https://github.com/yourusername/i18n-google-sheet-tool.git

# Use from anywhere
i18n-sync --direction to-json --sheet-id YOUR_SHEET_ID --credentials ./credentials.json
```

### Option 2: Use in a project

```bash
# Add to your project
npm install --save-dev git+https://github.com/yourusername/i18n-google-sheet-tool.git

# Add to your package.json scripts
"scripts": {
  "i18n:download": "i18n-sync --direction to-json",
  "i18n:upload": "i18n-sync --direction to-sheet"
}
```

### Option 3: Clone and use directly

```bash
# Clone the repository
git clone https://github.com/yourusername/i18n-google-sheet-tool.git
cd i18n-google-sheet-tool

# Install dependencies
npm install

# Build the project
npm run build
```

## Setup Guide

### Step 1: Set up Google Sheets API

1. **Create a project on Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select an existing one)

2. **Enable Google Sheets API**:
   - Find and enable "Google Sheets API" in the API library

3. **Create a Service Account**:
   - Go to "APIs & Services" > "Credentials"
   - Select "Create Credentials" > "Service Account"
   - Fill in the details and download the JSON key file

4. **Share your Google Sheet**:
   - Open your Google Sheet
   - Click the "Share" button
   - Add the service account email (found in the JSON file) with edit permissions

### Step 2: Configure the tool

Choose one of these configuration methods:

#### Method 1: Environment variables

Create a `.env` file:

```
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_API_CREDENTIALS=path_to_credentials_json_file
LOCALES_DIR=./locales
```

#### Method 2: Command line arguments

```bash
i18n-sync --sheet-id=your_sheet_id --credentials=./credentials.json --output-dir=./locales
```

#### Method 3: Config file

Create a `i18n-config.json` file:

```json
{
  "GOOGLE_SHEET_ID": "your_sheet_id",
  "GOOGLE_API_CREDENTIALS": "./credentials.json",
  "LOCALES_DIR": "./locales"
}
```

Then use it:

```bash
i18n-sync --config=i18n-config.json
```

## Using the Tool

### Sync from Google Sheets to JSON (download)

```bash
# Using the CLI
i18n-sync --direction to-json

# Using npm scripts
npm run sync:to-json
```

### Sync from JSON to Google Sheets (upload)

```bash
# Using the CLI
i18n-sync --direction to-sheet

# Using npm scripts
npm run sync:to-sheet
```

## CLI Options

```
Options:
  -d, --direction    Sync direction: to-json (from Sheet to JSON) or to-sheet
                    (from JSON to Sheet)  [choices: "to-json", "to-sheet"] [default: "to-json"]
  -s, --sheet-id     Google Sheet ID (overrides env variable)
  -c, --credentials  Path to Google API credentials JSON file (overrides env variable)
  -o, --output-dir   Output directory for locales (overrides env variable)
  --config           Path to config file
  -h, --help         Show help
```

## Data Format

### Google Sheets Format

- Each sheet (page) in Google Sheets corresponds to a section in the JSON file
- Each sheet must have the following format:

| key | en | vi | de | ... |
|-----|----|----|----|----|
| hello | Hello | Xin Chào | Hallo | ... |
| welcome | Welcome | Chào mừng | Willkommen | ... |
| goodbye | Goodbye | Tạm biệt | Auf Wiedersehen | ... |

### JSON Format

After synchronization, the JSON files will have the following structure:

```json
{
  "sheet_name_1": {
    "hello": "Hello",
    "welcome": "Welcome",
    "goodbye": "Goodbye"
  },
  "sheet_name_2": {
    "key1": "Value 1",
    "key2": "Value 2"
  }
}
```

Each language will have its own JSON file:
```
locales/
├── en.json
├── vi.json
├── de.json
└── ...
```

## Special Features

- **Automatic Sheet Creation**: When syncing from JSON to Google Sheets, the tool automatically creates new sheets if it finds sections that don't exist in the Google Sheets.
- **Multi-language Support**: Automatically handles multiple languages simultaneously (en, vi, de, ...)
- **Bidirectional Sync**: Flexibility to edit at either end (Google Sheets or JSON)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 