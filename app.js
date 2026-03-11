/* ===================================================
   NexTools — Application Logic
   6 Tools: QR Code, Password, Word Counter, Palette, JSON, Token Counter
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initToolTabs();
    initQRCode();
    initPasswordGenerator();
    initWordCounter();
    initColorPalette();
    initJSONFormatter();
    initTokenCounter();
    initMobileMenu();

    // Pro User - Ad Removal Check (Runs after auth.js might have set the class)
    setTimeout(applyProFeatures, 500);
});

function applyProFeatures() {
    if (document.body.classList.contains('pro-user')) {
        // Hide Ads
        document.querySelectorAll('.ad-slot').forEach(el => el.style.display = 'none');

        // Unlock Pro Features (Batch Operations)
        const batchLocks = document.querySelectorAll('.pro-feature-lock');
        batchLocks.forEach(lock => {
            lock.style.background = 'transparent';
            lock.style.border = 'none';
            lock.style.padding = '0';

            // Remove the "PRO" badge and lock text
            const badge = lock.querySelector('.plan-badge');
            if (badge) badge.style.display = 'none';
            const extraText = lock.querySelector('p');
            if (extraText) extraText.style.display = 'none';

            // Enable inputs inside
            const inputs = lock.querySelectorAll('input');
            inputs.forEach(input => input.disabled = false);
        });
    }
}

/* ===== MOBILE MENU ===== */
function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

/* ===== TOOL TABS ===== */
function initToolTabs() {
    const tabs = document.querySelectorAll('.tool-tab');
    if (!tabs || tabs.length === 0) return;
    const panels = document.querySelectorAll('.tool-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tool;

            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`panel-${target}`).classList.add('active');
        });
    });
}

/* ===== TOAST ===== */
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    toastMsg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copiado para a área de transferência!');
    } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copiado!');
    }
}

/* ===== 1. QR CODE GENERATOR ===== */
function initQRCode() {
    const input = document.getElementById('qr-input');
    if (!input) return;
    const preview = document.getElementById('qr-preview');
    const generateBtn = document.getElementById('qr-generate');
    const downloadBtn = document.getElementById('qr-download');
    const sizeSelect = document.getElementById('qr-size');
    const colorInput = document.getElementById('qr-color');
    const bgInput = document.getElementById('qr-bg');

    let qrInstance = null;

    generateBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (!text) {
            showToast('Por favor, insira um texto ou URL');
            return;
        }

        const size = parseInt(sizeSelect.value);
        const color = colorInput.value;
        const bg = bgInput.value;

        // Clear previous
        preview.innerHTML = '';

        qrInstance = new QRCode(preview, {
            text: text,
            width: size,
            height: size,
            colorDark: color,
            colorLight: bg,
            correctLevel: QRCode.CorrectLevel.H
        });

        downloadBtn.disabled = false;

        // Add animation
        preview.style.border = '2px solid var(--accent-1)';
        setTimeout(() => {
            preview.style.border = '2px dashed var(--border-color)';
        }, 1000);
    });

    downloadBtn.addEventListener('click', () => {
        const canvas = preview.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'nextools-qrcode.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('QR Code baixado com sucesso!');
        }
    });

    // Generate on Enter
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') generateBtn.click();
    });
}

