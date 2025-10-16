const LuaObfuscator = (function() {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    const digits = '0123456789';
    
    function randomString(length) {
        let result = charset[Math.floor(Math.random() * charset.length)];
        for (let i = 1; i < length; i++) {
            const pool = charset + digits;
            result += pool[Math.floor(Math.random() * pool.length)];
        }
        return result;
    }
    
    function generateVarName() {
        const prefixes = ['_', '__', '___'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return prefix + randomString(Math.floor(Math.random() * 8) + 12);
    }
    
    function escapeString(str) {
        return str.replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/'/g, "\\'")
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r')
                  .replace(/\t/g, '\\t');
    }
    
    function encodeString(str) {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i));
        }
        return bytes;
    }
    
    function xorEncrypt(str, key) {
        let result = [];
        for (let i = 0; i < str.length; i++) {
            result.push(str.charCodeAt(i) ^ key);
        }
        return result;
    }
    
    function createStringTable(strings) {
        const tableVar = generateVarName();
        const decryptVar = generateVarName();
        const key = Math.floor(Math.random() * 200) + 55;
        
        let code = `local ${tableVar} = {}\n`;
        const replacements = {};
        
        strings.forEach((str, index) => {
            const encrypted = xorEncrypt(str.content, key);
            const indexName = generateVarName();
            code += `${tableVar}["${indexName}"] = {`;
            encrypted.forEach((byte, i) => {
                code += byte;
                if (i < encrypted.length - 1) code += ',';
            });
            code += `}\n`;
            replacements[str.original] = `${decryptVar}(${tableVar}["${indexName}"],${key})`;
        });
        
        code += `local ${decryptVar} = function(t,k) local s = "" for i=1,#t do s=s..string.char(t[i]~k) end return s end\n`;
        
        return { code, replacements };
    }
    
    function extractStrings(code) {
        const strings = [];
        const regex = /(['"])((?:\\.|(?!\1).)*?)\1/g;
        let match;
        
        while ((match = regex.exec(code)) !== null) {
            strings.push({
                original: match[0],
                content: match[2],
                index: match.index
            });
        }
        
        return strings;
    }
    
    function obfuscateNumbers(code) {
        return code.replace(/\b(\d+)\b/g, (match, num) => {
            const n = parseInt(num);
            if (isNaN(n)) return match;
            
            const method = Math.floor(Math.random() * 4);
            switch(method) {
                case 0:
                    const add = Math.floor(Math.random() * 1000) + 100;
                    return `(${n + add}-${add})`;
                case 1:
                    const mul = Math.floor(Math.random() * 9) + 2;
                    return `(${n * mul}/${mul})`;
                case 2:
                    return `(0x${n.toString(16)})`;
                case 3:
                    const xor = Math.floor(Math.random() * 255) + 1;
                    return `(${n ^ xor}~${xor})`;
                default:
                    return match;
            }
        });
    }
    
    function createVariableMap(code) {
        const reserved = [
            'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
            'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat',
            'return', 'then', 'true', 'until', 'while', 'self', 'require',
            'game', 'workspace', 'script', 'wait', 'spawn', 'delay', 'tick',
            'print', 'warn', 'error', 'assert', 'type', 'typeof', 'tostring',
            'tonumber', 'pairs', 'ipairs', 'next', 'select', 'table',
            'string', 'math', 'coroutine', 'os', 'debug', 'getfenv', 'setfenv',
            'getmetatable', 'setmetatable', 'rawget', 'rawset', 'pcall', 'xpcall',
            'loadstring', 'load', '_G', '_VERSION', 'Instance', 'Vector3', 'CFrame',
            'Color3', 'UDim2', 'TweenInfo', 'Enum', 'Ray', 'Region3'
        ];
        
        const variableRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
        const found = new Set();
        let match;
        
        while ((match = variableRegex.exec(code)) !== null) {
            const varName = match[1];
            if (!reserved.includes(varName) && !varName.startsWith('_')) {
                found.add(varName);
            }
        }
        
        const mapping = {};
        found.forEach(varName => {
            mapping[varName] = generateVarName();
        });
        
        return mapping;
    }
    
    function replaceVariables(code, mapping) {
        let result = code;
        
        Object.keys(mapping).sort((a, b) => b.length - a.length).forEach(original => {
            const replacement = mapping[original];
            const regex = new RegExp(`\\b${original}\\b`, 'g');
            result = result.replace(regex, replacement);
        });
        
        return result;
    }
    
    function addJunkCode(code) {
        const lines = code.split('\n');
        const result = [];
        
        lines.forEach(line => {
            result.push(line);
            if (Math.random() > 0.7 && line.trim() && !line.includes('local')) {
                const junkVar = generateVarName();
                const junkType = Math.floor(Math.random() * 3);
                switch(junkType) {
                    case 0:
                        result.push(`local ${junkVar} = ${Math.floor(Math.random() * 9999)}`);
                        break;
                    case 1:
                        result.push(`local ${junkVar} = function() return nil end`);
                        break;
                    case 2:
                        result.push(`local ${junkVar} = {}`);
                        break;
                }
            }
        });
        
        return result.join('\n');
    }
    
    function wrapInClosure(code) {
        const funcName = generateVarName();
        return `(function() ${code} end)()`;
    }
    
    function addControlFlow(code) {
        const checkVar = generateVarName();
        const stateVar = generateVarName();
        
        return `
local ${stateVar} = true
local ${checkVar} = function()
    if not ${stateVar} then
        while true do end
    end
end
${checkVar}()
${code}
${checkVar}()`;
    }
    
    function encodeBase64(str) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        
        while (i < str.length) {
            const a = str.charCodeAt(i++);
            const b = i < str.length ? str.charCodeAt(i++) : 0;
            const c = i < str.length ? str.charCodeAt(i++) : 0;
            
            const bitmap = (a << 16) | (b << 8) | c;
            
            result += chars.charAt((bitmap >> 18) & 63);
            result += chars.charAt((bitmap >> 12) & 63);
            result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
            result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
        }
        
        return result;
    }
    
    function createLoader(code) {
        const chunks = [];
        const chunkSize = 100;
        
        for (let i = 0; i < code.length; i += chunkSize) {
            chunks.push(code.substr(i, chunkSize));
        }
        
        const tableVar = generateVarName();
        const loaderVar = generateVarName();
        const concatVar = generateVarName();
        
        let result = `local ${tableVar} = {}\n`;
        
        chunks.forEach((chunk, i) => {
            const key = generateVarName();
            const encrypted = xorEncrypt(chunk, 42);
            result += `${tableVar}["${key}"] = {`;
            encrypted.forEach((byte, j) => {
                result += byte;
                if (j < encrypted.length - 1) result += ',';
            });
            result += `}\n`;
        });
        
        result += `
local ${concatVar} = ""
local ${loaderVar} = function(t)
    for k,v in pairs(t) do
        for i=1,#v do
            ${concatVar} = ${concatVar} .. string.char(v[i]~42)
        end
    end
    return ${concatVar}
end
local ${generateVarName()} = ${loaderVar}(${tableVar})
return (loadstring or load)(${generateVarName()})()`;
        
        return result;
    }
    
    function addWatermarkProtection(code) {
        const watermark = '--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--';
        const checkVar = generateVarName();
        const validateVar = generateVarName();
        const sourceVar = generateVarName();
        
        const protection = `
local ${sourceVar} = [[${watermark}]]
local ${checkVar} = function()
    local ${validateVar} = debug and debug.getinfo or function() return {source=""} end
    if not ${sourceVar}:find("vanprojects") then
        return (function() while true do end end)()
    end
end
${checkVar}()
`;
        
        return watermark + '\n' + protection + code;
    }
    
    function compressCode(code) {
        return code.replace(/--```math
[\s\S]*?``````/g, '')
                   .replace(/--[^\n]*/g, '')
                   .replace(/\s+/g, ' ')
                   .replace(/\s*([=+\-*/%<>~])\s*/g, '$1')
                   .replace(/\s*([(),{}[```;])\s*/g, '$1')
                   .replace(/;\s*/g, ';')
                   .replace(/\n+/g, ' ')
                   .trim();
    }
    
    function generateRandomConstants() {
        const count = Math.floor(Math.random() * 5) + 5;
        const constants = [];
        
        for (let i = 0; i < count; i++) {
            const name = generateVarName();
            const value = Math.floor(Math.random() * 10000);
            constants.push(`local ${name} = ${value}`);
        }
        
        return constants.join('\n');
    }
    
    function shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    
    function createComplexLoader(code) {
        const parts = [];
        const partSize = 50;
        
        for (let i = 0; i < code.length; i += partSize) {
            parts.push(code.substr(i, partSize));
        }
        
        const shuffled = shuffleArray(parts.map((part, i) => ({ part, index: i })));
        const tableVar = generateVarName();
        const orderVar = generateVarName();
        const assembleVar = generateVarName();
        
        let result = `local ${tableVar} = {}\n`;
        let order = `local ${orderVar} = {`;
        
        shuffled.forEach(({ part, index }) => {
            const key = generateVarName();
            const xorKey = Math.floor(Math.random() * 127) + 1;
            const encrypted = xorEncrypt(part, xorKey);
            
            result += `${tableVar}["${key}"] = {k=${xorKey},d={`;
            encrypted.forEach((byte, i) => {
                result += byte;
                if (i < encrypted.length - 1) result += ',';
            });
            result += `}}\n`;
            
            order += `{i=${index},k="${key}"},`;
        });
        
        order = order.slice(0, -1) + '}\n';
        
        result += order;
        result += `
table.sort(${orderVar}, function(a,b) return a.i < b.i end)
local ${assembleVar} = ""
for _,v in ipairs(${orderVar}) do
    local t = ${tableVar}[v.k]
    for _,b in ipairs(t.d) do
        ${assembleVar} = ${assembleVar} .. string.char(b ~ t.k)
    end
end
return (loadstring or load)(${assembleVar})()`;
        
        return result;
    }
    
    return {
        obfuscate: function(inputCode) {
            let code = inputCode;
            
            code = compressCode(code);
            
            const strings = extractStrings(code);
            if (strings.length > 0) {
                const stringTable = createStringTable(strings);
                strings.reverse().forEach(str => {
                    code = code.replace(str.original, stringTable.replacements[str.original]);
                });
                code = stringTable.code + code;
            }
            
            code = obfuscateNumbers(code);
            
            const varMap = createVariableMap(code);
            code = replaceVariables(code, varMap);
            
            code = addJunkCode(code);
            
            const constants = generateRandomConstants();
            code = constants + '\n' + code;
            
            code = addControlFlow(code);
            
            code = wrapInClosure(code);
            
            code = createComplexLoader(code);
            
            code = addWatermarkProtection(code);
            
            return code;
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LuaObfuscator;
}
