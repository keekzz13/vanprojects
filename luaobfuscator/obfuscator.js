const ObfuscatorEngine = (function() {
    const WATERMARK = '--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--';
    
    const LuaKeywords = new Set([
        'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
        'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat',
        'return', 'then', 'true', 'until', 'while', 'goto'
    ]);
    
    const LuaBuiltins = new Set([
        'assert', 'collectgarbage', 'dofile', 'error', 'getmetatable',
        'ipairs', 'load', 'loadfile', 'next', 'pairs', 'pcall', 'print',
        'rawequal', 'rawget', 'rawlen', 'rawset', 'select', 'setmetatable',
        'tonumber', 'tostring', 'type', 'xpcall', 'require', 'module',
        'math', 'string', 'table', 'io', 'os', 'coroutine', 'package',
        'debug', 'bit32', 'utf8', '_G', '_VERSION'
    ]);

    class RandomGenerator {
        constructor() {
            this.seed = Date.now();
            this.counter = 0;
        }

        next() {
            this.counter++;
            const x = Math.sin(this.seed + this.counter) * 10000;
            return x - Math.floor(x);
        }

        integer(min, max) {
            return Math.floor(this.next() * (max - min + 1)) + min;
        }

        choice(array) {
            return array[this.integer(0, array.length - 1)];
        }

        string(length) {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars[this.integer(0, chars.length - 1)];
            }
            return result;
        }

        shuffle(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = this.integer(0, i);
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }
    }

    class NameGenerator {
        constructor(random) {
            this.random = random;
            this.usedNames = new Set();
            this.nameCache = new Map();
        }

        generate(prefix = '') {
            let attempts = 0;
            let name;
            do {
                const parts = [];
                parts.push(this.random.string(this.random.integer(1, 2)));
                parts.push(this.random.integer(0, 999).toString());
                parts.push(this.random.string(this.random.integer(2, 4)));
                name = '_' + prefix + parts.join('');
                attempts++;
                if (attempts > 100) {
                    name += '_' + Date.now() + '_' + this.random.integer(0, 9999);
                    break;
                }
            } while (this.usedNames.has(name) || LuaKeywords.has(name) || LuaBuiltins.has(name));
            
            this.usedNames.add(name);
            return name;
        }

        cache(original, obfuscated) {
            this.nameCache.set(original, obfuscated);
        }

        get(original) {
            return this.nameCache.get(original);
        }

        has(original) {
            return this.nameCache.has(original);
        }
    }

    class LexicalAnalyzer {
        constructor(code) {
            this.code = code;
            this.position = 0;
            this.tokens = [];
            this.line = 1;
            this.column = 1;
        }

        analyze() {
            while (this.position < this.code.length) {
                const char = this.code[this.position];
                
                if (this.isWhitespace(char)) {
                    this.consumeWhitespace();
                } else if (this.isLineBreak(char)) {
                    this.consumeLineBreak();
                } else if (this.isCommentStart()) {
                    this.consumeComment();
                } else if (this.isStringStart(char)) {
                    this.consumeString();
                } else if (this.isDigit(char)) {
                    this.consumeNumber();
                } else if (this.isIdentifierStart(char)) {
                    this.consumeIdentifier();
                } else if (this.isOperator(char)) {
                    this.consumeOperator();
                } else {
                    this.position++;
                    this.column++;
                }
            }
            return this.tokens;
        }

        isWhitespace(char) {
            return char === ' ' || char === '\t' || char === '\r';
        }

        isLineBreak(char) {
            return char === '
';
        }

        isCommentStart() {
            return this.code[this.position] === '-' && this.code[this.position + 1] === '-';
        }

        isStringStart(char) {
            return char === '"' || char === "'" || char === '[';
        }

        isDigit(char) {
            return char >= '0' && char <= '9';
        }

        isIdentifierStart(char) {
            return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
        }

        isIdentifierPart(char) {
            return this.isIdentifierStart(char) || this.isDigit(char);
        }

        isOperator(char) {
            return '+-*/%^#=~<>(){}[];:,.'.indexOf(char) !== -1;
        }

        consumeWhitespace() {
            while (this.position < this.code.length && this.isWhitespace(this.code[this.position])) {
                this.position++;
                this.column++;
            }
        }

        consumeLineBreak() {
            this.tokens.push({
                type: 'linebreak',
                value: '
',
                line: this.line,
                column: this.column
            });
            this.position++;
            this.line++;
            this.column = 1;
        }

        consumeComment() {
            const start = this.position;
            const startColumn = this.column;
            this.position += 2;
            this.column += 2;

            if (this.code[this.position] === '[' && this.code[this.position + 1] === '[') {
                this.position += 2;
                this.column += 2;
                while (this.position < this.code.length - 1) {
                    if (this.code[this.position] === ']' && this.code[this.position + 1] === ']') {
                        this.position += 2;
                        this.column += 2;
                        break;
                    }
                    if (this.code[this.position] === '
') {
                        this.line++;
                        this.column = 1;
                    } else {
                        this.column++;
                    }
                    this.position++;
                }
            } else {
                while (this.position < this.code.length && this.code[this.position] !== '
') {
                    this.position++;
                    this.column++;
                }
            }

            this.tokens.push({
                type: 'comment',
                value: this.code.substring(start, this.position),
                line: this.line,
                column: startColumn
            });
        }

        consumeString() {
            const start = this.position;
            const startColumn = this.column;
            const delimiter = this.code[this.position];
            
            if (delimiter === '[' && this.code[this.position + 1] === '[') {
                this.position += 2;
                this.column += 2;
                while (this.position < this.code.length - 1) {
                    if (this.code[this.position] === ']' && this.code[this.position + 1] === ']') {
                        this.position += 2;
                        this.column += 2;
                        break;
                    }
                    if (this.code[this.position] === '
') {
                        this.line++;
                        this.column = 1;
                    } else {
                        this.column++;
                    }
                    this.position++;
                }
            } else {
                this.position++;
                this.column++;
                while (this.position < this.code.length) {
                    const char = this.code[this.position];
                    if (char === delimiter && this.code[this.position - 1] !== '\\') {
                        this.position++;
                        this.column++;
                        break;
                    }
                    if (char === '
') {
                        this.line++;
                        this.column = 1;
                    } else {
                        this.column++;
                    }
                    this.position++;
                }
            }

            this.tokens.push({
                type: 'string',
                value: this.code.substring(start, this.position),
                line: this.line,
                column: startColumn
            });
        }

        consumeNumber() {
            const start = this.position;
            const startColumn = this.column;
            
            if (this.code[this.position] === '0' && 
                (this.code[this.position + 1] === 'x' || this.code[this.position + 1] === 'X')) {
                this.position += 2;
                this.column += 2;
                while (this.position < this.code.length && this.isHexDigit(this.code[this.position])) {
                    this.position++;
                    this.column++;
                }
            } else {
                while (this.position < this.code.length && this.isDigit(this.code[this.position])) {
                    this.position++;
                    this.column++;
                }
                if (this.position < this.code.length && this.code[this.position] === '.') {
                    this.position++;
                    this.column++;
                    while (this.position < this.code.length && this.isDigit(this.code[this.position])) {
                        this.position++;
                        this.column++;
                    }
                }
                if (this.position < this.code.length && 
                    (this.code[this.position] === 'e' || this.code[this.position] === 'E')) {
                    this.position++;
                    this.column++;
                    if (this.position < this.code.length && 
                        (this.code[this.position] === '+' || this.code[this.position] === '-')) {
                        this.position++;
                        this.column++;
                    }
                    while (this.position < this.code.length && this.isDigit(this.code[this.position])) {
                        this.position++;
                        this.column++;
                    }
                }
            }

            this.tokens.push({
                type: 'number',
                value: this.code.substring(start, this.position),
                line: this.line,
                column: startColumn
            });
        }

        isHexDigit(char) {
            return this.isDigit(char) || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F');
        }

        consumeIdentifier() {
            const start = this.position;
            const startColumn = this.column;
            
            while (this.position < this.code.length && this.isIdentifierPart(this.code[this.position])) {
                this.position++;
                this.column++;
            }

            const value = this.code.substring(start, this.position);
            const type = LuaKeywords.has(value) ? 'keyword' : 'identifier';

            this.tokens.push({
                type: type,
                value: value,
                line: this.line,
                column: startColumn
            });
        }

        consumeOperator() {
            const start = this.position;
            const startColumn = this.column;
            
            const twoChar = this.code.substring(this.position, this.position + 2);
            if (['==', '~=', '<=', '>=', '..', '//'].includes(twoChar)) {
                this.position += 2;
                this.column += 2;
            } else if (this.code.substring(this.position, this.position + 3) === '...') {
                this.position += 3;
                this.column += 3;
            } else {
                this.position++;
                this.column++;
            }

            this.tokens.push({
                type: 'operator',
                value: this.code.substring(start, this.position),
                line: this.line,
                column: startColumn
            });
        }
    }

    class StringEncoder {
        constructor(random) {
            this.random = random;
            this.encodingMethods = [
                this.encodeCharCodes.bind(this),
                this.encodeXOR.bind(this),
                this.encodeBase64Custom.bind(this),
                this.encodeRotate.bind(this),
                this.encodeSubstitution.bind(this)
            ];
        }

        encode(str) {
            const method = this.random.choice(this.encodingMethods);
            return method(str);
        }

        encodeCharCodes(str) {
            const codes = [];
            for (let i = 0; i < str.length; i++) {
                codes.push(str.charCodeAt(i));
            }
            return `string.char(${codes.join(',')})`;
        }

        encodeXOR(str) {
            const key = this.random.integer(1, 255);
            const encoded = [];
            for (let i = 0; i < str.length; i++) {
                encoded.push(str.charCodeAt(i) ^ key);
            }
            return `(function() local t={${encoded.join(',')}} local r='' for i=1,#t do r=r..string.char(t[i]~${key}) end return r end)()`;
        }

        encodeBase64Custom(str) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            let result = '';
            let i = 0;
            
            while (i < str.length) {
                const a = str.charCodeAt(i++);
                const b = i < str.length ? str.charCodeAt(i++) : 0;
                const c = i < str.length ? str.charCodeAt(i++) : 0;
                
                const bitmap = (a << 16) | (b << 8) | c;
                
                result += chars[(bitmap >> 18) & 63];
                result += chars[(bitmap >> 12) & 63];
                result += i > str.length + 1 ? '=' : chars[(bitmap >> 6) & 63];
                result += i > str.length ? '=' : chars[bitmap & 63];
            }
            
            return `(function() local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/' local s='${result}' local r='' for v in s:gmatch('....') do local a,b,c,d=v:byte(1,4) local n=(b:find(string.char(a))-1)*262144+(b:find(string.char(b))-1)*4096+(b:find(string.char(c))-1)*64+(b:find(string.char(d))-1) r=r..string.char(n/65536)..string.char(n/256%256)..string.char(n%256) end return r:sub(1,${str.length}) end)()`;
        }

        encodeRotate(str) {
            const shift = this.random.integer(1, 25);
            const encoded = [];
            for (let i = 0; i < str.length; i++) {
                encoded.push((str.charCodeAt(i) + shift) % 256);
            }
            return `(function() local t={${encoded.join(',')}} local r='' for i=1,#t do r=r..string.char((t[i]-${shift})%256) end return r end)()`;
        }

        encodeSubstitution(str) {
            const mapping = {};
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            for (let i = 0; i < chars.length; i++) {
                mapping[chars[i]] = this.random.integer(33, 126);
            }
            
            const encoded = [];
            for (let i = 0; i < str.length; i++) {
                const char = str[i];
                encoded.push(mapping[char] || str.charCodeAt(i));
            }
            
            return `string.char(${encoded.join(',')})`;
        }
    }

    class NumberObfuscator {
        constructor(random) {
            this.random = random;
        }

        obfuscate(num) {
            const methods = [
                () => this.addSubtract(num),
                () => this.multiplyDivide(num),
                () => this.bitwise(num),
                () => this.mathFunction(num),
                () => this.complex(num)
            ];
            return this.random.choice(methods)();
        }

        addSubtract(num) {
            const offset = this.random.integer(1, 100);
            return this.random.choice([
                `(${num + offset}-${offset})`,
                `(${num - offset}+${offset})`
            ]);
        }

        multiplyDivide(num) {
            const factor = this.random.integer(2, 10);
            return this.random.choice([
                `(${num * factor}/${factor})`,
                `(${num / factor}*${factor})`
            ]);
        }

        bitwise(num) {
            if (num < 0 || num > 1000000) return num.toString();
            const mask = this.random.integer(1, 255);
            return `(${num} ~ ${mask} ~ ${mask})`;
        }

        mathFunction(num) {
            return this.random.choice([
                `math.floor(${num}.${this.random.integer(0, 9)})`,
                `math.ceil(${num - 1}.${this.random.integer(1, 9)})`,
                `(${num}+0)`,
                `tonumber("${num}")`
            ]);
        }

        complex(num) {
            const a = this.random.integer(1, 10);
            const b = this.random.integer(1, 10);
            const result = num + a - b;
            return `(${result}+${b}-${a})`;
        }
    }

    class ControlFlowObfuscator {
        constructor(random, nameGen) {
            this.random = random;
            this.nameGen = nameGen;
        }

        flatten(code) {
            const lines = code.split('
');
            const flattened = [];
            const stateVar = this.nameGen.generate('state');
            const loopVar = this.nameGen.generate('loop');
            
            flattened.push(`local ${stateVar}=1`);
            flattened.push(`local ${loopVar}=true`);
            flattened.push(`while ${loopVar} do`);
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line && !line.startsWith('--')) {
                    flattened.push(`if ${stateVar}==${i + 1} then`);
                    flattened.push(`  ${line}`);
                    flattened.push(`  ${stateVar}=${i + 2}`);
                    flattened.push(`end`);
                }
            }
            
            flattened.push(`if ${stateVar}>${lines.length} then ${loopVar}=false end`);
            flattened.push(`end`);
            
            return flattened.join('
');
        }

        addOpaquePredicates(code) {
            const lines = code.split('
');
            const result = [];
            const predicateVar = this.nameGen.generate('pred');
            
            result.push(`local ${predicateVar}=(function() return ${this.random.integer(1, 100)} end)()`);
            
            for (const line of lines) {
                if (line.trim() && !line.trim().startsWith('--') && this.random.next() > 0.7) {
                    result.push(`if ${predicateVar}>0 then`);
                    result.push(`  ${line}`);
                    result.push(`end`);
                } else {
                    result.push(line);
                }
            }
            
            return result.join('
');
        }

        insertDeadCode(code) {
            const lines = code.split('
');
            const result = [];
            
            for (const line of lines) {
                result.push(line);
                if (this.random.next() > 0.8 && line.trim() && !line.trim().startsWith('--')) {
                    const deadVar = this.nameGen.generate('dead');
                    result.push(`local ${deadVar}=${this.random.integer(1, 1000)}`);
                    result.push(`if ${deadVar}<0 then return end`);
                }
            }
            
            return result.join('
');
        }
    }

    class AntiTamperProtection {
        constructor(random, nameGen) {
            this.random = random;
            this.nameGen = nameGen;
        }

        generateProtection() {
            const checks = [];
            
            checks.push(this.watermarkCheck());
            checks.push(this.integrityCheck());
            checks.push(this.environmentCheck());
            checks.push(this.debuggerCheck());
            
            return checks.join('
');
        }

        watermarkCheck() {
            const checkVar = this.nameGen.generate('wm');
            return [
                `local ${checkVar}=[[${WATERMARK}]]`,
                `local function ${this.nameGen.generate('verify')}()`,
                `  local ${this.nameGen.generate('src')}=debug.getinfo(1,'S').source or ""`,
                `  if not ${this.nameGen.generate('src')}:find(${checkVar}:sub(6,-4)) then`,
                `    error('\\nScript integrity verification failed\\nWatermark must not be modified or removed',0)`,
                `  end`,
                `end`,
                `${this.nameGen.generate('verify')}()`
            ].join('
');
        }

        integrityCheck() {
            const hashVar = this.nameGen.generate('hash');
            const checkFunc = this.nameGen.generate('check');
            return [
                `local ${hashVar}=${this.random.integer(1000, 9999)}`,
                `local function ${checkFunc}()`,
                `  local ${this.nameGen.generate('sum')}=0`,
                `  for ${this.nameGen.generate('i')}=1,#_VERSION do`,
                `    ${this.nameGen.generate('sum')}=${this.nameGen.generate('sum')}+_VERSION:byte(${this.nameGen.generate('i')})`,
                `  end`,
                `  return ${this.nameGen.generate('sum')}>${hashVar}`,
                `end`,
                `if not ${checkFunc}() then error('Integrity check failed',0) end`
            ].join('
');
        }

        environmentCheck() {
            const envVar = this.nameGen.generate('env');
            return [
                `local ${envVar}=getfenv or function() return _ENV end`,
                `if not ${envVar}() then error('Environment error',0) end`
            ].join('
');
        }

        debuggerCheck() {
            const debugVar = this.nameGen.generate('dbg');
            return [
                `local ${debugVar}=debug or {}`,
                `local function ${this.nameGen.generate('checkdbg')}()`,
                `  if ${debugVar}.getinfo and ${debugVar}.gethook then`,
                `    if ${debugVar}.gethook() then`,
                `      return false`,
                `    end`,
                `  end`,
                `  return true`,
                `end`,
                `if not ${this.nameGen.generate('checkdbg')}() then error('Debug mode detected',0) end`
            ].join('
');
        }
    }

    class VariableRenamer {
        constructor(nameGen) {
            this.nameGen = nameGen;
            this.varMap = new Map();
        }

        extractVariables(tokens) {
            const variables = new Set();
            
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                
                if (token.type === 'keyword' && token.value === 'local') {
                    let j = i + 1;
                    while (j < tokens.length && tokens[j].type === 'identifier') {
                        if (!LuaBuiltins.has(tokens[j].value)) {
                            variables.add(tokens[j].value);
                        }
                        j++;
                        if (tokens[j] && tokens[j].value === ',') {
                            j++;
                        } else {
                            break;
                        }
                    }
                }
                
                if (token.type === 'keyword' && token.value === 'function') {
                    if (tokens[i + 1] && tokens[i + 1].type === 'identifier') {
                        if (!LuaBuiltins.has(tokens[i + 1].value)) {
                            variables.add(tokens[i + 1].value);
                        }
                    }
                }
            }
            
            return Array.from(variables);
        }

        rename(tokens, variables) {
            for (const varName of variables) {
                if (!this.varMap.has(varName)) {
                    this.varMap.set(varName, this.nameGen.generate('var'));
                }
            }
            
            const renamed = tokens.map(token => {
                if (token.type === 'identifier' && this.varMap.has(token.value)) {
                    return { ...token, value: this.varMap.get(token.value) };
                }
                return token;
            });
            
            return renamed;
        }
    }

    class CodeMinifier {
        minify(code) {
            const lines = code.split('
');
            const minified = [];
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('--')) {
                    minified.push(trimmed);
                }
            }
            
            return minified.join(' ');
        }

        removeComments(tokens) {
            return tokens.filter(token => token.type !== 'comment');
        }

        compressWhitespace(code) {
            return code.replace(/\s+/g, ' ').trim();
        }
    }

    class OutputGenerator {
        constructor() {
            this.indentLevel = 0;
            this.indentString = '  ';
        }

        generate(tokens) {
            let output = '';
            let lastToken = null;
            
            for (const token of tokens) {
                if (token.type === 'linebreak') {
                    output += '
';
                    continue;
                }
                
                if (lastToken && this.needsSpace(lastToken, token)) {
                    output += ' ';
                }
                
                output += token.value;
                lastToken = token;
            }
            
            return output;
        }

        needsSpace(token1, token2) {
            if (token1.type === 'keyword' || token2.type === 'keyword') {
                return true;
            }
            if (token1.type === 'identifier' && token2.type === 'identifier') {
                return true;
            }
            if (token1.type === 'identifier' && token2.type === 'number') {
                return true;
            }
            if (token1.type === 'number' && token2.type === 'identifier') {
                return true;
            }
            if (token1.value === 'return' || token1.value === 'local') {
                return true;
            }
            return false;
        }
    }

    class BytecodeWrapper {
        constructor(random, nameGen) {
            this.random = random;
            this.nameGen = nameGen;
        }

        wrap(code) {
            const encoded = this.encodeToBase64(code);
            const chunks = this.splitIntoChunks(encoded, 80);
            const loaderVar = this.nameGen.generate('loader');
            const dataVar = this.nameGen.generate('data');
            const execVar = this.nameGen.generate('exec');
            
            let wrapper = `local ${dataVar}=${this.generateStringConcat(chunks)}
`;
            wrapper += `local function ${loaderVar}(${this.nameGen.generate('s')})
`;
            wrapper += `  local ${this.nameGen.generate('b')}='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
`;
            wrapper += `  local ${this.nameGen.generate('r')}=''
`;
            wrapper += `  ${this.nameGen.generate('s')}=${this.nameGen.generate('s')}:gsub('[^'..${this.nameGen.generate('b')}..'=]','')
`;
            wrapper += `  for ${this.nameGen.generate('v')} in ${this.nameGen.generate('s')}:gmatch('....') do
`;
            wrapper += `    local ${this.nameGen.generate('a')},${this.nameGen.generate('b')},${this.nameGen.generate('c')},${this.nameGen.generate('d')}=${this.nameGen.generate('v')}:byte(1,4)
`;
            wrapper += `    local ${this.nameGen.generate('n')}=${this.nameGen.generate('b')}:find(string.char(${this.nameGen.generate('a')}))-1
`;
            wrapper += `    ${this.nameGen.generate('n')}=${this.nameGen.generate('n')}*4096+(${this.nameGen.generate('b')}:find(string.char(${this.nameGen.generate('b')}))-1)*64
`;
            wrapper += `    ${this.nameGen.generate('n')}=${this.nameGen.generate('n')}+(${this.nameGen.generate('b')}:find(string.char(${this.nameGen.generate('c')}))-1)+${this.nameGen.generate('b')}:find(string.char(${this.nameGen.generate('d')}))-1
`;
            wrapper += `    ${this.nameGen.generate('r')}=${this.nameGen.generate('r')}..string.char(math.floor(${this.nameGen.generate('n')}/65536))
`;
            wrapper += `    ${this.nameGen.generate('r')}=${this.nameGen.generate('r')}..string.char(math.floor(${this.nameGen.generate('n')}/256)%256)
`;
            wrapper += `    ${this.nameGen.generate('r')}=${this.nameGen.generate('r')}..string.char(${this.nameGen.generate('n')}%256)
`;
            wrapper += `  end
`;
            wrapper += `  return ${this.nameGen.generate('r')}
`;
            wrapper += `end
`;
            wrapper += `local ${execVar}=load or loadstring
`;
            wrapper += `${execVar}(${loaderVar}(${dataVar}))()
`;
            
            return wrapper;
        }

        encodeToBase64(str) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            let result = '';
            let i = 0;
            
            while (i < str.length) {
                const a = str.charCodeAt(i++);
                const b = i < str.length ? str.charCodeAt(i++) : 0;
                const c = i < str.length ? str.charCodeAt(i++) : 0;
                
                const bitmap = (a << 16) | (b << 8) | c;
                
                result += chars[(bitmap >> 18) & 63];
                result += chars[(bitmap >> 12) & 63];
                result += i - 1 < str.length ? chars[(bitmap >> 6) & 63] : '=';
                result += i - 2 < str.length ? chars[bitmap & 63] : '=';
            }
            
            return result;
        }

        splitIntoChunks(str, chunkSize) {
            const chunks = [];
            for (let i = 0; i < str.length; i += chunkSize) {
                chunks.push(str.substring(i, i + chunkSize));
            }
            return chunks;
        }

        generateStringConcat(chunks) {
            return chunks.map(chunk => `"${chunk}"`).join('..
');
        }
    }

    class ProxyFunctionGenerator {
        constructor(random, nameGen) {
            this.random = random;
            this.nameGen = nameGen;
        }

        generate(funcName) {
            const proxyName = this.nameGen.generate('proxy');
            const argsVar = this.nameGen.generate('args');
            
            return [
                `local ${proxyName}=function(...)`,
                `  local ${argsVar}={...}`,
                `  return ${funcName}(unpack(${argsVar}))`,
                `end`
            ].join('
');
        }

        wrapAllFunctions(code) {
            const funcPattern = /function\s+(\w+)\s*\(/g;
            const functions = [];
            let match;
            
            while ((match = funcPattern.exec(code)) !== null) {
                if (!LuaBuiltins.has(match[1])) {
                    functions.push(match[1]);
                }
            }
            
            const proxies = functions.map(func => this.generate(func));
            return proxies.join('
') + '
' + code;
        }
    }

    class TableObfuscator {
        constructor(random, nameGen) {
            this.random = random;
            this.nameGen = nameGen;
        }

        obfuscate(code) {
            const tablePattern = /\{([^}]+)\}/g;
            return code.replace(tablePattern, (match) => {
                return this.obfuscateTable(match);
            });
        }

        obfuscateTable(tableStr) {
            const tempVar = this.nameGen.generate('tbl');
            const lines = [];
            
            lines.push(`(function()`);
            lines.push(`  local ${tempVar}={}`);
            
            const content = tableStr.slice(1, -1);
            const elements = content.split(',').map(e => e.trim());
            
            for (let i = 0; i < elements.length; i++) {
                if (elements[i]) {
                    lines.push(`  ${tempVar}[${i + 1}]=${elements[i]}`);
                }
            }
            
            lines.push(`  return ${tempVar}`);
            lines.push(`end)()`);
            
            return lines.join('
');
        }
    }

    class ConstantPooler {
        constructor(random, nameGen) {
            this.random = random;
            this.nameGen = nameGen;
            this.pool = new Map();
            this.poolVar = this.nameGen.generate('pool');
        }

        collect(tokens) {
            for (const token of tokens) {
                if (token.type === 'string' || token.type === 'number') {
                    if (!this.pool.has(token.value)) {
                        this.pool.set(token.value, this.pool.size);
                    }
                }
            }
        }

        generatePool() {
            if (this.pool.size === 0) return '';
            
            const values = Array.from(this.pool.keys());
            const poolInit = `local ${this.poolVar}={${values.join(',')}}`;
            return poolInit;
        }

        replace(tokens) {
            return tokens.map(token => {
                if ((token.type === 'string' || token.type === 'number') && this.pool.has(token.value)) {
                    const index = this.pool.get(token.value);
                    return { ...token, value: `${this.poolVar}[${index + 1}]` };
                }
                return token;
            });
        }
    }

    class MacroExpander {
        constructor(random, nameGen) {
            this.random = random;
            this.nameGen = nameGen;
            this.macros = new Map();
        }

        define(name, expansion) {
            this.macros.set(name, expansion);
        }

        expand(code) {
            let expanded = code;
            for (const [name, expansion] of this.macros) {
                const regex = new RegExp('\\b' + name + '\\b', 'g');
                expanded = expanded.replace(regex, expansion);
            }
            return expanded;
        }

        createMacros() {
            this.define('TRUE', '(1==1)');
            this.define('FALSE', '(1==0)');
            this.define('NIL', 'nil');
        }
    }

    class EncryptionLayer {
        constructor(random, nameGen) {
            this.random = random;
            this.nameGen = nameGen;
        }

        encrypt(code) {
            const key = this.random.integer(1, 255);
            const encrypted = [];
            
            for (let i = 0; i < code.length; i++) {
                encrypted.push(code.charCodeAt(i) ^ key);
            }
            
            const dataVar = this.nameGen.generate('enc');
            const keyVar = this.nameGen.generate('key');
            const decryptFunc = this.nameGen.generate('decrypt');
            
            let wrapper = `local ${dataVar}={${encrypted.join(',')}}
`;
            wrapper += `local ${keyVar}=${key}
`;
            wrapper += `local function ${decryptFunc}()
`;
            wrapper += `  local ${this.nameGen.generate('result')}=''
`;
            wrapper += `  for ${this.nameGen.generate('i')}=1,#${dataVar} do
`;
            wrapper += `    ${this.nameGen.generate('result')}=${this.nameGen.generate('result')}..string.char(${dataVar}[${this.nameGen.generate('i')}]~${keyVar})
`;
            wrapper += `  end
`;
            wrapper += `  return ${this.nameGen.generate('result')}
`;
            wrapper += `end
`;
            wrapper += `local ${this.nameGen.generate('exec')}=load or loadstring
`;
            wrapper += `${this.nameGen.generate('exec')}(${decryptFunc}())()
`;
            
            return wrapper;
        }
    }

    class VirtualMachine {
        constructor(random, nameGen) {
            this.random = random;
            this.nameGen = nameGen;
        }

        compile(code) {
            const instructions = this.codeToInstructions(code);
            return this.generateVM(instructions);
        }

        codeToInstructions(code) {
            const lines = code.split('
').filter(l => l.trim());
            return lines.map((line, index) => ({
                op: 'EXEC',
                data: line,
                index: index
            }));
        }

        generateVM(instructions) {
            const vmVar = this.nameGen.generate('vm');
            const pcVar = this.nameGen.generate('pc');
            const instVar = this.nameGen.generate('inst');
            
            let vm = `local ${vmVar}={
`;
            vm += `  ${pcVar}=1,
`;
            vm += `  ${instVar}={`;
            
            for (const inst of instructions) {
                vm += `{op='${inst.op}',data=[[${inst.data}]]},`;
            }
            
            vm += `}
}
`;
            vm += `while ${vmVar}.${pcVar}<=#${vmVar}.${instVar} do
`;
            vm += `  local ${this.nameGen.generate('current')}=${vmVar}.${instVar}[${vmVar}.${pcVar}]
`;
            vm += `  if ${this.nameGen.generate('current')}.op=='EXEC' then
`;
            vm += `    load(${this.nameGen.generate('current')}.data)()
`;
            vm += `  end
`;
            vm += `  ${vmVar}.${pcVar}=${vmVar}.${pcVar}+1
`;
            vm += `end
`;
            
            return vm;
        }
    }

    return {
        process: function(code) {
            try {
                const random = new RandomGenerator();
                const nameGen = new NameGenerator(random);
                const stringEncoder = new StringEncoder(random);
                const numberObf = new NumberObfuscator(random);
                const controlFlow = new ControlFlowObfuscator(random, nameGen);
                const antiTamper = new AntiTamperProtection(random, nameGen);
                const lexer = new LexicalAnalyzer(code);
                const varRenamer = new VariableRenamer(nameGen);
                const minifier = new CodeMinifier();
                const outputGen = new OutputGenerator();
                const bytecodeWrapper = new BytecodeWrapper(random, nameGen);
                const proxyGen = new ProxyFunctionGenerator(random, nameGen);
                const tableObf = new TableObfuscator(random, nameGen);
                const pooler = new ConstantPooler(random, nameGen);
                const macroExp = new MacroExpander(random, nameGen);
                const encryption = new EncryptionLayer(random, nameGen);
                const vm = new VirtualMachine(random, nameGen);

                let tokens = lexer.analyze();
                tokens = minifier.removeComments(tokens);
                
                const variables = varRenamer.extractVariables(tokens);
                tokens = varRenamer.rename(tokens, variables);
                
                pooler.collect(tokens);
                tokens = pooler.replace(tokens);
                
                let processed = outputGen.generate(tokens);
                
                processed = tableObf.obfuscate(processed);
                processed = controlFlow.addOpaquePredicates(processed);
                processed = controlFlow.insertDeadCode(processed);
                
                const protection = antiTamper.generateProtection();
                const pool = pooler.generatePool();
                
                let final = WATERMARK + '
';
                final += protection + '
';
                if (pool) final += pool + '
';
                final += processed;
                
                final = bytecodeWrapper.wrap(final);
                
                return final;
            } catch (error) {
                throw new Error('Obfuscation failed: ' + error.message);
            }
        }
    };
})();

function processObfuscation() {
    const input = document.getElementById('inputCode').value;
    const output = document.getElementById('outputCode');
    
    if (!input.trim()) {
        alert('Please enter Lua code to obfuscate');
        return;
    }
    
    try {
        const obfuscated = ObfuscatorEngine.process(input);
        output.value = obfuscated;
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function clearInput() {
    document.getElementById('inputCode').value = '';
}

function copyToClipboard() {
    const output = document.getElementById('outputCode');
    if (!output.value) {
        alert('No output to copy');
        return;
    }
    output.select();
    document.execCommand('copy');
    alert('Copied to clipboard!');
}

function downloadCode() {
    const output = document.getElementById('outputCode').value;
    if (!output) {
        alert('No output to download');
        return;
    }
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'obfuscated_' + Date.now() + '.lua';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function resetAll() {
    document.getElementById('inputCode').value = '';
    document.getElementById('outputCode').value = '';
}

document.addEventListener('DOMContentLoaded', function() {
    const inputCode = document.getElementById('inputCode');
    const outputCode = document.getElementById('outputCode');
    
    inputCode.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
        }
    });
});
