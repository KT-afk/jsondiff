// State
let json1 = null;
let json2 = null;
let inputMode = 'file'; // 'file' or 'raw'
let compareMode = 'standard'; // 'standard', 'ecs', or 'secretsGen'

// DOM Elements
const file1Input = document.getElementById('file1');
const file2Input = document.getElementById('file2');
const fileName1 = document.getElementById('fileName1');
const fileName2 = document.getElementById('fileName2');
const compareBtn = document.getElementById('compareBtn');
const clearBtn = document.getElementById('clearBtn');
const stats = document.getElementById('stats');
const legend = document.getElementById('legend');
const results = document.getElementById('results');
const output1 = document.getElementById('output1');
const output2 = document.getElementById('output2');
const outputDiff = document.getElementById('outputDiff');
const dropzone1 = document.getElementById('dropzone1');
const dropzone2 = document.getElementById('dropzone2');
const toggleFile = document.getElementById('toggleFile');
const toggleRaw = document.getElementById('toggleRaw');
const fileSection = document.getElementById('fileSection');
const rawSection = document.getElementById('rawSection');
const rawJson1 = document.getElementById('rawJson1');
const rawJson2 = document.getElementById('rawJson2');
const secretsGenSection = document.getElementById('secretsGenSection');
const secretArn = document.getElementById('secretArn');
const secretsManagerJson = document.getElementById('secretsManagerJson');

// Event Listeners
file1Input.addEventListener('change', (e) => handleFileSelect(e, 1));
file2Input.addEventListener('change', (e) => handleFileSelect(e, 2));
compareBtn.addEventListener('click', compare);
clearBtn.addEventListener('click', clearAll);
toggleFile.addEventListener('click', () => setInputMode('file'));
toggleRaw.addEventListener('click', () => setInputMode('raw'));

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

function setCompareMode(mode) {
    compareMode = mode;
    toggleStandard.classList.remove('active');
    toggleEcs.classList.remove('active');
    toggleSecretsGen.classList.remove('active');

    if (mode === 'standard') {
        toggleStandard.classList.add('active');
        showCompareInputs();
    } else if (mode === 'ecs') {
        toggleEcs.classList.add('active');
        showCompareInputs();
    } else if (mode === 'secretsGen') {
        toggleSecretsGen.classList.add('active');
        showSecretsGenInputs();
    }
}

function showCompareInputs() {
    // Show file/raw toggle and inputs
    document.querySelector('.input-toggle').style.display = 'flex';
    secretsGenSection.classList.add('hidden');
    if (inputMode === 'file') {
        fileSection.style.display = 'flex';
        rawSection.classList.add('hidden');
    } else {
        fileSection.style.display = 'none';
        rawSection.classList.remove('hidden');
    }
    compareBtn.textContent = 'Sort & Compare';
}

function showSecretsGenInputs() {
    // Hide file/raw toggle and show secrets gen inputs
    document.querySelector('.input-toggle').style.display = 'flex';
    fileSection.style.display = 'none';
    rawSection.classList.add('hidden');
    secretsGenSection.classList.remove('hidden');
    compareBtn.textContent = 'Generate Secrets';
}

// Input mode toggle
function setInputMode(mode) {
    inputMode = mode;

    if (mode === 'file') {
        toggleFile.classList.add('active');
        toggleRaw.classList.remove('active');
        fileSection.style.display = 'flex';
        rawSection.classList.add('hidden');
    } else {
        toggleRaw.classList.add('active');
        toggleFile.classList.remove('active');
        fileSection.style.display = 'none';
        rawSection.classList.remove('hidden');
    }
}

// Drag and drop
setupDragDrop(dropzone1, 1);
setupDragDrop(dropzone2, 2);

function setupDragDrop(dropzone, num) {
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
            processFile(file, num);
        }
    });
}

function handleFileSelect(e, num) {
    const file = e.target.files[0];
    if (file) {
        processFile(file, num);
    }
}

