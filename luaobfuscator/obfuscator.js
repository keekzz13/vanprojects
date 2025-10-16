const LuaObfuscator = (function() {
    const _0x4a2b = Math.random().toString(36).substring(2);
    const _0x9f8e = Date.now().toString(36);
    let _0x3c1d = 0;
    
    function _0x7b5a(str) {
        let result = '';
        for(let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ 0x2A);
        }
        return btoa(result).split('').reverse().join('');
    }
    
    function _0x6e2f(str) {
        const key = Math.floor(Math.random() * 256);
        return str.split('').map(c => 
            String.fromCharCode((c.charCodeAt(0) + key) % 256)
        ).join('') + '|' + key;
    }
    
    function _0x1a9c(str) {
        const methods = [
            s => s.split('').map(c => '\\' + c.charCodeAt(0)).join(''),
            s => s.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x5F)).join(''),
            s => btoa(s).replace(/=/g, ''),
            s => s.split('').reverse().join('').split('').map(c => c.charCodeAt(0).toString(16)).join('-')
        ];
        return methods[Math.floor(Math.random() * methods.length)](str);
    }
    
    const _0x8d4b = {
        vars: new Map(),
        funcs: new Map(),
        strings: new Map(),
        numbers: new Map()
    };
    
    function _0x5f3e() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
        const nums = '0123456789';
        let result = chars[Math.floor(Math.random() * chars.length)];
        const len = 8 + Math.floor(Math.random() * 8);
        for(let i = 1; i < len; i++) {
            const pool = chars + nums;
            result += pool[Math.floor(Math.random() * pool.length)];
        }
        return result;
    }
    
    function _0x9a1b(code) {
        const pattern = /(["'])(?:(?=(\\?))\2.)*?\1/g;
        const strings = [];
        let match;
        while((match = pattern.exec(code)) !== null) {
            strings.push({
                value: match[0],
                index: match.index,
                length: match[0].length
            });
        }
        return strings;
    }
    
    function _0x2c8f(code) {
        const keywords = ['local', 'function', 'if', 'then', 'else', 'elseif', 'end', 
                         'for', 'while', 'do', 'repeat', 'until', 'return', 'break',
                         'and', 'or', 'not', 'true', 'false', 'nil', 'in'];
        const pattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
        const identifiers = new Set();
        let match;
        while((match = pattern.exec(code)) !== null) {
            if(!keywords.includes(match[1])) {
                identifiers.add(match[1]);
            }
        }
        return Array.from(identifiers);
    }
    
    function _0x7d2a(code) {
        const strings = _0x9a1b(code);
        const stringMap = new Map();
        const decoderVar = '_' + _0x5f3e();
        const tableVar = '_' + _0x5f3e();
        const stringTable = [];
        
        strings.forEach((str, idx) => {
            const content = str.value.slice(1, -1);
            const encoded = _0x1a9c(content);
            const key = '_0x' + Math.random().toString(36).substring(2, 10);
            stringTable.push(`["${key}"]="${encoded}"`);
            stringMap.set(str.value, `${tableVar}["${key}"]`);
        });
        
        let result = code;
        strings.reverse().forEach(str => {
            result = result.substring(0, str.index) + 
                     stringMap.get(str.value) + 
                     result.substring(str.index + str.length);
        });
        
        const decoder = `local ${tableVar}={${stringTable.join(',')}} ` +
                       `local ${decoderVar}=function(s) ` +
                       `local r="" for i=1,#s do r=r..string.char(string.byte(s,i)~95) end ` +
                       `return r end `;
        
        return decoder + result;
    }
    
    function _0x4e9d(code) {
        const identifiers = _0x2c8f(code);
        const mapping = new Map();
        
        identifiers.forEach(id => {
            if(!mapping.has(id)) {
                mapping.set(id, '_' + _0x5f3e());
            }
        });
        
        let result = code;
        Array.from(mapping.entries()).sort((a, b) => b[0].length - a[0].length).forEach(([orig, obf]) => {
            const regex = new RegExp('\\b' + orig + '\\b', 'g');
            result = result.replace(regex, obf);
        });
        
        return result;
    }
    
    function _0x3b7c(code) {
        const controlFlow = [];
        const chunks = code.split('\n').filter(line => line.trim());
        const shuffled = [];
        const jumpTable = '_' + _0x5f3e();
        const indexVar = '_' + _0x5f3e();
        
        chunks.forEach((chunk, idx) => {
            const label = '_' + _0x5f3e();
            controlFlow.push({
                code: chunk,
                label: label,
                index: idx
            });
        });
        
        const order = controlFlow.map((_, i) => i).sort(() => Math.random() - 0.5);
        let flowCode = `local ${jumpTable}={} local ${indexVar}=1 `;
        
        order.forEach((originalIdx, currentIdx) => {
            const nextIdx = currentIdx < order.length - 1 ? 
                          order.indexOf(order[currentIdx] + 1) + 1 : 0;
            flowCode += `${jumpTable}[${currentIdx + 1}]=function() ${controlFlow[originalIdx].code} ${indexVar}=${nextIdx} end `;
        });
        
        flowCode += `while ${indexVar}>0 do ${jumpTable}[${indexVar}]() end`;
        return flowCode;
    }
    
    function _0x8f5b(code) {
        const numbers = code.match(/\b\d+(\.\d+)?\b/g) || [];
        const numMap = new Map();
        const numVar = '_' + _0x5f3e();
        
        numbers.forEach(num => {
            if(!numMap.has(num)) {
                const offset = Math.floor(Math.random() * 1000);
                const encoded = (parseFloat(num) + offset) + '-' + offset;
                numMap.set(num, `(${encoded})`);
            }
        });
        
        let result = code;
        Array.from(numMap.entries()).sort((a, b) => b[0].length - a[0].length).forEach(([orig, obf]) => {
            const regex = new RegExp('\\b' + orig + '\\b', 'g');
            result = result.replace(regex, obf);
        });
        
        return result;
    }
    
    function _0x6a4c(code) {
        const ops = {
            '+': function(a, b) { return `(${a}+${b})` },
            '-': function(a, b) { return `(${a}-${b})` },
            '*': function(a, b) { return `(${a}*${b})` },
            '/': function(a, b) { return `(${a}/${b})` },
            '==': function(a, b) { return `(${a}==${b})` },
            '~=': function(a, b) { return `(${a}~=${b})` }
        };
        
        let result = code;
        Object.keys(ops).forEach(op => {
            const regex = new RegExp(`([^\\s]+)\\s*\\${op}\\s*([^\\s]+)`, 'g');
            result = result.replace(regex, (match, a, b) => {
                if(Math.random() > 0.5) {
                    return ops[op](a, b);
                }
                return match;
            });
        });
        
        return result;
    }
    
    function _0x2d8e(code) {
        const wrapper = '_' + _0x5f3e();
        const env = '_' + _0x5f3e();
        const load = '_' + _0x5f3e();
        
        const antiTamper = `
local ${wrapper}=(function()
    local ${env}=getfenv and getfenv() or _ENV
    local ${load}=load or loadstring
    if not ${env} then return end
    local _c="--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--"
    local _s=debug.getinfo(1,'S').source
    if _s and not _s:match(_c:gsub("%-","%%-"):gsub("%[","%["):gsub("%]","%]")) then
        while true do end
    end
end)()
`;
        return antiTamper + code;
    }
    
    function _0x9c3f(code) {
        const deadCode = [];
        const numDead = 5 + Math.floor(Math.random() * 10);
        
        for(let i = 0; i < numDead; i++) {
            const varName = '_' + _0x5f3e();
            const templates = [
                `local ${varName}=function() return ${Math.random()} end`,
                `local ${varName}={${Math.random()},${Math.random()}}`,
                `local ${varName}=coroutine.create(function() end)`,
                `local ${varName}=setmetatable({},{__index=function() return nil end})`,
                `local ${varName}=string.rep("a",${Math.floor(Math.random() * 100)})`
            ];
            deadCode.push(templates[Math.floor(Math.random() * templates.length)]);
        }
        
        const lines = code.split('\n');
        const insertPositions = [];
        for(let i = 0; i < deadCode.length; i++) {
            insertPositions.push(Math.floor(Math.random() * lines.length));
        }
        
        insertPositions.sort((a, b) => b - a);
        insertPositions.forEach((pos, idx) => {
            lines.splice(pos, 0, deadCode[idx]);
        });
        
        return lines.join('\n');
    }
    
    function _0x5b7a(code) {
        const proxyVar = '_' + _0x5f3e();
        const metaVar = '_' + _0x5f3e();
        
        const proxy = `
local ${metaVar}={
    __index=function(t,k) return rawget(t,k) end,
    __newindex=function(t,k,v) rawset(t,k,v) end
}
local ${proxyVar}=setmetatable({},${metaVar})
`;
        return proxy + code;
    }
    
    function _0x1e4d(code) {
        const chunks = [];
        const chunkSize = 50 + Math.floor(Math.random() * 50);
        
        for(let i = 0; i < code.length; i += chunkSize) {
            chunks.push(code.substring(i, i + chunkSize));
        }
        
        const concatVar = '_' + _0x5f3e();
        const tableVar = '_' + _0x5f3e();
        
        let result = `local ${tableVar}={`;
        chunks.forEach((chunk, idx) => {
            const encoded = chunk.split('').map(c => '\\' + c.charCodeAt(0)).join('');
            result += `"${encoded}"${idx < chunks.length - 1 ? ',' : ''}`;
        });
        result += `} local ${concatVar}=table.concat(${tableVar}) `;
        
        return result + `loadstring(${concatVar})()`;
    }
    
    function _0x7f9b(code) {
        const gotoLabel = '_' + _0x5f3e();
        const lines = code.split('\n').filter(line => line.trim());
        
        const jumps = [];
        lines.forEach((line, idx) => {
            if(Math.random() > 0.7) {
                const label = '_' + _0x5f3e();
                jumps.push({
                    line: idx,
                    label: label
                });
            }
        });
        
        let result = lines.join('\n');
        jumps.forEach(jump => {
            const target = Math.floor(Math.random() * lines.length);
            result = result.replace(lines[jump.line], 
                    `::${jump.label}:: ${lines[jump.line]} goto ${jump.label}_end ::${jump.label}_end::`);
        });
        
        return result;
    }
    
    function _0x4d2c(code) {
        const bytecode = [];
        for(let i = 0; i < code.length; i++) {
            bytecode.push(code.charCodeAt(i));
        }
        
        const decoder = '_' + _0x5f3e();
        const data = '_' + _0x5f3e();
        
        return `local ${data}={${bytecode.join(',')}} ` +
               `local ${decoder}=function(t) local s="" for i=1,#t do s=s..string.char(t[i]) end return s end ` +
               `loadstring(${decoder}(${data}))()`;
    }
    
    function obfuscate(code) {
        _0x3c1d++;
        const watermark = "--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--\n";
        
        let obfuscated = code;
        obfuscated = obfuscated.replace(/--```math
```math
[\s\S]*?``````/g, '');
        obfuscated = obfuscated.replace(/--[^\n]*/g, '');
        obfuscated = obfuscated.replace(/\s+/g, ' ').trim();
        
        obfuscated = _0x7d2a(obfuscated);
        obfuscated = _0x8f5b(obfuscated);
        obfuscated = _0x4e9d(obfuscated);
        obfuscated = _0x6a4c(obfuscated);
        
        if(Math.random() > 0.3) obfuscated = _0x9c3f(obfuscated);
        if(Math.random() > 0.4) obfuscated = _0x5b7a(obfuscated);
        if(Math.random() > 0.5) obfuscated = _0x3b7c(obfuscated);
        
        obfuscated = _0x2d8e(obfuscated);
        
        if(code.length > 100 && Math.random() > 0.6) {
            obfuscated = _0x4d2c(obfuscated);
        }
        
        const finalVar = '_' + _0x5f3e();
        const execVar = '_' + _0x5f3e();
        const checkVar = '_' + _0x5f3e();
        
        const finalWrapper = `
local ${checkVar}=function()
    local s=debug.getinfo(1,'S').source
    if not s:match("Obfuscated in https://vanprojects%.netlify%.app/luaobfuscator") then
        error("")
    end
end
${checkVar}()
local ${finalVar}=function()
    ${obfuscated}
end
local ${execVar}=coroutine.wrap(${finalVar})
${execVar}()`;
        
        return watermark + finalWrapper.replace(/\n\s*/g, ' ').trim();
    }
    
    return { obfuscate };
})();

window.LuaObfuscator = LuaObfuscator;