/* ===== 2. PASSWORD GENERATOR ===== */
function initPasswordGenerator() {
    const output = document.getElementById('password-output');
    if (!output) return;
    const generateBtn = document.getElementById('password-generate');
    const copyBtn = document.getElementById('password-copy');
    const lengthSlider = document.getElementById('pw-length');
    const lengthVal = document.getElementById('pw-length-val');
    const upperCheck = document.getElementById('pw-upper');
    const lowerCheck = document.getElementById('pw-lower');
    const numbersCheck = document.getElementById('pw-numbers');
    const symbolsCheck = document.getElementById('pw-symbols');
    const strengthFill = document.getElementById('strength-fill');
    const strengthLabel = document.getElementById('strength-label');

    const charSets = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    lengthSlider.addEventListener('input', () => {
        lengthVal.textContent = lengthSlider.value;
    });

    function generatePassword() {
        let chars = '';
        if (upperCheck.checked) chars += charSets.upper;
        if (lowerCheck.checked) chars += charSets.lower;
        if (numbersCheck.checked) chars += charSets.numbers;
        if (symbolsCheck.checked) chars += charSets.symbols;

        if (!chars) {
            showToast('Selecione pelo menos uma opção de caracteres');
            return;
        }

        const length = parseInt(lengthSlider.value);
        let password = '';

        // Crypto-safe random
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            password += chars[array[i] % chars.length];
        }
        output.value = password;
        updateStrength(password);
        return password;
    }

    function updateStrength(password) {
        const len = password.length;
        let score = 0;
        if (len >= 8) score++;
        if (len >= 12) score++;
        if (len >= 16) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const levels = [
            { pct: '15%',  color: '#ef4444', label: 'Muito fraca' },
            { pct: '30%',  color: '#f97316', label: 'Fraca' },
            { pct: '55%',  color: '#eab308', label: 'Razoável' },
            { pct: '80%',  color: '#22c55e', label: 'Forte' },
            { pct: '100%', color: '#14b8a6', label: 'Muito forte' },
        ];

        const idx = Math.min(Math.floor(score / 1.5), 4);
        strengthFill.style.width  = levels[idx].pct;
        strengthFill.style.background = levels[idx].color;
        strengthLabel.textContent = levels[idx].label;
        strengthLabel.style.color = levels[idx].color;
    }

    generateBtn.addEventListener('click', generatePassword);

    copyBtn.addEventListener('click', () => {
        if (output.value && output.value !== 'Clique em gerar...') {
            copyToClipboard(output.value);
        }
    });

    // Generate initial password on load
    generatePassword();
}

/* ===== 3. WORD COUNTER ===== */
function initWordCounter() {
    const input = document.getElementById('wc-input');
    if (!input) return;

    function updateStats() {
        const text = input.value;

        // Words
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        document.getElementById('stat-words').textContent = words.toLocaleString();

        // Characters
        document.getElementById('stat-chars').textContent = text.length.toLocaleString();

        // Characters without spaces
        const noSpaces = text.replace(/\s/g, '').length;
        document.getElementById('stat-chars-no-space').textContent = noSpaces.toLocaleString();

        // Sentences
        const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;
        document.getElementById('stat-sentences').textContent = sentences.toLocaleString();

        // Paragraphs
        const paragraphs = text.trim() ? text.split(/\n\n+/).filter(p => p.trim()).length : 0;
        document.getElementById('stat-paragraphs').textContent = paragraphs.toLocaleString();

        // Reading time (avg 200 words/min)
        const readingMinutes = words / 200;
        let readingText;
        if (readingMinutes < 1) {
            readingText = Math.ceil(readingMinutes * 60) + 's';
        } else {
            readingText = Math.ceil(readingMinutes) + 'min';
        }
        document.getElementById('stat-reading').textContent = readingText;
    }

    input.addEventListener('input', updateStats);
}

