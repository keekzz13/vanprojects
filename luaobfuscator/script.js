class LuaObfuscator {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('obfuscateBtn').addEventListener('click', () => this.obfuscate());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadCode());
        document.getElementById('sampleBtn').addEventListener('click', () => this.loadSample());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCode());
    }

    loadSample() {
        const sampleCode = `function calculateFactorial(n)
    if n <= 1 then
        return 1
    else
        return n * calculateFactorial(n - 1)
    end
end

local result = calculateFactorial(5)
print("Factorial of 5 is: " .. result)

local users = {
    {name = "Alice", age = 25},
    {name = "Bob", age = 30},
    {name = "Charlie", age = 35}
}

for i, user in ipairs(users) do
    print(string.format("User %d: %s, age %d", i, user.name, user.age))
end`;
        document.getElementById('inputCode').value = sampleCode;
    }

    clearCode() {
        document.getElementById('inputCode').value = '';
        document.getElementById('outputCode').value = '';
    }

    obfuscate() {
        const inputCode = document.getElementById('inputCode').value.trim();
        if (!inputCode) {
            this.showMessage('Please enter Lua code to obfuscate', 'error');
            return;
        }

        const options = {
            stringEncoding: document.getElementById('stringEncoding').checked,
            controlFlow: document.getElementById('controlFlow').checked,
            deadCode: document.getElementById('deadCode').checked,
            nameObfuscation: document.getElementById('nameObfuscation').checked
        };

        try {
            const obfuscatedCode = this.obfuscateLuaCode(inputCode, options);
            document.getElementById('outputCode').value = obfuscatedCode;
            this.showMessage('Code obfuscated successfully!', 'success');
        } catch (error) {
            this.showMessage('Error during obfuscation: ' + error.message, 'error');
        }
    }

    obfuscateLuaCode(code, options) {
        const obfuscator = new AdvancedLuaObfuscator(options);
        return obfuscator.obfuscate(code);
    }

    async copyToClipboard() {
        const outputCode = document.getElementById('outputCode').value;
        if (!outputCode) {
            this.showMessage('No code to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(outputCode);
            this.showMessage('Code copied to clipboard!', 'success');
        } catch (err) {
            this.showMessage('Failed to copy code', 'error');
        }
    }

    downloadCode() {
        const outputCode = document.getElementById('outputCode').value;
        if (!outputCode) {
            this.showMessage('No code to download', 'error');
            return;
        }

        const blob = new Blob([outputCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'obfuscated_script.lua';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showMessage('Code downloaded!', 'success');
    }

    showMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        if (type === 'success') {
            messageEl.style.background = '#10b981';
        } else {
            messageEl.style.background = '#ef4444';
        }

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 3000);
    }
}

class AdvancedLuaObfuscator {
    constructor(options) {
        this.options = options;
        this.varCounter = 0;
        this.funcCounter = 0;
        this.stringEncoders = [];
        this.initEncoders();
    }

    initEncoders() {
        this.stringEncoders = [
            this.base64Encoder.bind(this),
            this.hexEncoder.bind(this),
            this.charCodeEncoder.bind(this),
            this.reverseEncoder.bind(this),
            this.xorEncoder.bind(this)
        ];
    }

    obfuscate(code) {
        let obfuscated = `--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--\n`;
        
        if (this.options.stringEncoding) {
            code = this.encodeStrings(code);
        }
        
        if (this.options.nameObfuscation) {
            code = this.obfuscateVariableNames(code);
        }
        
        if (this.options.controlFlow) {
            code = this.flattenControlFlow(code);
        }
        
        if (this.options.deadCode) {
            code = this.insertDeadCode(code);
        }
        
        const runtimeDecoder = this.generateRuntimeDecoder();
        obfuscated += runtimeDecoder + '\n' + code;
        
        return this.finalizeObfuscation(obfuscated);
    }

