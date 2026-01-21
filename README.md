# JSON Diff

A web tool to sort and compare JSON files, diff ECS task definitions, and generate ECS secrets from AWS Secrets Manager.

## Features

### Standard Mode
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

### ECS Task Definition Mode
- **Compare ECS containers** - Extracts and compares the main container from ECS task definitions
- **Smart container detection** - Automatically finds the main container (filters out sidecars like envoy, xray-daemon)
- **Focused comparison** - Shows differences in:
  - Container image/tag
  - Environment variables
  - Secrets
- **Flexible input formats** - Accepts full task definitions, containerDefinitions arrays, or partial snippets

### Secrets Generator Mode
- **Generate ECS secrets** - Converts AWS Secrets Manager JSON to ECS task definition secrets format
- **Sorted output** - Keys are sorted alphabetically
- **Copy to clipboard** - One-click copy of generated secrets array

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

### Standard JSON Comparison

1. Select **Standard** mode
2. Choose input method: **Upload Files** or **Paste JSON**
3. Provide two JSON inputs
4. Click **Sort & Compare**
5. View the results:
   - Left panel: First JSON (sorted)
   - Middle panel: Differences
   - Right panel: Second JSON (sorted)

#### Example - Standard Mode

**File 1:**
```json
{
  "name": "my-app",
  "version": "1.0.0",
  "debug": true
}
```

**File 2:**
```json
{
  "name": "my-app",
  "version": "2.0.0",
  "logging": true
}
```

**Result:** Shows `version` as modified, `debug` as removed, `logging` as added.

---

### ECS Task Definition Comparison

1. Select **ECS Task Def** mode
2. Paste or upload two ECS task definitions (full or partial)
3. Click **Sort & Compare**
4. View differences in image, environment variables, and secrets

#### Example - ECS Task Def Mode

**File 1 (Full task definition):**
```json
{
  "family": "my-service",
  "containerDefinitions": [
    {
      "name": "my-app",
      "image": "my-repo/my-app:v1.0.0",
      "environment": [
        { "name": "LOG_LEVEL", "value": "info" },
        { "name": "DB_HOST", "value": "localhost" }
      ],
      "secrets": [
        { "name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:my-secret:DB_PASSWORD::" }
      ]
    }
  ]
}
```

**File 2 (Partial - just the container):**
```json
{
  "name": "my-app",
  "image": "my-repo/my-app:v2.0.0",
  "environment": [
    { "name": "LOG_LEVEL", "value": "debug" },
    { "name": "ENABLE_METRICS", "value": "true" }
  ],
  "secrets": [
    { "name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:my-secret:DB_PASSWORD::" },
    { "name": "API_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:my-secret:API_KEY::" }
  ]
}
```

**Result:**
- Image: Changed from `v1.0.0` to `v2.0.0`
- Environment: `LOG_LEVEL` modified, `DB_HOST` removed, `ENABLE_METRICS` added
- Secrets: `API_KEY` added

#### Supported ECS Input Formats

The tool accepts multiple ECS JSON formats:

```json
// Full task definition
{ "family": "...", "containerDefinitions": [...] }

// Just containerDefinitions array
[{ "name": "my-app", "image": "...", ... }]

// Single container object
{ "name": "my-app", "image": "...", "environment": [...], "secrets": [...] }

// Partial snippet (auto-wrapped)
"environment": [...]
"secrets": [...]
```

---

### Secrets Generator

1. Select **Secrets Generator** mode
2. Enter the AWS Secret ARN (e.g., `arn:aws:secretsmanager:ap-southeast-1:123456789:secret:my-secret-AbCdEf`)
3. Paste the Secrets Manager JSON (key-value pairs)
4. Click **Generate Secrets**
5. Copy the output to your ECS task definition

#### Example - Secrets Generator

**Input ARN:**
```
arn:aws:secretsmanager:ap-southeast-1:123456789:secret:my-app-secrets-AbCdEf
```

**Input JSON (from Secrets Manager):**
```json
{
  "DB_HOST": "mydb.cluster.rds.amazonaws.com",
  "DB_USERNAME": "admin",
  "DB_PASSWORD": "supersecret123",
  "API_KEY": "sk-abc123xyz"
}
```

**Generated Output:**
```json
                {
                    "name": "API_KEY",
                    "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:123456789:secret:my-app-secrets-AbCdEf:API_KEY::"
                },
                {
                    "name": "DB_HOST",
                    "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:123456789:secret:my-app-secrets-AbCdEf:DB_HOST::"
                },
                {
                    "name": "DB_PASSWORD",
                    "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:123456789:secret:my-app-secrets-AbCdEf:DB_PASSWORD::"
                },
                {
                    "name": "DB_USERNAME",
                    "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:123456789:secret:my-app-secrets-AbCdEf:DB_USERNAME::"
                }
```

Copy this directly into your ECS task definition's `secrets` array.

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