/* ===== 4. COLOR PALETTE ===== */
function initColorPalette() {
    const display = document.getElementById('palette-display');
    if (!display) return;
    const generateBtn = document.getElementById('palette-generate');
    const modeSelect = document.getElementById('palette-mode');

    function hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function generatePalette() {
        const mode = modeSelect.value;
        const colors = [];
        const baseHue = Math.random() * 360;
        const baseSat = 60 + Math.random() * 30;
        const baseLight = 45 + Math.random() * 20;

        switch (mode) {
            case 'random':
                for (let i = 0; i < 5; i++) {
                    colors.push(hslToHex(
                        Math.random() * 360,
                        50 + Math.random() * 40,
                        35 + Math.random() * 35
                    ));
                }
                break;

            case 'analogous':
                for (let i = 0; i < 5; i++) {
                    colors.push(hslToHex(
                        (baseHue + i * 30) % 360,
                        baseSat - i * 3,
                        baseLight + (i - 2) * 5
                    ));
                }
                break;

            case 'complementary':
                colors.push(hslToHex(baseHue, baseSat, baseLight));
                colors.push(hslToHex(baseHue, baseSat - 10, baseLight + 15));
                colors.push(hslToHex((baseHue + 180) % 360, baseSat, baseLight));
                colors.push(hslToHex((baseHue + 180) % 360, baseSat - 10, baseLight + 15));
                colors.push(hslToHex(baseHue, baseSat - 20, baseLight + 25));
                break;

            case 'triadic':
                for (let i = 0; i < 5; i++) {
                    const hue = (baseHue + (Math.floor(i / 2) + (i % 2) * 0.3) * 120) % 360;
                    colors.push(hslToHex(hue, baseSat, baseLight + (i % 2) * 10));
                }
                break;

            case 'monochromatic':
                for (let i = 0; i < 5; i++) {
                    colors.push(hslToHex(
                        baseHue,
                        baseSat + (i - 2) * 8,
                        25 + i * 12
                    ));
                }
                break;
        }

        renderPalette(colors);
    }

    function renderPalette(colors) {
        display.innerHTML = colors.map(color => `
            <div class="palette-color" style="background-color: ${color}" data-color="${color}" title="Clique para copiar">
                <span class="palette-color-hex">${color.toUpperCase()}</span>
            </div>
        `).join('');

        // Add click to copy
        display.querySelectorAll('.palette-color').forEach(el => {
            el.addEventListener('click', () => {
                copyToClipboard(el.dataset.color.toUpperCase());
            });
        });
    }

    generateBtn.addEventListener('click', generatePalette);

    // Generate initial palette
    generatePalette();
}

/* ===== 5. JSON FORMATTER ===== */
function initJSONFormatter() {
    const input = document.getElementById('json-input');
    if (!input) return;
    const output = document.getElementById('json-output');
    const status = document.getElementById('json-status');
    const formatBtn = document.getElementById('json-format');
    const minifyBtn = document.getElementById('json-minify');
    const validateBtn = document.getElementById('json-validate');
    const copyBtn = document.getElementById('json-copy');

    function setStatus(message, type) {
        status.textContent = message;
        status.className = 'json-status ' + type;
    }

    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(
            /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
    }

    formatBtn.addEventListener('click', () => {
        try {
            const parsed = JSON.parse(input.value);
            const formatted = JSON.stringify(parsed, null, 2);
            output.innerHTML = `<code>${syntaxHighlight(formatted)}</code>`;
            setStatus('✅ JSON formatado com sucesso!', 'success');
        } catch (e) {
            setStatus('❌ Erro: ' + e.message, 'error');
        }
    });

    minifyBtn.addEventListener('click', () => {
        try {
            const parsed = JSON.parse(input.value);
            const minified = JSON.stringify(parsed);
            output.innerHTML = `<code>${syntaxHighlight(minified)}</code>`;
            setStatus('✅ JSON minificado com sucesso!', 'success');
        } catch (e) {
            setStatus('❌ Erro: ' + e.message, 'error');
        }
    });

    validateBtn.addEventListener('click', () => {
        try {
            const parsed = JSON.parse(input.value);
            const keys = Object.keys(typeof parsed === 'object' && parsed !== null ? parsed : {});
            setStatus(`✅ JSON válido! ${Array.isArray(parsed) ? parsed.length + ' itens' : keys.length + ' chaves'}`, 'success');
            output.innerHTML = `<code>${syntaxHighlight(JSON.stringify(parsed, null, 2))}</code>`;
        } catch (e) {
            setStatus('❌ JSON inválido: ' + e.message, 'error');
        }
    });

    copyBtn.addEventListener('click', () => {
        const text = output.textContent;
        if (text && text !== 'A saída formatada aparecerá aqui...') {
            copyToClipboard(text);
        }
    });
}

