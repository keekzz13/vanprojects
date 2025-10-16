class LuaObfuscator {
  constructor() {
    this.stringPool = new Map();
    this.functionPool = new Map();
    this.variableCounter = 0;
    this.buildId = this.generateBuildId();
    this.encodingLayers = this.randomizeEncodingLayers();
    this.keyTable = this.generateKeyTable();
  }

  generateBuildId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  randomizeEncodingLayers() {
    const layers = [];
    const layerCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < layerCount; i++) {
      layers.push(Math.floor(Math.random() * 4));
    }
    return layers;
  }

  generateKeyTable() {
    const keys = {};
    for (let i = 0; i < 256; i++) {
      keys[i] = Math.floor(Math.random() * 255);
    }
    return keys;
  }

  generateRandomName(prefix = '') {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = prefix;
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  xorEncode(str, key) {
    let result = [];
    for (let i = 0; i < str.length; i++) {
      result.push(str.charCodeAt(i) ^ key);
    }
    return result;
  }

  base64Encode(bytes) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b1 = bytes[i];
      const b2 = bytes[i + 1] || 0;
      const b3 = bytes[i + 2] || 0;
      const bitmap = (b1 << 16) | (b2 << 8) | b3;
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += (i + 1) < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += (i + 2) < bytes.length ? chars.charAt(bitmap & 63) : '=';
    }
    return result;
  }

  rot13(str) {
    return str.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
  }

  caesarCipher(str, shift) {
    return str.split('').map(c => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      return c;
    }).join('');
  }

  encodeString(str) {
    let encoded = str;
    const selectedLayers = this.encodingLayers;

    for (let layer of selectedLayers) {
      switch(layer) {
        case 0:
          const xorKey = Math.floor(Math.random() * 255) + 1;
          const xorResult = this.xorEncode(encoded, xorKey);
          encoded = {type: 'xor', key: xorKey, data: this.base64Encode(xorResult)};
          break;
        case 1:
          encoded = {type: 'rot13', data: this.rot13(encoded)};
          break;
        case 2:
          const caesarShift = Math.floor(Math.random() * 25) + 1;
          encoded = {type: 'caesar', shift: caesarShift, data: this.caesarCipher(encoded, caesarShift)};
          break;
        case 3:
          encoded = {type: 'base64', data: this.base64Encode(encoded.split('').map(c => c.charCodeAt(0)))};
          break;
      }
    }

    return encoded;
  }

  tokenize(code) {
    const tokens = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let inLongComment = false;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const nextChar = code[i + 1];

      if (inLongComment) {
        if (char === ']' && nextChar === ']') {
          inLongComment = false;
          i++;
        }
        continue;
      }

      if (code.substring(i, i + 2) === '--' && !inString) {
        if (code.substring(i + 2, i + 3) === '[') {
          inLongComment = true;
          i += 3;
        } else {
          while (i < code.length && code[i] !== '
') i++;
        }
        continue;
      }

      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === stringChar && inString) {
        inString = false;
        current += char;
        tokens.push({type: 'string', value: current});
        current = '';
      } else if (inString) {
        current += char;
      } else if (/[\s
\r\t]/.test(char)) {
        if (current) {
          tokens.push({type: 'identifier', value: current});
          current = '';
        }
      } else if (/[{}()\[\],;:=+\-*/%.<>!&|^~?]/.test(char)) {
        if (current) {
          tokens.push({type: 'identifier', value: current});
          current = '';
        }
        tokens.push({type: 'operator', value: char});
      } else {
        current += char;
      }
    }

    if (current) {
      tokens.push({type: 'identifier', value: current});
    }

    return tokens;
  }

  obfuscate(code) {
    const lines = code.split('
');
    const header = `--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--
`;
    
    const runtime = this.generateRuntime();
    let obfuscated = '';
    const nameMap = new Map();
    const keywords = new Set(['local', 'function', 'end', 'if', 'then', 'else', 'elseif', 'for', 'do', 'while', 'repeat', 'until', 'return', 'break', 'true', 'false', 'nil', 'and', 'or', 'not', 'in']);

    for (let line of lines) {
      let processedLine = line;

      const stringMatches = processedLine.match(/("([^"]*)"|'([^']*)')/g) || [];
      for (let stringMatch of stringMatches) {
        const stringContent = stringMatch.slice(1, -1);
        const encoded = this.encodeString(stringContent);
        const decoderCall = this.generateDecoderCall(encoded);
        processedLine = processedLine.replace(stringMatch, decoderCall);
      }

      const identifierMatches = processedLine.match(/([a-zA-Z_][a-zA-Z0-9_]*)/g) || [];
      for (let identifier of identifierMatches) {
        if (!keywords.has(identifier) && !processedLine.match(new RegExp(`"${identifier}"['"]?|'${identifier}'`))) {
          if (!nameMap.has(identifier)) {
            nameMap.set(identifier, this.generateRandomName());
          }
          processedLine = processedLine.replace(new RegExp(`\\b${identifier}\\b`, 'g'), nameMap.get(identifier));
        }
      }

      obfuscated += processedLine + '
';
    }

    return header + runtime + '
' + obfuscated;
  }

  generateRuntime() {
    const decoderName = this.generateRandomName();
    const layerDecoders = [];

    for (let layer of this.encodingLayers) {
      switch(layer) {
        case 0:
          layerDecoders.push(this.generateXorDecoder());
          break;
        case 1:
          layerDecoders.push(this.generateRot13Decoder());
          break;
        case 2:
          layerDecoders.push(this.generateCaesarDecoder());
          break;
        case 3:
          layerDecoders.push(this.generateBase64Decoder());
          break;
      }
    }

    return `
local ${decoderName} = {}
${layerDecoders.join('
')}

setmetatable(_G, {
  __newindex = function(t, k, v)
    rawset(t, k, v)
  end,
  __index = function(t, k)
    return rawget(t, k)
  end
})
    `.trim();
  }

  generateDecoderCall(encoded) {
    if (typeof encoded === 'string') {
      return `"${encoded}"`;
    }

    const decoderVar = this.generateRandomName();
    let decoderCall = `${decoderVar}`;

    if (Array.isArray(this.encodingLayers)) {
      const layers = [...this.encodingLayers].reverse();
      for (let layer of layers) {
        switch(layer) {
          case 0:
            decoderCall = `(function(x,k) local r="" for i=1,#x do r=r..string.char(string.byte(string.sub(x,i,i))~k) end return r end)("${encoded.data}",${encoded.key})`;
            break;
          case 1:
            decoderCall = `(function(x) local r="" for i=1,#x do local c=string.sub(x,i,i) local o=string.byte(c) if o>=65 and o<=90 then r=r..string.char(((o-65+13)%26)+65) elseif o>=97 and o<=122 then r=r..string.char(((o-97+13)%26)+97) else r=r..c end end return r end)("${encoded.data}")`;
            break;
          case 2:
            decoderCall = `(function(x,s) local r="" for i=1,#x do local c=string.sub(x,i,i) local o=string.byte(c) if o>=65 and o<=90 then r=r..string.char(((o-65-s)%26)+65) elseif o>=97 and o<=122 then r=r..string.char(((o-97-s)%26)+97) else r=r..c end end return r end)("${encoded.data}",${encoded.shift})`;
            break;
          case 3:
            decoderCall = `(function(x) local b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" local r="" for i=1,#x,4 do local e1,e2,e3,e4=string.byte(string.sub(x,i,i+3)) local b1,b2,b3=(e1-65)*64+(e2-65) r=r..string.char((b1>>2) & 255)..string.char((((b1 & 3) << 6) | (b2 >> 2)) & 255) end return r end)("${encoded.data}")`;
            break;
        }
      }
    }

    return decoderCall;
  }

  generateXorDecoder() {
    return `local ${this.generateRandomName()} = function(data, key) local result = "" for i = 1, #data do result = result .. string.char(string.byte(string.sub(data, i, i)) ~ key) end return result end`;
  }

  generateRot13Decoder() {
    return `local ${this.generateRandomName()} = function(text) local result = "" for i = 1, #text do local c = string.sub(text, i, i) local o = string.byte(c) if o >= 65 and o <= 90 then result = result .. string.char(((o - 65 + 13) % 26) + 65) elseif o >= 97 and o <= 122 then result = result .. string.char(((o - 97 + 13) % 26) + 97) else result = result .. c end end return result end`;
  }

  generateCaesarDecoder() {
    return `local ${this.generateRandomName()} = function(text, shift) local result = "" for i = 1, #text do local c = string.sub(text, i, i) local o = string.byte(c) if o >= 65 and o <= 90 then result = result .. string.char(((o - 65 - shift) % 26) + 65) elseif o >= 97 and o <= 122 then result = result .. string.char(((o - 97 - shift) % 26) + 97) else result = result .. c end end return result end`;
  }

  generateBase64Decoder() {
    return `local ${this.generateRandomName()} = function(data) local b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" local result = "" for i = 1, #data, 4 do local e1, e2 = string.find(b, string.sub(data, i, i)), string.find(b, string.sub(data, i + 1, i + 1)) if e1 and e2 then result = result .. string.char(((e1 - 1) * 4 + math.floor((e2 - 1) / 16))) end end return result end`;
  }
}

function obfuscateLua(code) {
  const obfuscator = new LuaObfuscator();
  return obfuscator.obfuscate(code);
}
