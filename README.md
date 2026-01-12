# JSON Diff

A simple web tool to sort and compare JSON files side-by-side.

## Features

- **Sort JSON** - Automatically sorts JSON objects alphabetically by keys (recursive)
- **Compare** - Highlights differences between two JSON files
- **Multiple input methods** - Upload files or paste raw JSON
- **Visual diff** - Color-coded display showing:
  - Added keys (green)
  - Removed keys (red)
  - Modified values (yellow)
- **Statistics** - Shows count of added, removed, modified, and unchanged keys
- **Syntax highlighting** - JSON output with color-coded syntax
- **Drag & drop** - Supports drag and drop file uploads

## Getting Started

### Prerequisites

- Node.js (v14 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/KT-afk/json-diff.git
cd json-diff

# Install dependencies
npm install

# Start the server
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Static Usage

You can also open `public/index.html` directly in a browser without running the server.

## Usage

1. Choose input method: **Upload Files** or **Paste JSON**
2. Provide two JSON inputs
3. Click **Sort & Compare**
4. View the results:
   - Left panel: First JSON (sorted)
   - Middle panel: Differences
   - Right panel: Second JSON (sorted)

## Project Structure

```
json-diff/
├── public/
│   ├── index.html      # Main HTML file
│   ├── favicon.svg     # Site favicon
│   ├── css/
│   │   └── styles.css  # Styles
│   └── js/
│       └── app.js      # Application logic
├── server.js           # Express server
├── package.json
└── README.md
```

## Tech Stack

- Vanilla JavaScript (no frameworks)
- Express.js (for serving static files)
- CSS3

## License

MIT