    encodeStrings(code) {
        const stringRegex = /(["'])(?:\\.|(?!\1).)*\1/g;
        return code.replace(stringRegex, (match) => {
            const layers = Math.floor(Math.random() * 3) + 2;
            let encoded = match;
            
            for (let i = 0; i < layers; i++) {
                const encoder = this.stringEncoders[Math.floor(Math.random() * this.stringEncoders.length)];
                encoded = encoder(encoded);
            }
            
            return encoded;
        });
    }

    base64Encoder(str) {
        const base64 = btoa(unescape(encodeURIComponent(str.slice(1, -1))));
        return `(function() local _='${base64}';return loadstring(_:gsub('.',function(x)return string.char((x:byte()+13)%256)end)())() end)()`;
    }

    hexEncoder(str) {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            hex += str.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return `loadstring('\\x'..'${hex}')()`;
    }

    charCodeEncoder(str) {
        const codes = [];
        for (let i = 0; i < str.length; i++) {
            codes.push(str.charCodeAt(i));
        }
        return `string.char(${codes.join(',')})`;
    }

    reverseEncoder(str) {
        const reversed = str.split('').reverse().join('');
        return `(${this.charCodeEncoder(reversed)}):reverse()`;
    }

    xorEncoder(str) {
        const key = Math.floor(Math.random() * 256);
        const encoded = [];
        for (let i = 0; i < str.length; i++) {
            encoded.push(str.charCodeAt(i) ^ key);
        }
        return `(function() local k=${key};local d={${encoded.join(',')}};local r='';for i=1,#d do r=r..string.char(d[i]~k)end;return r end)()`;
    }

    obfuscateVariableNames(code) {
        const varRegex = /\b(local\s+)([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
        const funcRegex = /\b(function\s+)([a-zA-Z_][a-zA-Z0-9_]*)/g;
        
        const varMap = new Map();
        
        code = code.replace(varRegex, (match, prefix, varName) => {
            if (!varMap.has(varName)) {
                varMap.set(varName, this.generateObfuscatedName());
            }
            return prefix + varMap.get(varName);
        });
        
        code = code.replace(funcRegex, (match, prefix, funcName) => {
            if (!varMap.has(funcName)) {
                varMap.set(funcName, this.generateObfuscatedName());
            }
            return prefix + varMap.get(funcName);
        });
        
        Object.keys(varMap).forEach(oldName => {
            const regex = new RegExp(`\\b${oldName}\\b`, 'g');
            code = code.replace(regex, varMap.get(oldName));
        });
        
        return code;
    }

    generateObfuscatedName() {
        const prefixes = ['_', '__', '___'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let name = prefix;
        
        for (let i = 0; i < 8 + Math.floor(Math.random() * 8); i++) {
            name += chars[Math.floor(Math.random() * chars.length)];
        }
        
        return name;
    }

    flattenControlFlow(code) {
        const functionRegex = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(.*?)\s*end/g;
        
        return code.replace(functionRegex, (match, funcName, params, body) => {
            const states = this.generateControlFlowStates(body);
            return this.buildFlattenedFunction(funcName, params, states);
        });
    }

    generateControlFlowStates(body) {
        const lines = body.split('\n').filter(line => line.trim());
        const states = [];
        let stateId = 0;
        
        for (const line of lines) {
            if (line.includes('if') || line.includes('for') || line.includes('while')) {
                states.push({ id: stateId++, type: 'control', code: line });
            } else {
                states.push({ id: stateId++, type: 'normal', code: line });
            }
        }
        
        return states;
    }

    buildFlattenedFunction(funcName, params, states) {
        let code = `function ${funcName}(${params})\n`;
        code += `local _state = 0\n`;
        code += `while true do\n`;
        code += `if _state == ${states.length} then break end\n`;
        
        states.forEach((state, index) => {
            code += `if _state == ${index} then\n`;
            code += state.code + '\n';
            code += `_state = _state + 1\n`;
            code += `end\n`;
        });
        
        code += `end\n`;
        code += `end`;
        
        return code;
    }

    insertDeadCode(code) {
        const deadCodeSnippets = [
            'local _ = function() return math.random(1, 100) end',
            'do local t = {} for i = 1, 10 do t[i] = i * 2 end end',
            'if false then print("This never executes") end',
            'local x = 1; while x < 0 do x = x + 1 end',
            'for i = 1, 0 do -- This loop never runs\nend'
        ];
        
        const lines = code.split('\n');
        const newLines = [];
        
        for (const line of lines) {
            newLines.push(line);
            if (Math.random() > 0.7 && line.trim() && !line.trim().startsWith('end')) {
                const deadCode = deadCodeSnippets[Math.floor(Math.random() * deadCodeSnippets.length)];
                newLines.push(deadCode);
            }
        }
        
        return newLines.join('\n');
    }

    generateRuntimeDecoder() {
        return `local _={}function _.d(s)return s:gsub('.',function(c)return string.char(c:byte()~42)end)end function _.e(s)return s:reverse()end function _.f(s)local r=''for i=1,#s,2 do r=r..string.char(tonumber(s:sub(i,i+1),16))end return r end`;
    }

    finalizeObfuscation(code) {
        const lines = code.split('\n');
        const obfuscatedLines = lines.map(line => {
            if (line.trim().startsWith('--')) return line;
            
            const spaces = line.match(/^\s*/)[0];
            const content = line.trim();
            
            if (content) {
                return spaces + this.obfuscateLine(content);
            }
            return line;
        });
        
        return obfuscatedLines.join('\n');
    }

    obfuscateLine(line) {
        const tokens = line.split(/([=+\-*\/%\.:,\(\){}])/);
        return tokens.map(token => {
            if (token.trim() && Math.random() > 0.5) {
                return this.wrapToken(token);
            }
            return token;
        }).join('');
    }

    wrapToken(token) {
        const wrappers = [
            t => `(function() return ${t} end)()`,
            t => `(({${t}=${t}}).${t})`,
            t => `loadstring('return '..'${t}')()`
        ];
        
        const wrapper = wrappers[Math.floor(Math.random() * wrappers.length)];
        return wrapper(token);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LuaObfuscator();
});
