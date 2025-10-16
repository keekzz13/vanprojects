const LuaObfuscator = (function() {
    const _0x4a2f = String.fromCharCode;
    const _0x8b3c = Math.random;
    const _0x7d5e = Date.now;
    
    function _0x9f2a(s) {
        let r = '';
        for(let i = 0; i < s.length; i++) {
            r += _0x4a2f(s.charCodeAt(i) ^ 0x5A);
        }
        return r;
    }
    
    function _0x3e8d(min, max) {
        return Math.floor(_0x8b3c() * (max - min + 1)) + min;
    }
    
    function _0x6c1b() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
        const nums = '0123456789';
        let result = chars[_0x3e8d(0, chars.length - 1)];
        const len = _0x3e8d(8, 16);
        for(let i = 0; i < len; i++) {
            const pool = chars + nums;
            result += pool[_0x3e8d(0, pool.length - 1)];
        }
        return result;
    }
    
    function _0x2d4f(str) {
        const key = _0x3e8d(1, 255);
        let encoded = '';
        for(let i = 0; i < str.length; i++) {
            encoded += '\\' + (str.charCodeAt(i) ^ key).toString();
            if(i < str.length - 1) encoded += '\\';
        }
        return {encoded, key};
    }
    
    function _0x8a7c(str) {
        let bytes = [];
        for(let i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i));
        }
        const shift = _0x3e8d(1, 7);
        bytes = bytes.map(b => ((b << shift) | (b >> (8 - shift))) & 0xFF);
        return {bytes, shift};
    }
    
    function _0x5b9e(str) {
        const key1 = _0x3e8d(10, 99);
        const key2 = _0x3e8d(10, 99);
        let result = '';
        for(let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            c = (c + key1) % 256;
            c = c ^ key2;
            result += String.fromCharCode(c);
        }
        return {data: btoa(result), k1: key1, k2: key2};
    }
    
    function _0x7f3a(code) {
        const patterns = [
            [/function\s+(\w+)\s*KATEX_INLINE_OPEN/g, 1],
            [/local\s+(\w+)/g, 1],
            [/(\w+)\s*=/g, 1],
            [/\.(\w+)/g, 1],
            [/```math
["'](\w+)["']```/g, 1],
            [/for\s+(\w+)/g, 1],
            [/(\w+)\s*,/g, 1],
            [/,\s*(\w+)/g, 1],
            [/KATEX_INLINE_OPEN(\w+)KATEX_INLINE_CLOSE/g, 1],
            [/(\w+)\s*KATEX_INLINE_CLOSE/g, 1],
            [/\s+(\w+)\s+then/g, 1],
            [/return\s+(\w+)/g, 1]
        ];
        
        const reserved = new Set([
            'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
            'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat',
            'return', 'then', 'true', 'until', 'while', 'self', 'require',
            'game', 'workspace', 'script', 'wait', 'spawn', 'delay', 'tick',
            'print', 'warn', 'error', 'assert', 'type', 'typeof', 'tostring',
            'tonumber', 'pairs', 'ipairs', 'next', 'select', 'unpack', 'table',
            'string', 'math', 'coroutine', 'os', 'debug', 'getfenv', 'setfenv',
            'getmetatable', 'setmetatable', 'rawget', 'rawset', 'pcall', 'xpcall',
            'loadstring', 'load', '_G', '_VERSION'
        ]);
        
        let identifiers = new Set();
        
        patterns.forEach(([pattern, group]) => {
            let match;
            while((match = pattern.exec(code)) !== null) {
                const id = match[group];
                if(id && !reserved.has(id) && !/^\d/.test(id)) {
                    identifiers.add(id);
                }
            }
        });
        
        return Array.from(identifiers);
    }
    
    function _0x4e6d(code, mapping) {
        let result = code;
        const sorted = Object.keys(mapping).sort((a, b) => b.length - a.length);
        
        sorted.forEach(original => {
            const obfuscated = mapping[original];
            const patterns = [
                new RegExp(`\\b${original}\\b`, 'g'),
                new RegExp(`\\.${original}\\b`, 'g'),
                new RegExp(`\```math
"${original}"\````, 'g'),
                new RegExp(`\```math
'${original}'\````, 'g')
            ];
            
            patterns.forEach(pattern => {
                result = result.replace(pattern, (match) => {
                    if(match.startsWith('.')) return '.' + obfuscated;
                    if(match.startsWith('[')) return match.replace(original, obfuscated);
                    return obfuscated;
                });
            });
        });
        
        return result;
    }
    
    function _0x9c5f(code) {
        const stringRegex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
        const strings = [];
        let match;
        
        while((match = stringRegex.exec(code)) !== null) {
            strings.push({
                value: match[0],
                start: match.index,
                end: match.index + match[0].length
            });
        }
        
        return strings;
    }
    
    function _0x1a8b(str) {
        const layers = _0x3e8d(2, 4);
        let result = str.slice(1, -1);
        let decoders = [];
        
        for(let i = 0; i < layers; i++) {
            const method = _0x3e8d(0, 2);
            switch(method) {
                case 0:
                    const xor = _0x2d4f(result);
                    result = xor.encoded;
                    decoders.unshift({type: 'xor', key: xor.key});
                    break;
                case 1:
                    const rot = _0x8a7c(result);
                    result = rot.bytes.join('\\');
                    decoders.unshift({type: 'rot', shift: rot.shift});
                    break;
                case 2:
                    const b64 = _0x5b9e(result);
                    result = b64.data;
                    decoders.unshift({type: 'b64', k1: b64.k1, k2: b64.k2});
                    break;
            }
        }
        
        return {encoded: result, decoders};
    }
    
    function _0x3f7e(decoders) {
        const varName = _0x6c1b();
        let decoder = `local ${varName} = function(d`;
        
        decoders.forEach((d, i) => {
            decoder += `, k${i}`;
        });
        decoder += `) local r = d `;
        
        decoders.forEach((d, i) => {
            switch(d.type) {
                case 'xor':
                    decoder += `r = '' for i = 1, #r, 2 do r = r .. string.char(tonumber(r:sub(i, i+1)) ~ k${i}) end `;
                    break;
                case 'rot':
                    decoder += `local t = {} for b in r:gmatch('[^\\\```+') do local n = tonumber(b) t[#t+1] = string.char(((n >> k${i}) | (n << (8 - k${i}))) & 0xFF) end r = table.concat(t) `;
                    break;
                case 'b64':
                    decoder += `r = '' local b = {} for c in r:gmatch('.') do b[#b+1] = c end for i = 1, #b do local c = b[i]:byte() c = c ~ k${i} c = (c - k${i-1}) % 256 r = r .. string.char(c) end `;
                    break;
            }
        });
        
        decoder += `return r end`;
        return {func: decoder, name: varName};
    }
    
    function _0x6d2c(num) {
        const methods = _0x3e8d(0, 3);
        const offset = _0x3e8d(1000, 9999);
        
        switch(methods) {
            case 0:
                return `(${num + offset}-${offset})`;
            case 1:
                const mult = _0x3e8d(2, 10);
                return `(${num * mult}/${mult})`;
            case 2:
                const xor = _0x3e8d(100, 999);
                return `(${num ^ xor}~${xor})`;
            case 3:
                return `(0x${num.toString(16)})`;
            default:
                return num.toString();
        }
    }
    
    function _0x8e4a(code) {
        return code.replace(/\b(\d+)\b/g, (match) => {
            const num = parseInt(match);
            if(isNaN(num)) return match;
            return _0x6d2c(num);
        });
    }
    
    function _0x2b9d() {
        const parts = [];
        const count = _0x3e8d(3, 6);
        
        for(let i = 0; i < count; i++) {
            parts.push(_0x6c1b());
        }
        
        return parts.join('_');
    }
    
    function _0x5c8f(code) {
        const chunks = [];
        const chunkSize = _0x3e8d(50, 150);
        
        for(let i = 0; i < code.length; i += chunkSize) {
            chunks.push(code.slice(i, i + chunkSize));
        }
        
        return chunks;
    }
    
    function _0x7a5b(chunks) {
        const tableVar = _0x6c1b();
        const execVar = _0x6c1b();
        
        let result = `local ${tableVar} = {`;
        
        chunks.forEach((chunk, i) => {
            const encoded = _0x5b9e(chunk);
            result += `["${_0x2b9d()}"] = {d="${encoded.data}",a=${encoded.k1},b=${encoded.k2}},`;
        });
        
        result += `} local ${execVar} = loadstring or load `;
        result += `local function ${_0x6c1b()}(t) local s = "" for k,v in pairs(t) do `;
        result += `local d = v.d local r = "" for c in d:gmatch(".") do r = r .. c end `;
        result += `for i = 1, #r do local c = r:sub(i,i):byte() c = c ~ v.b c = (c - v.a) % 256 s = s .. string.char(c) end end `;
        result += `return s end `;
        result += `${execVar}(${_0x6c1b()}(${tableVar}))()`;
        
        return result;
    }
    
    function _0x4f9c(code) {
        const gotoLabel = _0x6c1b();
        const vars = {
            a: _0x6c1b(),
            b: _0x6c1b(),
            c: _0x6c1b()
        };
        
        return `
local ${vars.a}, ${vars.b}, ${vars.c} = 0, 1, 2
::${gotoLabel}::
if ${vars.a} == 0 then
    ${vars.a} = 1
    ${code}
    goto ${_0x6c1b()}
elseif ${vars.a} == 1 then
    return
end
::${_0x6c1b()}::`;
    }
    
    function _0x9d7f(code) {
        const parts = code.split('\n');
        const mixed = [];
        
        for(let i = 0; i < parts.length; i++) {
            if(_0x8b3c() > 0.5 && i > 0) {
                mixed.push(`if ${_0x3e8d(0, 1)} == 0 then ${_0x6c1b()} = nil end`);
            }
            mixed.push(parts[i]);
        }
        
        return mixed.join('\n');
    }
    
    function _0x1e6a(code) {
        const marker = '--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--';
        const checkVar = _0x6c1b();
        const errorVar = _0x6c1b();
        const validateVar = _0x6c1b();
        
        const protection = `
local ${checkVar} = debug and debug.getinfo or function() return {source = "=[C]"} end
local ${errorVar} = ${checkVar}(1).source
if not ${errorVar}:find("${marker:slice(0, 20)}") then
    return (function()
        while true do
            (function() end)()
        end
    end)()
end
local ${validateVar} = function()
    local s = tostring(function() end)
    if #s < 10 then
        while true do end
    end
end
${validateVar}()
`;
        
        return marker + '\n' + protection + code;
    }
    
    function _0x8c3e(code) {
        const tableVar = _0x6c1b();
        const indexVar = _0x6c1b();
        const lines = code.split('\n').filter(l => l.trim());
        
        let result = `local ${tableVar} = {}\n`;
        let index = 1;
        
        lines.forEach(line => {
            const key = _0x2b9d();
            result += `${tableVar}["${key}"] = function() ${line} end\n`;
        });
        
        result += `for ${indexVar}, _ in pairs(${tableVar}) do ${tableVar}[${indexVar}]() end`;
        
        return result;
    }
    
    function _0x7b8d(code) {
        const wrapperVar = _0x6c1b();
        const proxyVar = _0x6c1b();
        
        return `
local ${wrapperVar} = setmetatable({}, {
    __index = function(t, k)
        return _G[k]
    end,
    __newindex = function(t, k, v)
        _G[k] = v
    end
})
local ${proxyVar} = function(f)
    return function(...)
        return f(...)
    end
end
${code}`;
    }
    
    function _0x5e7a() {
        const junk = [];
        const count = _0x3e8d(5, 10);
        
        for(let i = 0; i < count; i++) {
            const varName = _0x6c1b();
            const value = _0x3e8d(0, 4);
            
            switch(value) {
                case 0:
                    junk.push(`local ${varName} = ${_0x3e8d(1, 9999)}`);
                    break;
                case 1:
                    junk.push(`local ${varName} = "${_0x6c1b()}"`);
                    break;
                case 2:
                    junk.push(`local ${varName} = function() return ${_0x3e8d(1, 100)} end`);
                    break;
                case 3:
                    junk.push(`local ${varName} = {${_0x3e8d(1, 10)}, ${_0x3e8d(1, 10)}}`);
                    break;
                case 4:
                    junk.push(`local ${varName} = nil`);
                    break;
            }
        }
        
        return junk.join('\n');
    }
    
    function _0x2f8c(code) {
        const encoder = _0x6c1b();
        const decoder = _0x6c1b();
        
        return `
local ${encoder} = function(s)
    local t = {}
    for i = 1, #s do
        t[i] = s:byte(i)
    end
    return t
end
local ${decoder} = function(t)
    local s = ""
    for i = 1, #t do
        s = s .. string.char(t[i])
    end
    return s
end
${code}`;
    }
    
    function _0x9a4e(code) {
        const lines = code.split('\n');
        const obfuscated = [];
        
        lines.forEach(line => {
            if(line.trim() && _0x8b3c() > 0.3) {
                obfuscated.push(line);
                obfuscated.push(`do local ${_0x6c1b()} = ${_0x3e8d(1, 100)} end`);
            } else {
                obfuscated.push(line);
            }
        });
        
        return obfuscated.join('\n');
    }
    
    function _0x6f5b(code) {
        const strings = _0x9c5f(code);
        const stringTable = _0x6c1b();
        const getString = _0x6c1b();
        let stringDefs = `local ${stringTable} = {}\n`;
        let processedCode = code;
        
        strings.forEach((str, i) => {
            const encoded = _0x1a8b(str.value);
            const key = _0x2b9d();
            stringDefs += `${stringTable}["${key}"] = "${encoded.encoded}"\n`;
            
            const decoder = _0x3f7e(encoded.decoders);
            stringDefs += decoder.func + '\n';
            
            const replacement = `${decoder.name}(${stringTable}["${key}"]${encoded.decoders.map(d => {
                if(d.type === 'xor') return `, ${d.key}`;
                if(d.type === 'rot') return `, ${d.shift}`;
                if(d.type === 'b64') return `, ${d.k1}, ${d.k2}`;
            }).join('')})`;
            
            processedCode = processedCode.slice(0, str.start) + replacement + processedCode.slice(str.end);
        });
        
        return stringDefs + processedCode;
    }
    
    function _0x8b9f(code) {
        const ifVar = _0x6c1b();
        const condVar = _0x6c1b();
        
        const wrapped = `
local ${ifVar} = true
local ${condVar} = function(c, t, f)
    if c then return t() else return f and f() or nil end
end
${condVar}(${ifVar}, function()
${code}
end)`;
        
        return wrapped;
    }
    
    function _0x3d7c(code) {
        return code.replace(/(\r\n|\n|\r)/gm, ' ')
                   .replace(/\s+/g, ' ')
                   .replace(/\s*([=<>~+\-*/%^#])\s*/g, '$1')
                   .replace(/\s*([,;])\s*/g, '$1')
                   .replace(/\s*(KATEX_INLINE_OPEN)\s*/g, '$1')
                   .replace(/\s*(KATEX_INLINE_CLOSE)\s*/g, '$1')
                   .replace(/\s*(```math
)\s*/g, '$1')
                   .replace(/\s*(```)\s*/g, '$1')
                   .replace(/\s*(\{)\s*/g, '$1')
                   .replace(/\s*(\})\s*/g, '$1')
                   .trim();
    }
    
    function _0x7c6e(code) {
        const chunks = _0x5c8f(code);
        const shuffled = chunks.sort(() => _0x8b3c() - 0.5);
        const orderTable = _0x6c1b();
        const execTable = _0x6c1b();
        
        let result = `local ${orderTable} = {`;
        const order = [];
        
        shuffled.forEach((chunk, i) => {
            const key = _0x2b9d();
            order.push(key);
            const encoded = _0x5b9e(chunk);
            result += `["${key}"] = {d="${encoded.data}",a=${encoded.k1},b=${encoded.k2}},`;
        });
        
        result += `} local ${execTable} = {`;
        chunks.forEach((_, i) => {
            result += `"${order[i]}",`;
        });
        result += `} `;
        
        result += `local ${_0x6c1b()} = "" for i = 1, #${execTable} do `;
        result += `local v = ${orderTable}[${execTable}[i]] local r = "" `;
        result += `for c in v.d:gmatch(".") do r = r .. c end `;
        result += `for j = 1, #r do local c = r:sub(j,j):byte() `;
        result += `c = c ~ v.b c = (c - v.a) % 256 ${_0x6c1b()} = ${_0x6c1b()} .. string.char(c) end end `;
        result += `(loadstring or load)(${_0x6c1b()})()`;
        
        return result;
    }
    
    function _0x5a8d(code) {
        const vars = {
            env: _0x6c1b(),
            meta: _0x6c1b(),
            old: _0x6c1b()
        };
        
        return `
local ${vars.env} = getfenv and getfenv() or _ENV
local ${vars.old} = {}
for k, v in pairs(${vars.env}) do ${vars.old}[k] = v end
${code}
for k, v in pairs(${vars.old}) do ${vars.env}[k] = v end`;
    }
    
    function _0x9e3f(code) {
        const loopVar = _0x6c1b();
        const maxVar = _0x6c1b();
        
        return `
local ${loopVar} = 0
local ${maxVar} = ${_0x3e8d(100000, 999999)}
while ${loopVar} < ${maxVar} do
    ${loopVar} = ${loopVar} + 1
    if ${loopVar} == ${maxVar} then
        ${code}
        break
    end
end`;
    }
    
    function _0x4d8a(code) {
        const tryVar = _0x6c1b();
        const catchVar = _0x6c1b();
        
        return `
local ${tryVar}, ${catchVar} = pcall(function()
${code}
end)
if not ${tryVar} then
    error("Runtime error: " .. tostring(${catchVar}))
end`;
    }
    
    function _0x8f7b() {
        const vars = [];
        const count = _0x3e8d(10, 20);
        
        for(let i = 0; i < count; i++) {
            vars.push(`local ${_0x6c1b()} = ${_0x3e8d(0, 1)} == 1 and ${_0x3e8d(1, 100)} or nil`);
        }
        
        return vars.join('\n');
    }
    
    function _0x2c9e(code) {
        const seed = _0x7d5e();
        const hashVar = _0x6c1b();
        
        return `
local ${hashVar} = ${seed}
if ${hashVar} ~= ${seed} then
    while true do end
end
${code}`;
    }
    
    function _0x7f8c(code) {
        const cacheVar = _0x6c1b();
        const lookupVar = _0x6c1b();
        
        return `
local ${cacheVar} = {}
local ${lookupVar} = function(k)
    if ${cacheVar}[k] then
        return ${cacheVar}[k]
    end
    ${cacheVar}[k] = _G[k]
    return ${cacheVar}[k]
end
${code}`;
    }
    
    function _0x6a4d(code) {
        const stateVar = _0x6c1b();
        const switchVar = _0x6c1b();
        
        const states = code.split('\n').filter(l => l.trim());
        let result = `local ${stateVar} = 1\n`;
        result += `local ${switchVar} = function()\n`;
        
        states.forEach((state, i) => {
            result += `if ${stateVar} == ${i + 1} then\n${state}\n${stateVar} = ${stateVar} + 1\n`;
            result += `elseif `;
        });
        
        result += `${stateVar} > ${states.length} then return end\nend\n`;
        result += `while ${stateVar} <= ${states.length} do ${switchVar}() end`;
        
        return result;
    }
    
    function _0x1b7e(code) {
        const debugVar = _0x6c1b();
        const hookVar = _0x6c1b();
        
        return `
local ${debugVar} = debug
if ${debugVar} and ${debugVar}.sethook then
    local ${hookVar} = function()
        error("Debugger detected")
    end
    ${debugVar}.sethook(${hookVar}, "l", 1)
    ${debugVar}.sethook()
end
${code}`;
    }
    
    function _0x9c8f(code) {
        let processed = code;
        
        processed = processed.replace(/--```math
```math
[\s\S]*?``````/g, '');
        processed = processed.replace(/--[^\n]*/g, '');
        processed = processed.replace(/^\s*\n/gm, '');
        
        return processed;
    }
    
    function _0x5d7a(code) {
        const tableVar = _0x6c1b();
        const funcVar = _0x6c1b();
        
        const funcs = code.match(/function\s*\w*\s*KATEX_INLINE_OPEN[^)]*KATEX_INLINE_CLOSE[^}]*end/g) || [];
        let result = `local ${tableVar} = {}\n`;
        let mainCode = code;
        
        funcs.forEach((func, i) => {
            const key = _0x2b9d();
            result += `${tableVar}["${key}"] = ${func}\n`;
            mainCode = mainCode.replace(func, `${tableVar}["${key}"]`);
        });
        
        return result + mainCode;
    }
    
    function _0x8a9d(code) {
        const proxyVar = _0x6c1b();
        const handlerVar = _0x6c1b();
        
        return `
local ${handlerVar} = {
    __index = function(t, k)
        return rawget(t, k) or _G[k]
    end,
    __newindex = function(t, k, v)
        rawset(t, k, v)
    end,
    __call = function(t, ...)
        return t.func(...)
    end
}
local ${proxyVar} = setmetatable({}, ${handlerVar})
${code}`;
    }
    
    function _0x3e7f(code) {
        const constVar = _0x6c1b();
        const nums = code.match(/\b\d+\b/g) || [];
        const unique = [...new Set(nums)];
        
        if(unique.length === 0) return code;
        
        let result = `local ${constVar} = {`;
        const mapping = {};
        
        unique.forEach((num, i) => {
            const key = _0x2b9d();
            result += `["${key}"] = ${_0x6d2c(parseInt(num))},`;
            mapping[num] = `${constVar}["${key}"]`;
        });
        
        result += `}\n`;
        
        let processed = code;
        Object.keys(mapping).forEach(num => {
            processed = processed.replace(new RegExp(`\\b${num}\\b`, 'g'), mapping[num]);
        });
        
        return result + processed;
    }
    
    function _0x7d9b(code) {
        const coVar = _0x6c1b();
        const wrapVar = _0x6c1b();
        
        return `
local ${coVar} = coroutine.create(function()
${code}
end)
local ${wrapVar} = function()
    local success, err = coroutine.resume(${coVar})
    if not success then
        error("Coroutine error: " .. tostring(err))
    end
end
${wrapVar}()`;
    }
    
    function _0x2e8c(code) {
        const timeVar = _0x6c1b();
        const checkVar = _0x6c1b();
        
        return `
local ${timeVar} = os and os.clock and os.clock() or 0
${code}
local ${checkVar} = os and os.clock and os.clock() or 1
if ${checkVar} - ${timeVar} > 10 then
    error("Execution timeout")
end`;
    }
    
    function _0x9f7d(code) {
        const gcVar = _0x6c1b();
        const memVar = _0x6c1b();
        
        return `
local ${gcVar} = collectgarbage
if ${gcVar} then
    ${gcVar}("stop")
    local ${memVar} = ${gcVar}("count")
    ${code}
    ${gcVar}("restart")
    if ${gcVar}("count") - ${memVar} > 1000 then
        error("Memory violation")
    end
end`;
    }
    
    function _0x6b8e(code) {
        const depth = _0x3e8d(2, 4);
        let result = code;
        
        for(let i = 0; i < depth; i++) {
            const funcVar = _0x6c1b();
            result = `(function() ${result} end)()`;
        }
        
        return result;
    }
    
    function _0x4c7a(code) {
        const nilVar = _0x6c1b();
        const trueVar = _0x6c1b();
        const falseVar = _0x6c1b();
        
        let result = `local ${nilVar}, ${trueVar}, ${falseVar} = nil, true, false\n`;
        
        result += code.replace(/\bnil\b/g, nilVar)
                     .replace(/\btrue\b/g, trueVar)
                     .replace(/\bfalse\b/g, falseVar);
        
        return result;
    }
    
    function _0x8d6f(code) {
        const assertVar = _0x6c1b();
        const checkpoints = _0x3e8d(3, 7);
        const lines = code.split('\n');
        const step = Math.floor(lines.length / checkpoints);
        
        let result = `local ${assertVar} = function(c, m) if not c then error(m or "Assertion failed") end end\n`;
        
        for(let i = 0; i < lines.length; i++) {
            if(i % step === 0 && i > 0) {
                result += `${assertVar}(true, "Checkpoint ${i}")\n`;
            }
            result += lines[i] + '\n';
        }
        
        return result;
    }
    
    function _0x5f8a() {
        const decoys = [];
        const count = _0x3e8d(5, 10);
        
        for(let i = 0; i < count; i++) {
            const type = _0x3e8d(0, 3);
            const name = _0x6c1b();
            
            switch(type) {
                case 0:
                    decoys.push(`local function ${name}() return ${_0x3e8d(1, 100)} * ${_0x3e8d(1, 100)} end`);
                    break;
                case 1:
                    decoys.push(`local ${name} = {["${_0x6c1b()}"] = ${_0x3e8d(1, 100)}}`);
                    break;
                case 2:
                    decoys.push(`local ${name} = coroutine.create(function() end)`);
                    break;
                case 3:
                    decoys.push(`local ${name} = string.rep("${_0x6c1b()}", ${_0x3e8d(1, 10)})`);
                    break;
            }
        }
        
        return decoys.join('\n');
    }
    
    function _0x2a9c(code) {
        const id = _0x3e8d(100000, 999999);
        const idVar = _0x6c1b();
        const verifyVar = _0x6c1b();
        
        return `
local ${idVar} = ${id}
local ${verifyVar} = function()
    if ${idVar} ~= ${id} then
        (function() while true do end end)()
    end
end
${verifyVar}()
${code}
${verifyVar}()`;
    }
    
    function _0x7e8b(code) {
        const lines = code.split('\n');
        const mixed = [];
        
        for(let i = 0; i < lines.length; i++) {
            for(let j = i + 1; j < lines.length && j < i + 3; j++) {
                if(_0x8b3c() > 0.7 && !lines[i].includes('local') && !lines[j].includes('local')) {
                    const temp = lines[i];
                    lines[i] = lines[j];
                    lines[j] = temp;
                    break;
                }
            }
            mixed.push(lines[i]);
        }
        
        return mixed.join('\n');
    }
    
    return {
        obfuscate: function(inputCode) {
            let code = inputCode;
            
            code = _0x9c8f(code);
            
            const identifiers = _0x7f3a(code);
            const mapping = {};
            identifiers.forEach(id => {
                mapping[id] = _0x6c1b();
            });
            
            code = _0x4e6d(code, mapping);
            code = _0x6f5b(code);
            code = _0x8e4a(code);
            code = _0x3e7f(code);
            
            const junk1 = _0x5e7a();
            const junk2 = _0x8f7b();
            const decoys = _0x5f8a();
            
            code = junk1 + '\n' + code + '\n' + junk2;
            code = _0x9a4e(code);
            code = _0x2f8c(code);
            code = _0x7b8d(code);
            code = decoys + '\n' + code;
            
            code = _0x8b9f(code);
            code = _0x7c6e(code);
            code = _0x5a8d(code);
            code = _0x9e3f(code);
            code = _0x4d8a(code);
            code = _0x2c9e(code);
            code = _0x7f8c(code);
            code = _0x1b7e(code);
            code = _0x8a9d(code);
            code = _0x7d9b(code);
            code = _0x2e8c(code);
            code = _0x9f7d(code);
            code = _0x6b8e(code);
            code = _0x4c7a(code);
            code = _0x8d6f(code);
            code = _0x2a9c(code);
            
            code = _0x3d7c(code);
            code = _0x1e6a(code);
            
            return code;
        }
    };
})();

function obfuscateLua(code) {
    return LuaObfuscator.obfuscate(code);
}
