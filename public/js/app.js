// State
let json1 = null;
let json2 = null;
let inputMode = 'file'; // 'file' or 'raw'

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

// Event Listeners
file1Input.addEventListener('change', (e) => handleFileSelect(e, 1));
file2Input.addEventListener('change', (e) => handleFileSelect(e, 2));
compareBtn.addEventListener('click', compare);
clearBtn.addEventListener('click', clearAll);
toggleFile.addEventListener('click', () => setInputMode('file'));
toggleRaw.addEventListener('click', () => setInputMode('raw'));

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

function compare() {
    let data1, data2;

    if (inputMode === 'file') {
        if (!json1 || !json2) {
            alert('Please upload both JSON files first.');
            return;
        }
        data1 = json1;
        data2 = json2;
    } else {
        const raw1 = rawJson1.value.trim();
        const raw2 = rawJson2.value.trim();

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

    const sorted1 = sortObject(data1);
    const sorted2 = sortObject(data2);
    const diff = compareObjects(sorted1, sorted2);

    displayStats(diff);
    displayResults(sorted1, sorted2, diff);

    legend.classList.add('visible');
    results.classList.add('visible');
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

    stats.innerHTML = '';
    output1.innerHTML = '';
    output2.innerHTML = '';
    outputDiff.innerHTML = '';

    legend.classList.remove('visible');
    results.classList.remove('visible');
}
