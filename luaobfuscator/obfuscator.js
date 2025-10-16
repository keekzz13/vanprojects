const LuaObfuscator = (function() {
    const _0xA8F2 = ['_IL', '_ll', '_lI', '_II', '_li', '_iI', '_Ll', '_LL', '_ii', '_Li'];
    const _0xB3D1 = {};
    let _0xC5E9 = 0;
    
    function generateVarName() {
        const chars = 'IlL';
        let name = '_';
        for(let i = 0; i < 8 + Math.floor(Math.random() * 4); i++) {
            name += chars[Math.floor(Math.random() * chars.length)];
        }
        return name + Math.floor(Math.random() * 9999);
    }
    
    function encodeString(str) {
        const methods = [
            (s) => {
                let result = [];
                for(let i = 0; i < s.length; i++) {
                    result.push(s.charCodeAt(i));
                }
                return `(function() local t={${result.join(',')}} local s="" for i=1,#t do s=s..string.char(t[i]) end return s end)()`;
            },
            (s) => {
                let result = [];
                for(let i = 0; i < s.length; i++) {
                    result.push(s.charCodeAt(i) ^ 42);
                }
                return `(function() local t={${result.join(',')}} local s="" for i=1,#t do s=s..string.char(t[i]~42) end return s end)()`;
            },
            (s) => {
                let hex = '';
                for(let i = 0; i < s.length; i++) {
                    hex += '\\x' + s.charCodeAt(i).toString(16).padStart(2, '0');
                }
                return `"${hex}"`;
            }
        ];
        return methods[Math.floor(Math.random() * methods.length)](str);
    }
    
    function obfuscateNumber(num) {
        const n = parseFloat(num);
        const methods = [
            () => {
                const a = Math.floor(Math.random() * 1000) + 1;
                const b = n + a;
                return `(${b}-${a})`;
            },
            () => {
                const a = Math.floor(Math.random() * 100) + 1;
                const b = n * a;
                return `(${b}/${a})`;
            },
            () => {
                const a = Math.floor(Math.random() * 1000);
                return `(${n + a}-${a})`;
            },
            () => `(0x${n.toString(16)})`,
            () => {
                const a = Math.floor(Math.random() * 50) + 1;
                const b = Math.floor(Math.random() * 50) + 1;
                const c = n - (a + b);
                return `(${a}+${b}+${c})`;
            }
        ];
        return methods[Math.floor(Math.random() * methods.length)]();
    }
    
    function createStringTable(strings) {
        const tableVar = generateVarName();
        const decoderVar = generateVarName();
        const stringMap = new Map();
        const encodedStrings = [];
        
        strings.forEach((str, idx) => {
            const key = generateVarName();
            const encoded = [];
            for(let i = 0; i < str.length; i++) {
                encoded.push(str.charCodeAt(i) + idx + 77);
            }
            encodedStrings.push(`[${idx + 1}]={${encoded.join(',')}}`);
            stringMap.set(str, `${decoderVar}(${tableVar}[${idx + 1}],${idx + 77})`);
        });
        
        const decoder = `local ${tableVar}={${encodedStrings.join(',')}} ` +
                       `local ${decoderVar}=function(t,k) local s="" for i=1,#t do s=s..string.char(t[i]-k) end return s end `;
        
        return { decoder, stringMap, tableVar };
    }
    
    function extractStrings(code) {
        const strings = [];
        const regex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
        let match;
        while((match = regex.exec(code)) !== null) {
            const content = match[0].slice(1, -1);
            if(content.length > 0) {
                strings.push({
                    full: match[0],
                    content: content,
                    index: match.index
                });
            }
        }
        return strings;
    }
    
    function createVarMapping(code) {
        const keywords = ['local', 'function', 'if', 'then', 'else', 'elseif', 'end', 
                         'for', 'while', 'do', 'repeat', 'until', 'return', 'break',
                         'and', 'or', 'not', 'true', 'false', 'nil', 'in', 'pairs',
                         'ipairs', 'next', 'print', 'type', 'tostring', 'tonumber',
                         'string', 'table', 'math', 'coroutine', 'io', 'os', 'debug',
                         'getfenv', 'setfenv', 'getmetatable', 'setmetatable', 'rawget',
                         'rawset', 'pcall', 'xpcall', 'load', 'loadstring', 'require',
                         'module', 'select', 'unpack', 'error', 'assert'];
        
        const varRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
        const vars = new Set();
        let match;
        
        while((match = varRegex.exec(code)) !== null) {
            if(!keywords.includes(match[1]) && !match[1].startsWith('_')) {
                vars.add(match[1]);
            }
        }
        
        const mapping = new Map();
        vars.forEach(v => {
            mapping.set(v, generateVarName());
        });
        
        return mapping;
    }
    
    function injectDeadCode() {
        const deadVars = [];
        const count = 3 + Math.floor(Math.random() * 5);
        
        for(let i = 0; i < count; i++) {
            const varName = generateVarName();
            const templates = [
                `local ${varName}=(function() return ${Math.random()} end)()`,
                `local ${varName}={[${Math.floor(Math.random() * 100)}]=${Math.floor(Math.random() * 100)}}`,
                `local ${varName}=coroutine.create(function() while false do end end)`,
                `local ${varName}=(function() local t={} for i=1,${Math.floor(Math.random() * 10)} do t[i]=i end return t end)()`
            ];
            deadVars.push(templates[Math.floor(Math.random() * templates.length)]);
        }
        
        return deadVars.join(' ');
    }
    
    function createControlFlow(code) {
        const flowVar = generateVarName();
        const stateVar = generateVarName();
        const chunks = code.split(/(?<=end|;|\n)/).filter(c => c.trim());
        
        if(chunks.length < 2) return code;
        
        const states = [];
        chunks.forEach((chunk, idx) => {
            states.push({
                id: idx + 1,
                code: chunk,
                next: idx < chunks.length - 1 ? idx + 2 : 0
            });
        });
        
        states.sort(() => Math.random() - 0.5);
        
        let flow = `local ${stateVar}=1 local ${flowVar}={`;
        states.forEach((state, idx) => {
            flow += `[${state.id}]=function() ${state.code} ${stateVar}=${state.next} end`;
            if(idx < states.length - 1) flow += ',';
        });
        flow += `} while ${stateVar}>0 do ${flowVar}[${stateVar}]() end`;
        
        return flow;
    }
    
    function createAntiTamper() {
        const checkVar = generateVarName();
        const sourceVar = generateVarName();
        const errorVar = generateVarName();
        
        return `local ${checkVar}=(function()
            local ${sourceVar}=debug and debug.getinfo and debug.getinfo(1,'S').source or ""
            if not ${sourceVar}:match("Obfuscated in https://vanprojects%.netlify%.app/luaobfuscator") then
                local ${errorVar}=function() while true do end end
                ${errorVar}()
            end
        end)() `;
    }
    
    function createGarbageCollector() {
        const gcVar = generateVarName();
        const memVar = generateVarName();
        
        return `local ${gcVar}=collectgarbage local ${memVar}=${gcVar}("count") `;
    }
    
    function createProxyTable() {
        const proxyVar = generateVarName();
        const mtVar = generateVarName();
        const dataVar = generateVarName();
        
        return `local ${dataVar}={} local ${mtVar}={__index=function(t,k) return ${dataVar}[k] end,__newindex=function(t,k,v) ${dataVar}[k]=v end} local ${proxyVar}=setmetatable({},${mtVar}) `;
    }
    
    function wrapInClosure(code) {
        const mainVar = generateVarName();
        const envVar = generateVarName();
        const loadVar = generateVarName();
        
        return `(function() local ${envVar}=getfenv and getfenv() or _ENV local ${mainVar}=function() ${code} end local ${loadVar}=coroutine.wrap(${mainVar}) ${loadVar}() end)()`;
    }
    
    function obfuscateBooleans(code) {
        code = code.replace(/\btrue\b/g, '(not false)');
        code = code.replace(/\bfalse\b/g, '(not true)');
        code = code.replace(/\bnil\b/g, '(function() return end)()');
        return code;
    }
    
    function createJunkMethods() {
        const junk = [];
        const count = 2 + Math.floor(Math.random() * 3);
        
        for(let i = 0; i < count; i++) {
            const funcVar = generateVarName();
            const paramVar = generateVarName();
            junk.push(`local ${funcVar}=function(${paramVar}) return ${paramVar} and ${paramVar} or ${Math.random()} end`);
        }
        
        return junk.join(' ');
    }
    
    function encodeAsBytes(code) {
        const bytes = [];
        for(let i = 0; i < code.length; i++) {
            bytes.push(code.charCodeAt(i));
        }
        
        const loaderVar = generateVarName();
        const dataVar = generateVarName();
        const decodeVar = generateVarName();
        
        const chunks = [];
        for(let i = 0; i < bytes.length; i += 100) {
            chunks.push(bytes.slice(i, i + 100));
        }
        
        let result = `local ${dataVar}={`;
        chunks.forEach((chunk, idx) => {
            result += `[${idx + 1}]={${chunk.join(',')}}`;
            if(idx < chunks.length - 1) result += ',';
        });
        result += `} local ${decodeVar}=function(t) local s="" for _,c in pairs(t) do for _,b in pairs(c) do s=s..string.char(b) end end return s end `;
        result += `local ${loaderVar}=load or loadstring ${loaderVar}(${decodeVar}(${dataVar}))()`;
        
        return result;
    }
    
    function obfuscate(input) {
        if(!input || !input.trim()) return '';
        
        let code = input;
        code = code.replace(/--```math
```math
[\s\S]*?``````/g, '');
        code = code.replace(/--[^\n]*/g, '');
        code = code.replace(/\n\s*\n/g, '\n');
        
        const strings = extractStrings(code);
        const uniqueStrings = [...new Set(strings.map(s => s.content))];
        
        if(uniqueStrings.length > 0) {
            const { decoder, stringMap } = createStringTable(uniqueStrings);
            
            strings.reverse().forEach(str => {
                const replacement = stringMap.get(str.content);
                if(replacement) {
                    code = code.substring(0, str.index) + replacement + code.substring(str.index + str.full.length);
                }
            });
            
            code = decoder + code;
        }
        
        const numbers = code.match(/\b\d+\.?\d*\b/g) || [];
        numbers.forEach(num => {
            if(parseFloat(num) > 0) {
                const regex = new RegExp(`\\b${num}\\b`, 'g');
                code = code.replace(regex, obfuscateNumber(num));
            }
        });
        
        code = obfuscateBooleans(code);
        
        const varMapping = createVarMapping(code);
        varMapping.forEach((newName, oldName) => {
            const regex = new RegExp(`\\b${oldName}\\b`, 'g');
            code = code.replace(regex, newName);
        });
        
        const deadCode = injectDeadCode();
        const junkMethods = createJunkMethods();
        const proxyTable = createProxyTable();
        const gcCode = createGarbageCollector();
        
        code = deadCode + ' ' + junkMethods + ' ' + proxyTable + ' ' + gcCode + ' ' + code;
        
        if(code.length > 200 && Math.random() > 0.3) {
            code = createControlFlow(code);
        }
        
        code = wrapInClosure(code);
        
        const antiTamper = createAntiTamper();
        code = antiTamper + code;
        
        if(code.length > 500 && Math.random() > 0.5) {
            code = encodeAsBytes(code);
        }
        
        const watermark = "--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--";
        
        code = code.replace(/\s+/g, ' ').trim();
        
        return watermark + '\n' + code;
    }
    
    return { obfuscate };
})();

if(typeof window !== 'undefined') {
    window.LuaObfuscator = LuaObfuscator;
}
