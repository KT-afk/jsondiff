// State
let comparisons = [{ json1: null, json2: null, fileName1: '', fileName2: '', raw1: '', raw2: '', secretArn: '', secretsJson: '' }];
let inputMode = 'file'; // 'file' or 'raw'
let compareMode = 'standard'; // 'standard', 'ecs', or 'secretsGen'

// DOM Elements
const compareBtn = document.getElementById('compareBtn');
const clearBtn = document.getElementById('clearBtn');
const stats = document.getElementById('stats');
const legend = document.getElementById('legend');
const results = document.getElementById('results');
const toggleFile = document.getElementById('toggleFile');
const toggleRaw = document.getElementById('toggleRaw');
const fileSection = document.getElementById('fileSection');
const rawSection = document.getElementById('rawSection');
const secretsGenSection = document.getElementById('secretsGenSection');
const addComparisonBtn = document.getElementById('addComparisonBtn');

// Event Listeners
compareBtn.addEventListener('click', compare);
clearBtn.addEventListener('click', clearAll);
toggleFile.addEventListener('click', () => setInputMode('file'));
toggleRaw.addEventListener('click', () => setInputMode('raw'));
if (addComparisonBtn) {
    addComparisonBtn.addEventListener('click', addComparison);
}

// Compare mode toggle (if elements exist)
const toggleStandard = document.getElementById('toggleStandard');
const toggleEcs = document.getElementById('toggleEcs');
const toggleSecretsGen = document.getElementById('toggleSecretsGen');
if (toggleStandard && toggleEcs) {
    toggleStandard.addEventListener('click', () => setCompareMode('standard'));
    toggleEcs.addEventListener('click', () => setCompareMode('ecs'));
}
if (toggleSecretsGen) {
    toggleSecretsGen.addEventListener('click', () => setCompareMode('secretsGen'));
}

// Add/Remove comparison pairs
function addComparison() {
    comparisons.push({ json1: null, json2: null, fileName1: '', fileName2: '', raw1: '', raw2: '', secretArn: '', secretsJson: '' });
    renderInputs();
}

function removeComparison(index) {
    if (comparisons.length > 1) {
        comparisons.splice(index, 1);
        renderInputs();
    }
}

// Render all input sections based on current mode
function renderInputs() {
    if (compareMode === 'secretsGen') {
        renderSecretsInputs();
    } else if (inputMode === 'file') {
        renderFileInputs();
    } else {
        renderRawInputs();
    }
}

// Render file upload cards for all comparison pairs
function renderFileInputs() {
    let html = '';
    comparisons.forEach((comp, index) => {
        html += `
            <div class="comparison-group" data-index="${index}">
                ${comparisons.length > 1 ? `<div class="comparison-header">
                    <span class="comparison-label">Comparison ${index + 1}</span>
                    <button class="remove-btn" onclick="removeComparison(${index})">Remove</button>
                </div>` : ''}
                <div class="upload-pair">
                    <div class="upload-card" id="dropzone1-${index}">
                        <div class="upload-icon">1</div>
                        <h3>First JSON File</h3>
                        <input type="file" id="file1-${index}" accept=".json" onchange="handleFileSelect(event, ${index}, 1)" />
                        <label for="file1-${index}" class="upload-btn">Choose File</label>
                        <span class="file-name ${comp.fileName1 ? 'selected' : ''}" id="fileName1-${index}">${comp.fileName1 || 'No file selected'}</span>
                    </div>
                    <div class="upload-card" id="dropzone2-${index}">
                        <div class="upload-icon">2</div>
                        <h3>Second JSON File</h3>
                        <input type="file" id="file2-${index}" accept=".json" onchange="handleFileSelect(event, ${index}, 2)" />
                        <label for="file2-${index}" class="upload-btn">Choose File</label>
                        <span class="file-name ${comp.fileName2 ? 'selected' : ''}" id="fileName2-${index}">${comp.fileName2 || 'No file selected'}</span>
                    </div>
                </div>
            </div>
        `;
    });
    fileSection.innerHTML = html;

    // Setup drag and drop for all dropzones
    comparisons.forEach((_, index) => {
        setupDragDrop(document.getElementById(`dropzone1-${index}`), index, 1);
        setupDragDrop(document.getElementById(`dropzone2-${index}`), index, 2);
    });
}