function processFile(file, num) {
    const fileNameEl = num === 1 ? fileName1 : fileName2;
    fileNameEl.textContent = file.name;
    fileNameEl.classList.add('selected');

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            if (num === 1) {
                json1 = json;
            } else {
                json2 = json;
            }
        } catch (err) {
            alert(`Error parsing JSON: ${err.message}`);
            fileNameEl.textContent = 'Invalid JSON file';
            fileNameEl.classList.remove('selected');
            if (num === 1) {
                json1 = null;
            } else {
                json2 = null;
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

// Extract just the first JSON object/array from text (ignores trailing content)
// Also wraps partial container definition snippets (starting with "environment" or "secrets")
function extractFirstJson(text) {
    if (!text) return text;

    // Check if it starts with a property name (partial container def)
    const trimmed = text.trim();
    if (trimmed.startsWith('"environment"') || trimmed.startsWith('"secrets"') || trimmed.startsWith('"name"') || trimmed.startsWith('"image"')) {
        // Wrap it in braces to make it valid JSON
        text = '{' + trimmed + '}';
    }

    const start = text.search(/[\[{]/);
    if (start === -1) return text;

    const openChar = text[start];
    const closeChar = openChar === '{' ? '}' : ']';

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < text.length; i++) {
        const char = text[i];

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

        if (char === openChar || char === (openChar === '{' ? '[' : '{')) {
            depth++;
        } else if (char === closeChar || char === (closeChar === '}' ? ']' : '}')) {
            depth--;
            if (depth === 0) {
                return text.substring(start, i + 1);
            }
        }
    }

    return text;
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

    let data1, data2;

    if (inputMode === 'file') {
        if (!json1 || !json2) {
            alert('Please upload both JSON files first.');
            return;
        }
        data1 = json1;
        data2 = json2;
    } else {
        const raw1 = extractFirstJson(rawJson1.value.trim());
        const raw2 = extractFirstJson(rawJson2.value.trim());

        if (!raw1 || !raw2) {
            alert('Please paste JSON in both text areas.');
            return;
        }

        try {
            data1 = JSON.parse(raw1);
        } catch (err) {
            alert(`Error parsing first JSON: ${err.message}`);
            return;
        }

        try {
            data2 = JSON.parse(raw2);
        } catch (err) {
            alert(`Error parsing second JSON: ${err.message}`);
            return;
        }
    }

    if (compareMode === 'ecs') {
        const ecsDiff = compareEcs(data1, data2);
        displayEcsStats(ecsDiff);
        displayEcsResults(data1, data2, ecsDiff);
    } else {
        const sorted1 = sortObject(data1);
        const sorted2 = sortObject(data2);
        const diff = compareObjects(sorted1, sorted2);

        displayStats(diff);
        displayResults(sorted1, sorted2, diff);
    }

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
    const arn = secretArn.value.trim();
    const jsonInput = secretsManagerJson.value.trim();

    if (!arn) {
        alert('Please enter the Secret ARN.');
        return;
    }

    if (!jsonInput) {
        alert('Please paste the Secrets Manager JSON.');
        return;
    }

    let secretsData;
    try {
        secretsData = JSON.parse(jsonInput);
    } catch (err) {
        alert(`Error parsing JSON: ${err.message}`);
        return;
    }

    // Generate ECS secrets array
    const ecsSecrets = Object.keys(secretsData).sort().map(key => ({
        name: key,
        valueFrom: `${arn}:${key}::`
    }));

    // Format with ECS-style indentation
    const formattedOutput = formatEcsSecretsArray(ecsSecrets);

    // Display results
    stats.innerHTML = `
        <div class="stat-item added">
            <span>Secrets Generated:</span>
            <span class="count">${ecsSecrets.length}</span>
        </div>
    `;

    // Show input in panel 1, output in panel 2, hide diff panel
    output1.innerHTML = syntaxHighlight(JSON.stringify(secretsData, null, 2));
    output2.innerHTML = syntaxHighlight(formattedOutput);
    outputDiff.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #7f8c8d;">
            <p style="margin-bottom: 12px;">Copy the generated secrets array to your ECS task definition.</p>
            <button class="btn btn-primary" onclick="copyToClipboard()" style="padding: 8px 16px; font-size: 0.813rem;">Copy to Clipboard</button>
        </div>
    `;

    // Update panel headers
    document.querySelector('#panel1 .panel-header').textContent = 'Input (Secrets Manager)';
    document.querySelector('#panel2 .panel-header').textContent = 'Output (ECS Task Def Secrets)';
    document.querySelector('#panelDiff .panel-header').textContent = 'Actions';

    legend.classList.remove('visible');
    results.classList.add('visible');
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
    output1.innerHTML = syntaxHighlight(JSON.stringify(sorted1, null, 2));
    output2.innerHTML = syntaxHighlight(JSON.stringify(sorted2, null, 2));
    outputDiff.innerHTML = formatDiff(diff);
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
    json1 = null;
    json2 = null;

    file1Input.value = '';
    file2Input.value = '';
    fileName1.textContent = 'No file selected';
    fileName2.textContent = 'No file selected';
    fileName1.classList.remove('selected');
    fileName2.classList.remove('selected');

    rawJson1.value = '';
    rawJson2.value = '';

    // Clear secrets generator fields
    if (secretArn) secretArn.value = '';
    if (secretsManagerJson) secretsManagerJson.value = '';

    stats.innerHTML = '';
    output1.innerHTML = '';
    output2.innerHTML = '';
    outputDiff.innerHTML = '';

    // Reset panel headers
    document.querySelector('#panel1 .panel-header').textContent = 'File 1 (Sorted)';
    document.querySelector('#panel2 .panel-header').textContent = 'File 2 (Sorted)';
    document.querySelector('#panelDiff .panel-header').textContent = 'Differences';

    legend.classList.remove('visible');
    results.classList.remove('visible');
}