/* ===== 6. TOKEN COUNTER ===== */
function initTokenCounter() {
    const textarea = document.getElementById('tk-input');
    if (!textarea) return;

    const modelSelect = document.getElementById('tk-model');
    const tokensEl = document.getElementById('tk-tokens');
    const charsEl = document.getElementById('tk-chars');
    const wordsEl = document.getElementById('tk-words');
    const linesEl = document.getElementById('tk-lines');
    const costEl = document.getElementById('tk-cost');
    const contextPctEl = document.getElementById('tk-context-pct');
    const contextFill = document.getElementById('tk-context-fill');
    const contextLabel = document.getElementById('tk-context-label');

    const MODELS = {
        // Anthropic
        'claude-opus-46':   { name: 'Claude Opus 4.6',   inputPer1M: 5.00,  outputPer1M: 25.00, contextK: 200   },
        'claude-sonnet-46': { name: 'Claude Sonnet 4.6', inputPer1M: 3.00,  outputPer1M: 15.00, contextK: 200   },
        'claude-haiku-45':  { name: 'Claude Haiku 4.5',  inputPer1M: 1.00,  outputPer1M: 5.00,  contextK: 200   },
        // OpenAI
        'o3':               { name: 'o3',                inputPer1M: 2.00,  outputPer1M: 8.00,  contextK: 200   },
        'o4-mini':          { name: 'o4-mini',           inputPer1M: 1.10,  outputPer1M: 4.40,  contextK: 200   },
        'gpt41':            { name: 'GPT-4.1',           inputPer1M: 2.00,  outputPer1M: 8.00,  contextK: 1000  },
        'gpt41-mini':       { name: 'GPT-4.1 mini',      inputPer1M: 0.40,  outputPer1M: 1.60,  contextK: 1000  },
        'gpt4o':            { name: 'GPT-4o',            inputPer1M: 2.50,  outputPer1M: 10.00, contextK: 128   },
        'gpt4o-mini':       { name: 'GPT-4o mini',       inputPer1M: 0.15,  outputPer1M: 0.60,  contextK: 128   },
        // Google
        'gemini-25-pro':    { name: 'Gemini 2.5 Pro',    inputPer1M: 1.25,  outputPer1M: 10.00, contextK: 1000  },
        'gemini-25-flash':  { name: 'Gemini 2.5 Flash',  inputPer1M: 0.30,  outputPer1M: 2.50,  contextK: 1000  },
        'gemini-20-flash':  { name: 'Gemini 2.0 Flash',  inputPer1M: 0.10,  outputPer1M: 0.40,  contextK: 1000  },
        // DeepSeek
        'deepseek-v3':      { name: 'DeepSeek V3.1',     inputPer1M: 0.14,  outputPer1M: 0.28,  contextK: 128   },
        'deepseek-r1':      { name: 'DeepSeek R1',       inputPer1M: 0.55,  outputPer1M: 2.19,  contextK: 64    },
        // Meta
        'llama4-maverick':  { name: 'Llama 4 Maverick',  inputPer1M: 0.15,  outputPer1M: 0.60,  contextK: 512   },
        'llama4-scout':     { name: 'Llama 4 Scout',     inputPer1M: 0.08,  outputPer1M: 0.30,  contextK: 10000 },
        // Mistral
        'mistral-large':    { name: 'Mistral Large 3',   inputPer1M: 2.00,  outputPer1M: 6.00,  contextK: 128   },
        'mistral-medium':   { name: 'Mistral Medium 3',  inputPer1M: 0.40,  outputPer1M: 2.00,  contextK: 128   },
    };

    function estimateTokens(text) {
        if (!text.trim()) return 0;
        const words = text.trim().split(/\s+/).length;
        return Math.round(words * 1.35 + text.length * 0.05);
    }

    function formatCost(dollars) {
        if (dollars < 0.0001) return '$' + dollars.toFixed(6);
        if (dollars < 0.01)   return '$' + dollars.toFixed(4);
        return '$' + dollars.toFixed(4);
    }

    function contextWindowLabel(model) {
        return model.contextK >= 1000
            ? (model.contextK / 1000) + 'M'
            : model.contextK + 'K';
    }

    function updateStats() {
        const text = textarea.value;
        const model = MODELS[modelSelect.value];

        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const lines = text ? text.split('\n').length : 0;
        const tokens = estimateTokens(text);

        const inputCost = (tokens / 1_000_000) * model.inputPer1M;
        const contextPct = Math.min((tokens / (model.contextK * 1000)) * 100, 100);

        tokensEl.textContent = tokens.toLocaleString('pt-BR');
        charsEl.textContent = chars.toLocaleString('pt-BR');
        wordsEl.textContent = words.toLocaleString('pt-BR');
        linesEl.textContent = lines.toLocaleString('pt-BR');
        costEl.textContent = formatCost(inputCost);
        contextPctEl.textContent = contextPct.toFixed(1) + '%';

        contextLabel.textContent = tokens.toLocaleString('pt-BR') + ' / ' + contextWindowLabel(model) + ' tokens';
        contextFill.style.width = contextPct + '%';
        if (contextPct < 50) {
            contextFill.style.background = '#22c55e';
        } else if (contextPct < 80) {
            contextFill.style.background = '#eab308';
        } else {
            contextFill.style.background = '#ef4444';
        }

        updateCompareTable(tokens);
    }

    function updateCompareTable(inputTokens) {
        const proContent = document.getElementById('tk-pro-content');
        if (!proContent || proContent.style.display === 'none') return;

        const outputSizeEl = document.getElementById('tk-output-size');
        const outputTokens = outputSizeEl ? parseInt(outputSizeEl.value) : 500;
        const tbody = document.getElementById('tk-compare-body');
        if (!tbody) return;

        tbody.innerHTML = Object.values(MODELS).map(m => {
            const inCost = (inputTokens / 1_000_000) * m.inputPer1M;
            const outCost = (outputTokens / 1_000_000) * m.outputPer1M;
            const total = inCost + outCost;
            const pct = Math.min((inputTokens / (m.contextK * 1000)) * 100, 100);
            const pctColor = pct > 80 ? '#ef4444' : pct > 50 ? '#eab308' : '#22c55e';
            return `<tr>
                <td style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--text-primary);">${m.name}</td>
                <td style="text-align:right;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--text-secondary);">${inputTokens.toLocaleString('pt-BR')}</td>
                <td style="text-align:right;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--text-secondary);">${formatCost(inCost)}</td>
                <td style="text-align:right;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--text-secondary);">${formatCost(outCost)}</td>
                <td style="text-align:right;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-3);font-weight:600;">${formatCost(total)}</td>
                <td style="text-align:right;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.05);color:${pctColor};">${pct.toFixed(1)}%</td>
            </tr>`;
        }).join('');
    }

    textarea.addEventListener('input', updateStats);
    modelSelect.addEventListener('change', updateStats);

    // Pro features — activated when applyProFeatures() enables the signal input
    setTimeout(() => {
        const proInput = document.getElementById('tk-pro-enabled');
        const proContent = document.getElementById('tk-pro-content');
        if (!proInput || proInput.disabled || !proContent) return;

        proContent.style.display = 'block';

        const outputSizeEl = document.getElementById('tk-output-size');
        if (outputSizeEl) {
            outputSizeEl.addEventListener('change', () => updateCompareTable(estimateTokens(textarea.value)));
        }

        const exportBtn = document.getElementById('tk-export-csv');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const batchInput = document.getElementById('tk-batch');
                const rawBatch = batchInput ? batchInput.value : '';
                const prompts = rawBatch.split('---').map(p => p.trim()).filter(p => p);

                if (!prompts.length) {
                    showToast('Insira prompts separados por ---');
                    return;
                }

                const model = MODELS[modelSelect.value];
                const outputTokens = outputSizeEl ? parseInt(outputSizeEl.value) : 500;

                const rows = [['Prompt', 'Modelo', 'Tokens', 'Custo Input ($)', 'Custo Output ($)', 'Total ($)', '% Contexto']];
                prompts.forEach((prompt, i) => {
                    const tokens = estimateTokens(prompt);
                    const inCost = (tokens / 1_000_000) * model.inputPer1M;
                    const outCost = (outputTokens / 1_000_000) * model.outputPer1M;
                    const total = inCost + outCost;
                    const pct = ((tokens / (model.contextK * 1000)) * 100).toFixed(2);
                    rows.push([
                        `Prompt ${i + 1}`,
                        model.name,
                        tokens,
                        inCost.toFixed(6),
                        outCost.toFixed(6),
                        total.toFixed(6),
                        pct + '%'
                    ]);
                });

                const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'nextools-tokens.csv';
                a.click();
                URL.revokeObjectURL(url);
                showToast('CSV exportado com sucesso!');
            });
        }

        // Refresh table when user types
        textarea.addEventListener('input', () => updateCompareTable(estimateTokens(textarea.value)));
    }, 600);

    // Initial render
    updateStats();
}
