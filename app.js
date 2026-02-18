/* ===================================================
   NexTools — Application Logic
   5 Tools: QR Code, Password, Word Counter, Palette, JSON
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initToolTabs();
    initQRCode();
    initPasswordGenerator();
    initWordCounter();
    initColorPalette();
    initJSONFormatter();
});

/* ===== TOOL TABS ===== */
function initToolTabs() {
    const tabs = document.querySelectorAll('.tool-tab');
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
    }

    function updateStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (password.length >= 20) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const levels = [
            { min: 0, label: 'Muito Fraca', color: '#ef4444', width: 15 },
            { min: 2, label: 'Fraca', color: '#f97316', width: 30 },
            { min: 3, label: 'Razoável', color: '#eab308', width: 50 },
            { min: 5, label: 'Forte', color: '#22c55e', width: 75 },
            { min: 6, label: 'Muito Forte', color: '#06b6d4', width: 100 }
        ];

        let level = levels[0];
        for (const l of levels) {
            if (score >= l.min) level = l;
        }

        strengthFill.style.width = level.width + '%';
        strengthFill.style.background = level.color;
        strengthLabel.textContent = level.label;
        strengthLabel.style.color = level.color;
    }

    generateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', () => {
        if (output.value && output.value !== 'Clique em gerar...') {
            copyToClipboard(output.value);
        }
    });

    // Generate initial password
    generatePassword();
}

/* ===== 3. WORD COUNTER ===== */
function initWordCounter() {
    const input = document.getElementById('wc-input');

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
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
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