// Render raw JSON textareas for all comparison pairs
function renderRawInputs() {
    let html = '';
    comparisons.forEach((comp, index) => {
        html += `
            <div class="comparison-group" data-index="${index}">
                ${comparisons.length > 1 ? `<div class="comparison-header">
                    <span class="comparison-label">Comparison ${index + 1}</span>
                    <button class="remove-btn" onclick="removeComparison(${index})">Remove</button>
                </div>` : ''}
                <p class="section-description">Paste one JSON per box, or paste both JSONs in the first box (they'll be auto-split)</p>
                <div class="raw-cards">
                    <div class="raw-card">
                        <h3>First JSON (or both)</h3>
                        <textarea id="rawJson1-${index}" placeholder="Paste your first JSON here...

Or paste BOTH JSONs here and they'll be auto-split:
{...first JSON...}

{...second JSON...}" oninput="handleRawInput(${index}, 1, this.value)">${comp.raw1 || ''}</textarea>
                    </div>
                    <div class="raw-card">
                        <h3>Second JSON</h3>
                        <textarea id="rawJson2-${index}" placeholder="Paste your second JSON here...

(Leave empty if you pasted both JSONs in the first box)" oninput="handleRawInput(${index}, 2, this.value)">${comp.raw2 || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
    });
    rawSection.innerHTML = html;
}

// Render secrets generator inputs for all pairs
function renderSecretsInputs() {
    let html = '';
    comparisons.forEach((comp, index) => {
        html += `
            <div class="comparison-group" data-index="${index}">
                ${comparisons.length > 1 ? `<div class="comparison-header">
                    <span class="comparison-label">Secret ${index + 1}</span>
                    <button class="remove-btn" onclick="removeComparison(${index})">Remove</button>
                </div>` : ''}
                <p class="section-description">Convert AWS Secrets Manager key-value pairs into ECS task definition secrets format</p>
                <div class="raw-card" style="width: 500px;">
                    <h3>Secret ARN</h3>
                    <input type="text" id="secretArn-${index}" class="secret-arn-input" placeholder="arn:aws:secretsmanager:region:account:secret:name-xxxxx" value="${comp.secretArn || ''}" oninput="handleSecretInput(${index}, 'arn', this.value)">
                </div>
                <div class="raw-card" style="width: 500px;">
                    <h3>Secrets Manager JSON</h3>
                    <textarea id="secretsManagerJson-${index}" placeholder='Paste the key-value JSON from AWS Secrets Manager:
{"DB_HOST": "localhost", "DB_USER": "admin", "DB_PASS": "secret"}' oninput="handleSecretInput(${index}, 'json', this.value)">${comp.secretsJson || ''}</textarea>
                </div>
            </div>
        `;
    });
    secretsGenSection.innerHTML = html;
}

// Handle raw JSON input
function handleRawInput(index, fileNum, value) {
    if (fileNum === 1) {
        comparisons[index].raw1 = value;
    } else {
        comparisons[index].raw2 = value;
    }
}

// Handle secrets input
function handleSecretInput(index, field, value) {
    if (field === 'arn') {
        comparisons[index].secretArn = value;
    } else {
        comparisons[index].secretsJson = value;
    }
}

function setCompareMode(mode) {
    compareMode = mode;
    toggleStandard.classList.remove('active');
    toggleEcs.classList.remove('active');
    toggleSecretsGen.classList.remove('active');

    const modeDescription = document.getElementById('modeDescription');
    const addBtn = document.getElementById('addComparisonBtn');

    if (mode === 'standard') {
        toggleStandard.classList.add('active');
        showCompareInputs();
        if (modeDescription) modeDescription.textContent = 'Compare any two JSON objects and see differences';
        if (addBtn) addBtn.textContent = '+ Add Comparison';
    } else if (mode === 'ecs') {
        toggleEcs.classList.add('active');
        showCompareInputs();
        if (modeDescription) modeDescription.textContent = 'Compare ECS task definitions: image, environment variables, and secrets';
        if (addBtn) addBtn.textContent = '+ Add Comparison';
    } else if (mode === 'secretsGen') {
        toggleSecretsGen.classList.add('active');
        showSecretsGenInputs();
        if (modeDescription) modeDescription.textContent = 'Generate ECS secrets array from Secrets Manager JSON (no comparison)';
        if (addBtn) addBtn.textContent = '+ Add Secret';
    }
}

function showCompareInputs() {
    // Show file/raw toggle and inputs
    document.querySelector('.input-toggle').style.display = 'flex';
    secretsGenSection.classList.add('hidden');
    if (inputMode === 'file') {
        fileSection.style.display = 'block';
        rawSection.classList.add('hidden');
        renderFileInputs();
    } else {
        fileSection.style.display = 'none';
        rawSection.classList.remove('hidden');
        renderRawInputs();
    }
    compareBtn.textContent = 'Sort & Compare';
}

function showSecretsGenInputs() {
    // Hide file/raw toggle and show secrets gen inputs
    document.querySelector('.input-toggle').style.display = 'flex';
    fileSection.style.display = 'none';
    rawSection.classList.add('hidden');
    secretsGenSection.classList.remove('hidden');
    renderSecretsInputs();
    compareBtn.textContent = 'Generate Secrets';
}

// Input mode toggle
function setInputMode(mode) {
    inputMode = mode;

    if (mode === 'file') {
        toggleFile.classList.add('active');
        toggleRaw.classList.remove('active');
        fileSection.style.display = 'block';
        rawSection.classList.add('hidden');
        renderFileInputs();
    } else {
        toggleRaw.classList.add('active');
        toggleFile.classList.remove('active');
        fileSection.style.display = 'none';
        rawSection.classList.remove('hidden');
        renderRawInputs();
    }
}

// Setup drag and drop for a specific dropzone
function setupDragDrop(dropzone, compIndex, fileNum) {
    if (!dropzone) return;

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.json')) {
            processFile(file, compIndex, fileNum);
        }
    });
}

function handleFileSelect(e, compIndex, fileNum) {
    const file = e.target.files[0];
    if (file) {
        processFile(file, compIndex, fileNum);
    }
}

function processFile(file, compIndex, fileNum) {
    const fileNameEl = document.getElementById(`fileName${fileNum}-${compIndex}`);
    if (fileNameEl) {
        fileNameEl.textContent = file.name;
        fileNameEl.classList.add('selected');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            if (fileNum === 1) {
                comparisons[compIndex].json1 = json;
                comparisons[compIndex].fileName1 = file.name;
            } else {
                comparisons[compIndex].json2 = json;
                comparisons[compIndex].fileName2 = file.name;
            }
        } catch (err) {
            alert(`Error parsing JSON: ${err.message}`);
            if (fileNameEl) {
                fileNameEl.textContent = 'Invalid JSON file';
                fileNameEl.classList.remove('selected');
            }
            if (fileNum === 1) {
                comparisons[compIndex].json1 = null;
                comparisons[compIndex].fileName1 = '';
            } else {
                comparisons[compIndex].json2 = null;
                comparisons[compIndex].fileName2 = '';
            }
        }
    };
    reader.readAsText(file);
}

function sortObject(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObject);
    }

    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = sortObject(obj[key]);
    }
    return sorted;
}

function compareObjects(obj1, obj2, path = '') {
    const diff = {
        added: [],
        removed: [],
        modified: [],
        same: []
    };

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = [...new Set([...keys1, ...keys2])].sort();

    for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;

        if (!(key in obj1)) {
            diff.added.push({ key: currentPath, value: obj2[key] });
        } else if (!(key in obj2)) {
            diff.removed.push({ key: currentPath, value: obj1[key] });
        } else if (
            typeof obj1[key] === 'object' &&
            typeof obj2[key] === 'object' &&
            obj1[key] !== null &&
            obj2[key] !== null &&
            !Array.isArray(obj1[key]) &&
            !Array.isArray(obj2[key])
        ) {
            const nestedDiff = compareObjects(obj1[key], obj2[key], currentPath);
            diff.added.push(...nestedDiff.added);
            diff.removed.push(...nestedDiff.removed);
            diff.modified.push(...nestedDiff.modified);
            diff.same.push(...nestedDiff.same);
        } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
            diff.modified.push({
                key: currentPath,
                oldValue: obj1[key],
                newValue: obj2[key]
            });
        } else {
            diff.same.push({ key: currentPath, value: obj1[key] });
        }
    }

    return diff;
}

// Extract container definition from various ECS JSON formats
// Finds the "main" container by looking for the one with the most secrets/environment vars
function extractContainerDef(data) {
    // Handle if it's already a container definition
    if (data.name && (data.secrets || data.environment)) {
        return data;
    }

    // Handle if it's just secrets or environment (without name)
    if (data.secrets || data.environment) {
        return {
            name: '',
            image: '',
            secrets: data.secrets || [],
            environment: data.environment || []
        };
    }

    // Handle if it's a raw secrets/environment array (array of {name, value/valueFrom})
    if (Array.isArray(data) && data.length > 0 && data[0].name && (data[0].value !== undefined || data[0].valueFrom !== undefined)) {
        // Determine if it's secrets (has valueFrom) or environment (has value)
        const isSecrets = data[0].valueFrom !== undefined;
        return {
            name: '',
            image: '',
            secrets: isSecrets ? data : [],
            environment: isSecrets ? [] : data
        };
    }

    let containers = [];

    // Handle array format (just containerDefinitions array)
    if (Array.isArray(data)) {
        containers = data;
    }
    // Handle full task definition format
    else if (data.containerDefinitions && Array.isArray(data.containerDefinitions)) {
        containers = data.containerDefinitions;
    }

    if (containers.length === 0) {
        return data;
    }

    if (containers.length === 1) {
        return containers[0];
    }

    // Find the main container (one with most secrets + environment vars)
    // This filters out sidecars like envoy, xray-daemon, etc.
    let mainContainer = containers[0];
    let maxCount = 0;

    for (const container of containers) {
        const secretsCount = Array.isArray(container.secrets) ? container.secrets.length : 0;
        const envCount = Array.isArray(container.environment) ? container.environment.length : 0;
        const total = secretsCount + envCount;

        if (total > maxCount) {
            maxCount = total;
            mainContainer = container;
        }
    }

    return mainContainer;
}

// Convert array of {name, value/valueFrom} to object keyed by name
function arrayToNamedObject(arr) {
    if (!Array.isArray(arr)) return {};
    const obj = {};
    for (const item of arr) {
        if (item.name) {
            obj[item.name] = item.value || item.valueFrom || '';
        }
    }
    return obj;
}

// Compare ECS task definitions
function compareEcs(data1, data2) {
    const container1 = extractContainerDef(data1);
    const container2 = extractContainerDef(data2);

    const result = {
        image: { file1: container1.image || '', file2: container2.image || '' },
        environment: { added: [], removed: [], modified: [], same: [] },
        secrets: { added: [], removed: [], modified: [], same: [] }
    };

    // Compare environment variables
    const env1 = arrayToNamedObject(container1.environment);
    const env2 = arrayToNamedObject(container2.environment);
    const envDiff = compareNamedArrays(env1, env2);
    result.environment = envDiff;

    // Compare secrets
    const secrets1 = arrayToNamedObject(container1.secrets);
    const secrets2 = arrayToNamedObject(container2.secrets);
    const secretsDiff = compareNamedArrays(secrets1, secrets2);
    result.secrets = secretsDiff;

    return result;
}

// Extract all JSON objects/arrays from text
// Returns an array of JSON strings found in the text
function extractAllJsons(text) {
    if (!text) return [];

    const results = [];
    let remaining = text.trim();

    // Check if it starts with a property name (partial container def)
    if (remaining.startsWith('"environment"') || remaining.startsWith('"secrets"') || remaining.startsWith('"name"') || remaining.startsWith('"image"')) {
        remaining = '{' + remaining + '}';
    }

    while (remaining.length > 0) {
        const start = remaining.search(/[\[{]/);
        if (start === -1) break;

        const openChar = remaining[start];
        const closeChar = openChar === '{' ? '}' : ']';

        let depth = 0;
        let inString = false;
        let escape = false;
        let endIndex = -1;

        for (let i = start; i < remaining.length; i++) {
            const char = remaining[i];

            if (escape) {
                escape = false;
                continue;
            }

            if (char === '\\' && inString) {
                escape = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
                continue;
            }

            if (inString) continue;

            if (char === '{' || char === '[') {
                depth++;
            } else if (char === '}' || char === ']') {
                depth--;
                if (depth === 0) {
                    endIndex = i;
                    break;
                }
            }
        }

        if (endIndex === -1) break;

        results.push(remaining.substring(start, endIndex + 1));
        remaining = remaining.substring(endIndex + 1).trim();
    }

    return results;
}

// Extract just the first JSON object/array from text (ignores trailing content)
// Also wraps partial container definition snippets (starting with "environment" or "secrets")
function extractFirstJson(text) {
    const jsons = extractAllJsons(text);
    return jsons.length > 0 ? jsons[0] : text;
}

function compareNamedArrays(obj1, obj2) {
    const diff = { added: [], removed: [], modified: [], same: [] };

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = [...new Set([...keys1, ...keys2])].sort();

    for (const key of allKeys) {
        if (!(key in obj1)) {
            diff.added.push({ name: key, value: obj2[key] });
        } else if (!(key in obj2)) {
            diff.removed.push({ name: key, value: obj1[key] });
        } else if (obj1[key] !== obj2[key]) {
            diff.modified.push({ name: key, oldValue: obj1[key], newValue: obj2[key] });
        } else {
            diff.same.push({ name: key, value: obj1[key] });
        }
    }

    return diff;
}

function compare() {
    // Handle secrets generator mode separately
    if (compareMode === 'secretsGen') {
        generateSecrets();
        return;
    }

    // Collect all comparison data
    const comparisonResults = [];

    for (let i = 0; i < comparisons.length; i++) {
        const comp = comparisons[i];
        let data1, data2;

        if (inputMode === 'file') {
            if (!comp.json1 || !comp.json2) {
                alert(`Please upload both JSON files for comparison ${i + 1}.`);
                return;
            }
            data1 = comp.json1;
            data2 = comp.json2;
        } else {
            let raw1, raw2;

            // Check if user pasted both JSONs in the first textarea
            const rawJson1El = document.getElementById(`rawJson1-${i}`);
            const rawJson2El = document.getElementById(`rawJson2-${i}`);
            const raw1Value = rawJson1El ? rawJson1El.value.trim() : comp.raw1.trim();
            const raw2Value = rawJson2El ? rawJson2El.value.trim() : comp.raw2.trim();

            const firstTextareaJsons = extractAllJsons(raw1Value);

            if (firstTextareaJsons.length >= 2 && !raw2Value) {
                // Auto-split: two JSONs were pasted in the first textarea
                raw1 = firstTextareaJsons[0];
                raw2 = firstTextareaJsons[1];
                // Update state and textarea
                comp.raw2 = raw2;
                if (rawJson2El) rawJson2El.value = raw2;
            } else {
                raw1 = extractFirstJson(raw1Value);
                raw2 = extractFirstJson(raw2Value);
            }

            if (!raw1 || !raw2) {
                alert(`Please paste JSON in both text areas for comparison ${i + 1}, or paste two JSON objects in the first area.`);
                return;
            }

            try {
                data1 = JSON.parse(raw1);
            } catch (err) {
                alert(`Error parsing first JSON in comparison ${i + 1}: ${err.message}`);
                return;
            }

            try {
                data2 = JSON.parse(raw2);
            } catch (err) {
                alert(`Error parsing second JSON in comparison ${i + 1}: ${err.message}`);
                return;
            }
        }

        if (compareMode === 'ecs') {
            const ecsDiff = compareEcs(data1, data2);
            comparisonResults.push({
                index: i,
                name: comp.fileName1 || comp.fileName2 || `Comparison ${i + 1}`,
                data1,
                data2,
                diff: ecsDiff,
                mode: 'ecs'
            });
        } else {
            const sorted1 = sortObject(data1);
            const sorted2 = sortObject(data2);
            const diff = compareObjects(sorted1, sorted2);
            comparisonResults.push({
                index: i,
                name: comp.fileName1 || comp.fileName2 || `Comparison ${i + 1}`,
                sorted1,
                sorted2,
                diff,
                mode: 'standard'
            });
        }
    }

    // Display all results
    displayAllResults(comparisonResults);
    legend.classList.add('visible');
    results.classList.add('visible');
}

// Format ECS secrets array with proper indentation (matching AWS console format)
function formatEcsSecretsArray(secrets) {
    const lines = secrets.map(secret => {
        return `                {
                    "name": "${secret.name}",
                    "valueFrom": "${secret.valueFrom}"
                }`;
    });
    return lines.join(',\n');
}

// Generate ECS task definition secrets from Secrets Manager JSON
function generateSecrets() {
    const secretsResults = [];
    let totalGenerated = 0;

    for (let i = 0; i < comparisons.length; i++) {
        const comp = comparisons[i];
        const arnEl = document.getElementById(`secretArn-${i}`);
        const jsonEl = document.getElementById(`secretsManagerJson-${i}`);

        const arn = arnEl ? arnEl.value.trim() : comp.secretArn.trim();
        const jsonInput = jsonEl ? jsonEl.value.trim() : comp.secretsJson.trim();

        if (!arn) {
            alert(`Please enter the Secret ARN for secret ${i + 1}.`);
            return;
        }

        if (!jsonInput) {
            alert(`Please paste the Secrets Manager JSON for secret ${i + 1}.`);
            return;
        }

        let secretsData;
        try {
            secretsData = JSON.parse(jsonInput);
        } catch (err) {
            alert(`Error parsing JSON for secret ${i + 1}: ${err.message}`);
            return;
        }

        // Generate ECS secrets array
        const ecsSecrets = Object.keys(secretsData).sort().map(key => ({
            name: key,
            valueFrom: `${arn}:${key}::`
        }));

        // Format with ECS-style indentation
        const formattedOutput = formatEcsSecretsArray(ecsSecrets);

        totalGenerated += ecsSecrets.length;
        secretsResults.push({
            index: i,
            name: arn.split(':').pop() || `Secret ${i + 1}`,
            input: secretsData,
            output: formattedOutput,
            count: ecsSecrets.length
        });
    }

    // Display stats
    stats.innerHTML = `
        <div class="stat-item added">
            <span>Total Secrets Generated:</span>
            <span class="count">${totalGenerated}</span>
        </div>
    `;

    // Build results HTML
    let resultsHtml = '';
    const showHeader = secretsResults.length > 1;

    secretsResults.forEach((result, idx) => {
        resultsHtml += `
            <div class="comparison-result ${showHeader ? 'with-header' : ''}">
                ${showHeader ? `<div class="comparison-result-header">${escapeHtml(result.name)} (${result.count} secrets)</div>` : ''}
                <div class="results-grid">
                    <div class="result-panel" id="panel1-${idx}">
                        <div class="panel-header">Input (Secrets Manager)</div>
                        <pre class="json-output">${syntaxHighlight(JSON.stringify(result.input, null, 2))}</pre>
                    </div>
                    <div class="result-panel diff-panel" id="panelDiff-${idx}">
                        <div class="panel-header">Actions</div>
                        <div class="diff-output" style="text-align: center; padding: 20px; color: #7f8c8d;">
                            <p style="margin-bottom: 12px;">Copy the generated secrets array to your ECS task definition.</p>
                            <button class="btn btn-primary" onclick="copySecretOutput(${idx})" style="padding: 8px 16px; font-size: 0.813rem;">Copy to Clipboard</button>
                        </div>
                    </div>
                    <div class="result-panel" id="panel2-${idx}">
                        <div class="panel-header">Output (ECS Task Def Secrets)</div>
                        <pre class="json-output">${syntaxHighlight(result.output)}</pre>
                    </div>
                </div>
            </div>
        `;

        // Store for copy functionality
        window[`secretOutput_${idx}`] = result.output;
    });

    results.innerHTML = resultsHtml;
    legend.classList.remove('visible');
    results.classList.add('visible');
}

// Copy secret output
function copySecretOutput(idx) {
    const content = window[`secretOutput_${idx}`];
    if (!content) {
        alert('No content to copy');
        return;
    }
    navigator.clipboard.writeText(content).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

// Copy ECS output to clipboard
function copyEcsOutput(panelNum) {
    const content = panelNum === 1 ? window.ecsOutput1 : window.ecsOutput2;
    if (!content) {
        alert('No content to copy');
        return;
    }
    navigator.clipboard.writeText(content).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

// Copy generated secrets to clipboard
function copyToClipboard() {
    const arn = secretArn.value.trim();
    const jsonInput = secretsManagerJson.value.trim();

    try {
        const secretsData = JSON.parse(jsonInput);
        const ecsSecrets = Object.keys(secretsData).sort().map(key => ({
            name: key,
            valueFrom: `${arn}:${key}::`
        }));

        // Use ECS-style formatting
        const formattedOutput = formatEcsSecretsArray(ecsSecrets);

        navigator.clipboard.writeText(formattedOutput).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            alert('Failed to copy: ' + err);
        });
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function displayEcsStats(ecsDiff) {
    const envTotal = ecsDiff.environment.added.length + ecsDiff.environment.removed.length + ecsDiff.environment.modified.length;
    const secretsTotal = ecsDiff.secrets.added.length + ecsDiff.secrets.removed.length + ecsDiff.secrets.modified.length;
    const imageChanged = ecsDiff.image.file1 !== ecsDiff.image.file2;

    stats.innerHTML = `
        <div class="stat-item ${imageChanged ? 'modified' : 'unchanged'}">
            <span>Image:</span>
            <span class="count">${imageChanged ? 'Changed' : 'Same'}</span>
        </div>
        <div class="stat-item ${envTotal > 0 ? 'modified' : 'unchanged'}">
            <span>Env Vars:</span>
            <span class="count">${envTotal} diff</span>
        </div>
        <div class="stat-item ${secretsTotal > 0 ? 'modified' : 'unchanged'}">
            <span>Secrets:</span>
            <span class="count">${secretsTotal} diff</span>
        </div>
    `;
}

function displayEcsResults(data1, data2, ecsDiff) {
    const container1 = extractContainerDef(data1);
    const container2 = extractContainerDef(data2);

    // Only show relevant fields for ECS comparison
    const relevantFields1 = extractRelevantEcsFields(container1);
    const relevantFields2 = extractRelevantEcsFields(container2);

    // Format as array with specific key order: name, image, environment, secrets
    const formatted1 = formatEcsContainerArray(relevantFields1);
    const formatted2 = formatEcsContainerArray(relevantFields2);

    // Store formatted output for copy functionality
    window.ecsOutput1 = formatted1;
    window.ecsOutput2 = formatted2;

    output1.innerHTML = syntaxHighlight(formatted1);
    output2.innerHTML = syntaxHighlight(formatted2);
    outputDiff.innerHTML = formatEcsDiff(ecsDiff);

    // Update panel headers with copy buttons
    document.querySelector('#panel1 .panel-header').innerHTML = 'File 1 (Sorted) <button class="copy-btn" onclick="copyEcsOutput(1)">Copy</button>';
    document.querySelector('#panel2 .panel-header').innerHTML = 'File 2 (Sorted) <button class="copy-btn" onclick="copyEcsOutput(2)">Copy</button>';
}

// Format container as array with specific key order: name, image, environment, secrets
function formatEcsContainerArray(container) {
    // Sort environment and secrets arrays by name
    const sortedEnv = (container.environment || []).slice().sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
    );
    const sortedSecrets = (container.secrets || []).slice().sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
    );

    // Build the output manually to preserve key order
    const formatted = [
        {
            name: container.name || '',
            image: container.image || '',
            environment: sortedEnv,
            secrets: sortedSecrets
        }
    ];

    return JSON.stringify(formatted, null, 2);
}

// Extract only the fields relevant for ECS comparison
function extractRelevantEcsFields(container) {
    return {
        name: container.name || '',
        image: container.image || '',
        environment: container.environment || [],
        secrets: container.secrets || []
    };
}

function formatEcsDiff(ecsDiff) {
    let html = '';

    // Image comparison
    const img1 = ecsDiff.image.file1;
    const img2 = ecsDiff.image.file2;
    const tag1 = img1.split(':')[1] || 'latest';
    const tag2 = img2.split(':')[1] || 'latest';

    html += `<div class="diff-section">
        <div class="diff-section-title" style="color: #3498db;">Image Tag</div>`;

    if (img1 === img2) {
        html += `<div class="diff-item" style="background: #e9ecef;">
            <div class="diff-key">Same</div>
            <div class="diff-value">${escapeHtml(tag1)}</div>
        </div>`;
    } else {
        html += `<div class="diff-item modified">
            <div class="diff-key">Changed</div>
            <div class="diff-value old">File 1: ${escapeHtml(tag1)}</div>
            <div class="diff-value new">File 2: ${escapeHtml(tag2)}</div>
        </div>`;
    }
    html += '</div>';

    // Environment variables
    html += formatEcsSection('Environment Variables', ecsDiff.environment);

    // Secrets
    html += formatEcsSection('Secrets', ecsDiff.secrets);

    return html;
}

function formatEcsSection(title, diff) {
    let html = `<div class="diff-section">
        <div class="diff-section-title" style="color: #3498db;">${title}</div>`;

    if (diff.removed.length === 0 && diff.added.length === 0 && diff.modified.length === 0) {
        html += `<div class="diff-item" style="background: #e9ecef; color: #6c757d;">
            <div class="diff-key">No differences</div>
        </div>`;
    }

    if (diff.removed.length > 0) {
        html += `<div class="diff-subsection">
            <div class="diff-section-title removed" style="font-size: 0.7rem;">Missing in File 2 (${diff.removed.length})</div>
            ${diff.removed.map(item => `
                <div class="diff-item removed">
                    <div class="diff-key">${escapeHtml(item.name)}</div>
                </div>
            `).join('')}
        </div>`;
    }

    if (diff.added.length > 0) {
        html += `<div class="diff-subsection">
            <div class="diff-section-title added" style="font-size: 0.7rem;">Missing in File 1 (${diff.added.length})</div>
            ${diff.added.map(item => `
                <div class="diff-item added">
                    <div class="diff-key">${escapeHtml(item.name)}</div>
                </div>
            `).join('')}
        </div>`;
    }

    if (diff.modified.length > 0) {
        html += `<div class="diff-subsection">
            <div class="diff-section-title modified" style="font-size: 0.7rem;">Modified (${diff.modified.length})</div>
            ${diff.modified.map(item => `
                <div class="diff-item modified">
                    <div class="diff-key">${escapeHtml(item.name)}</div>
                    <div class="diff-value old">Old: ${escapeHtml(truncateValue(item.oldValue))}</div>
                    <div class="diff-value new">New: ${escapeHtml(truncateValue(item.newValue))}</div>
                </div>
            `).join('')}
        </div>`;
    }

    html += '</div>';
    return html;
}

function displayStats(diff) {
    stats.innerHTML = `
        <div class="stat-item added">
            <span>Added:</span>
            <span class="count">${diff.added.length}</span>
        </div>
        <div class="stat-item removed">
            <span>Removed:</span>
            <span class="count">${diff.removed.length}</span>
        </div>
        <div class="stat-item modified">
            <span>Modified:</span>
            <span class="count">${diff.modified.length}</span>
        </div>
        <div class="stat-item unchanged">
            <span>Unchanged:</span>
            <span class="count">${diff.same.length}</span>
        </div>
    `;
}

function displayResults(sorted1, sorted2, diff) {
    const output1 = document.getElementById('output1');
    const output2 = document.getElementById('output2');
    const outputDiff = document.getElementById('outputDiff');
    if (output1) output1.innerHTML = syntaxHighlight(JSON.stringify(sorted1, null, 2));
    if (output2) output2.innerHTML = syntaxHighlight(JSON.stringify(sorted2, null, 2));
    if (outputDiff) outputDiff.innerHTML = formatDiff(diff);
}

// Display all comparison results
function displayAllResults(comparisonResults) {
    // Calculate aggregate stats
    let totalAdded = 0, totalRemoved = 0, totalModified = 0, totalSame = 0;
    let ecsEnvTotal = 0, ecsSecretsTotal = 0, ecsImageChanges = 0;

    comparisonResults.forEach(result => {
        if (result.mode === 'ecs') {
            ecsEnvTotal += result.diff.environment.added.length + result.diff.environment.removed.length + result.diff.environment.modified.length;
            ecsSecretsTotal += result.diff.secrets.added.length + result.diff.secrets.removed.length + result.diff.secrets.modified.length;
            if (result.diff.image.file1 !== result.diff.image.file2) ecsImageChanges++;
        } else {
            totalAdded += result.diff.added.length;
            totalRemoved += result.diff.removed.length;
            totalModified += result.diff.modified.length;
            totalSame += result.diff.same.length;
        }
    });

    // Display aggregate stats
    if (comparisonResults[0]?.mode === 'ecs') {
        stats.innerHTML = `
            <div class="stat-item ${ecsImageChanges > 0 ? 'modified' : 'unchanged'}">
                <span>Image Changes:</span>
                <span class="count">${ecsImageChanges}</span>
            </div>
            <div class="stat-item ${ecsEnvTotal > 0 ? 'modified' : 'unchanged'}">
                <span>Env Var Diffs:</span>
                <span class="count">${ecsEnvTotal}</span>
            </div>
            <div class="stat-item ${ecsSecretsTotal > 0 ? 'modified' : 'unchanged'}">
                <span>Secrets Diffs:</span>
                <span class="count">${ecsSecretsTotal}</span>
            </div>
        `;
    } else {
        stats.innerHTML = `
            <div class="stat-item added">
                <span>Added:</span>
                <span class="count">${totalAdded}</span>
            </div>
            <div class="stat-item removed">
                <span>Removed:</span>
                <span class="count">${totalRemoved}</span>
            </div>
            <div class="stat-item modified">
                <span>Modified:</span>
                <span class="count">${totalModified}</span>
            </div>
            <div class="stat-item unchanged">
                <span>Unchanged:</span>
                <span class="count">${totalSame}</span>
            </div>
        `;
    }

    // Build results HTML
    let resultsHtml = '';

    comparisonResults.forEach((result, idx) => {
        const showHeader = comparisonResults.length > 1;

        if (result.mode === 'ecs') {
            const container1 = extractContainerDef(result.data1);
            const container2 = extractContainerDef(result.data2);
            const relevantFields1 = extractRelevantEcsFields(container1);
            const relevantFields2 = extractRelevantEcsFields(container2);
            const formatted1 = formatEcsContainerArray(relevantFields1);
            const formatted2 = formatEcsContainerArray(relevantFields2);

            resultsHtml += `
                <div class="comparison-result ${showHeader ? 'with-header' : ''}">
                    ${showHeader ? `<div class="comparison-result-header">${escapeHtml(result.name)}</div>` : ''}
                    <div class="results-grid">
                        <div class="result-panel" id="panel1-${idx}">
                            <div class="panel-header">File 1 (Sorted) <button class="copy-btn" onclick="copyPanelContent(${idx}, 1)">Copy</button></div>
                            <pre class="json-output">${syntaxHighlight(formatted1)}</pre>
                        </div>
                        <div class="result-panel diff-panel" id="panelDiff-${idx}">
                            <div class="panel-header">Differences</div>
                            <div class="diff-output">${formatEcsDiff(result.diff)}</div>
                        </div>
                        <div class="result-panel" id="panel2-${idx}">
                            <div class="panel-header">File 2 (Sorted) <button class="copy-btn" onclick="copyPanelContent(${idx}, 2)">Copy</button></div>
                            <pre class="json-output">${syntaxHighlight(formatted2)}</pre>
                        </div>
                    </div>
                </div>
            `;

            // Store for copy functionality
            window[`ecsOutput1_${idx}`] = formatted1;
            window[`ecsOutput2_${idx}`] = formatted2;
        } else {
            resultsHtml += `
                <div class="comparison-result ${showHeader ? 'with-header' : ''}">
                    ${showHeader ? `<div class="comparison-result-header">${escapeHtml(result.name)}</div>` : ''}
                    <div class="results-grid">
                        <div class="result-panel" id="panel1-${idx}">
                            <div class="panel-header">File 1 (Sorted)</div>
                            <pre class="json-output">${syntaxHighlight(JSON.stringify(result.sorted1, null, 2))}</pre>
                        </div>
                        <div class="result-panel diff-panel" id="panelDiff-${idx}">
                            <div class="panel-header">Differences</div>
                            <div class="diff-output">${formatDiff(result.diff)}</div>
                        </div>
                        <div class="result-panel" id="panel2-${idx}">
                            <div class="panel-header">File 2 (Sorted)</div>
                            <pre class="json-output">${syntaxHighlight(JSON.stringify(result.sorted2, null, 2))}</pre>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    results.innerHTML = resultsHtml;
}

// Copy panel content
function copyPanelContent(idx, panelNum) {
    const content = window[`ecsOutput${panelNum}_${idx}`];
    if (!content) {
        alert('No content to copy');
        return;
    }
    navigator.clipboard.writeText(content).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

function formatDiff(diff) {
    if (diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0) {
        return '<div class="identical-message">Files are identical</div>';
    }

    let html = '';

    if (diff.removed.length > 0) {
        html += `
            <div class="diff-section">
                <div class="diff-section-title removed">Only in File 1</div>
                ${diff.removed.map(item => `
                    <div class="diff-item removed">
                        <div class="diff-key">${escapeHtml(item.key)}</div>
                        <div class="diff-value">${escapeHtml(truncateValue(item.value))}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (diff.added.length > 0) {
        html += `
            <div class="diff-section">
                <div class="diff-section-title added">Only in File 2</div>
                ${diff.added.map(item => `
                    <div class="diff-item added">
                        <div class="diff-key">${escapeHtml(item.key)}</div>
                        <div class="diff-value">${escapeHtml(truncateValue(item.value))}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (diff.modified.length > 0) {
        html += `
            <div class="diff-section">
                <div class="diff-section-title modified">Modified</div>
                ${diff.modified.map(item => `
                    <div class="diff-item modified">
                        <div class="diff-key">${escapeHtml(item.key)}</div>
                        <div class="diff-value old">Old: ${escapeHtml(truncateValue(item.oldValue))}</div>
                        <div class="diff-value new">New: ${escapeHtml(truncateValue(item.newValue))}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    return html;
}

function truncateValue(value) {
    const str = JSON.stringify(value);
    if (str.length > 100) {
        return str.substring(0, 100) + '...';
    }
    return str;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function syntaxHighlight(json) {
    const escaped = escapeHtml(json);
    return escaped.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
        (match) => {
            let cls = 'json-string';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            } else {
                cls = 'json-number';
            }
            return `<span class="${cls}">${match}</span>`;
        }
    );
}

function clearAll() {
    // Reset comparisons to a single empty pair
    comparisons = [{ json1: null, json2: null, fileName1: '', fileName2: '', raw1: '', raw2: '', secretArn: '', secretsJson: '' }];

    // Re-render inputs
    renderInputs();

    // Clear results
    stats.innerHTML = '';
    results.innerHTML = '';

    legend.classList.remove('visible');
    results.classList.remove('visible');
}

// Initialize the app on page load
document.addEventListener('DOMContentLoaded', () => {
    renderInputs();
});
