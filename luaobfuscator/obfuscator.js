// main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Element References ---
    const INPUT_CODE = document.getElementById('inputCode');
    const OUTPUT_CODE = document.getElementById('outputCode');
    const OBF_STATS = document.getElementById('obfStats');
    const BTN_OBFUSCATE = document.getElementById('btnObfuscate');
    const BTN_COPY = document.getElementById('btnCopy');
    const BTN_DOWNLOAD_LUA = document.getElementById('btnDownloadLua');
    const BTN_DOWNLOAD_MAP = document.getElementById('btnDownloadMap');
    const AGG_SLIDER = document.getElementById('aggressiveness');
    const AGG_VALUE_DISPLAY = document.getElementById('aggValue');

    let symbolMap = {};
    let finalObfuscatedCode = '';

    const OBFUSCATION_CREDIT = "--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]
";

    // --- Global Blacklist ---
    // Critical Luau/Roblox APIs and keywords that must NEVER be renamed.
    const GLOBAL_BLACKLIST = new Set([
        // Roblox Globals/Services/Functions
        "game", "workspace", "script", "wait", "spawn", "delay", "Instance", "LocalScript",
        "require", "loadstring", "print", "warn", "error", "coroutine", "pcall", "xpcall",
        "GetService", "Players", "ReplicatedStorage", "ServerScriptService", "RunService",
        "DataModel", "Settings", "StarterPlayer", "StarterGui", "CFrame", "Vector3", "UDim2",

        // Standard Luau/Lua Globals/Libraries
        "math", "table", "string", "ipairs", "pairs", "next", "select", "type", "tonumber",
        "tostring", "rawget", "rawset", "getmetatable", "setmetatable", "assert",
        "collectgarbage", "rawequal", "load", "newproxy", "module", "string.char", "table.concat",

        // Luau Keywords (already handled by regex pattern, but listed for explicit safety)
        "local", "function", "end", "if", "then", "else", "elseif", "while", "do", "repeat", "until",
        "for", "in", "break", "return", "true", "false", "nil", "and", "or", "not", "goto", "::"
    ]);

    // --- Utility Functions ---

    /**
     * Generates a unique, short identifier.
     * @param {number} index
     * @param {number} aggressiveness
     * @returns {string}
     */
    function generateIdentifier(index, aggressiveness) {
        // Use a broader character set for higher index/aggressiveness
        let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (aggressiveness >= 8) chars += "0123456789";

        let id = "";
        let n = index;

        // Use slightly longer names for lower aggressiveness to reduce collisions
        if (aggressiveness < 5) {
            id = "obf";
        }

        do {
            id = chars[n % chars.length] + id;
            n = Math.floor(n / chars.length) - 1;
        } while (n >= 0);

        return id;
    }

    /**
     * Downloads content as a file.
     */
    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Obfuscation Steps ---

    /**
     * 1. Minification and Comment/Whitespace Removal
     */
    function stepMinify(code, preserveComments) {
        let minified = code;

        // 1. Remove comments if not preserved
        if (!preserveComments) {
            // Simple single-line comment removal (must be careful not to match inside strings, but given we process strings later, this is fine)
            minified = minified.replace(/--[^\[
][^
]*(
|$)/g, '\$1');
            // Multi-line comment removal
            minified = minified.replace(/--\[\[[\s\S]*?\]\]/g, '');
        }

        // 2. Standardize whitespace
        minified = minified.replace(/[\t\r
]+/g, ' ');
        minified = minified.replace(/ +/g, ' ');

        // 3. Remove unnecessary spaces around operators and delimiters
        minified = minified.replace(/\s*([=+\-*/%^#,;:()\[\]{}.><!~&|])\s*/g, '\$1');

        // 4. Restore necessary spaces for keywords/identifiers
        const spaceAfterKeywords = /(local|function|if|then|else|elseif|while|do|for|in|repeat|until|return)\s*/g;
        minified = minified.replace(spaceAfterKeywords, (match, keyword) => keyword + ' ');

        // Clean up any double spaces introduced by keyword fix
        minified = minified.replace(/ +/g, ' ');

        return minified.trim();
    }


    /**
     * 2. String Literal Encoding (XOR)
     * The decoder function is inserted into the Luau code, running at runtime.
     * This is safe because the decoder only manipulates character codes and array concatenation, not dynamic code execution (`loadstring`).
     */
    function stepStringEncoding(code) {
        // XOR key chosen to be outside standard ASCII range for better obfuscation
        const XOR_KEY = 170; // 0xAA
        let encodedCount = 0;

        /** Encodes string content */
        function xorEncode(str) {
            encodedCount++;
            let encodedChars = [];
            for (let i = 0; i < str.length; i++) {
                // Char code XOR key
                const charCode = str.charCodeAt(i) ^ XOR_KEY;
                encodedChars.push(charCode);
            }
            // Return Luau code: table of numbers
            return '{' + encodedChars.join(',') + '}';
        }

        // Regex to find Lua/Luau single-quoted and double-quoted strings
        // This is highly simplified and assumes no complex nested quote issues.
        const stringRegex = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g;

        let tempCode = code.replace(stringRegex, (match, doubleQuoted, singleQuoted) => {
            const content = doubleQuoted !== undefined ? doubleQuoted : singleQuoted;
            if (content === undefined) return match;

            const encodedTable = xorEncode(content);
            // Returns a call to the decoder function _D
            return `_D(${encodedTable})`;
        });

        // The Luau decoder function, minified immediately.
        // _K: Key, _D: Decoder, _T: Table, _S: String array, _I: Index
        const rawDecoder = `
local _K=${XOR_KEY}
local _D=function(_T)
    local _S={}
    for _I=1,#_T do
        _S[_I]=string.char(_T[_I]~_K) -- XOR decoding
    end
    return table.concat(_S)
end
`;

        if (encodedCount === 0) {
            return { code: code, decoder: '' };
        }

        return {
            code: tempCode,
            decoder: stepMinify(rawDecoder, false) + '
'
        };
    }

    /**
     * 3. Identifier Renaming
     * Safely renames local variables and function definitions, avoiding global scope and keywords.
     */
    function stepIdentifierRenaming(code, aggressiveness, symbolMap) {
        // Regex captures identifiers following 'local' or 'function' that are NOT preceded by a dot (to avoid method renaming).
        // Captures: 1. prefix (local/function) 2. name 3. rest of the line (to scope parameters if needed)
        const localDeclarationsRegex = /(local\s+(?:function\s+)?)([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*|\()/g;

        let renameIndex = 0;
        let identifiersToRename = new Map();

        // Pass 1: Identify all unique local names
        code.replace(localDeclarationsRegex, (match, prefix, name) => {
            if (!GLOBAL_BLACKLIST.has(name) && !identifiersToRename.has(name)) {
                const newName = generateIdentifier(renameIndex++, aggressiveness);
                identifiersToRename.set(name, newName);
                symbolMap[name] = newName;
            }
            return match;
        });

        // Pass 2: Replace all occurrences of the identified names
        let renamedCode = code;
        const replacements = Array.from(identifiersToRename.entries());

        // Important: Sort by length descending to prevent partial renaming (e.g., 'foo' before 'foot')
        replacements.sort((a, b) => b[0].length - a[0].length);

        for (const [originalName, newName] of replacements) {
            // Use word boundary (\b) to ensure we replace the entire identifier, avoiding partial matches in longer names (like function methods: obj.originalName)
            // However, relying on \b is dangerous if the name is part of a string literal or comment which wasn't fully removed/processed yet.
            // Since string encoding happens first, we hope strings are replaced. We rely on the robustness of Luau's token definition here.
            const nameRegex = new RegExp(`\\b${originalName}\\b`, 'g');
            renamedCode = renamedCode.replace(nameRegex, newName);
        }

        return renamedCode;
    }

    /**
     * 4. Simplified Control Flow Flattening (Placeholder)
     * For high aggressiveness, wrap the entire code body in a simple function and use a rudimentary dispatcher structure.
     * NOTE: This is NOT true control flow flattening and provides marginal obfuscation.
     */
    function stepControlFlowFlattening(code, aggressiveness) {
        if (aggressiveness < 8) return code;

        // Dispatcher structure (very simple sequential execution)
        const flattenedCode = `
do
    local _O = {} -- Operations table
    local _P = 1  -- Program counter

    -- Wrap the user code in a function block
    local _F = function()
${code}
    end

    _O[1] = _F -- Store function reference

    while _O[_P] do
        local _C = _O[_P]
        _O[_P]=nil -- Clear reference to allow GC
        _P = _P + 1
        _C()
    end
end
`;
        return stepMinify(flattenedCode, false);
    }

    /**
     * Main Obfuscation Pipeline
     */
    function obfuscateCode(inputCode, config) {
        symbolMap = {};
        let code = inputCode;
        let decoder = '';

        const originalLength = inputCode.length;

        // 1. Preparation: Remove prior credit if user re-runs on output
        code = code.replace(OBFUSCATION_CREDIT, '');

        // 2. String Encoding (must happen early to protect strings from renaming/minification regexes)
        if (config.strings) {
            const result = stepStringEncoding(code);
            code = result.code;
            decoder = result.decoder;
        }

        // 3. Identifier Renaming
        if (config.rename) {
            code = stepIdentifierRenaming(code, config.aggressiveness, symbolMap);
        }

        // 4. Control Flow Flattening
        if (config.flatten) {
            code = stepControlFlowFlattening(code, config.aggressiveness);
        }

        // 5. Final Minification/Cleanup
        if (config.minify) {
            code = stepMinify(code, config.preserveComments);
        } else if (!config.preserveComments) {
            // Even if not minifying, remove comments if they shouldn't be preserved
            code = stepMinify(code, false);
        }

        // 6. Assembly
        let finalCode = '';
        finalCode += OBFUSCATION_CREDIT;
        if (decoder) {
            finalCode += decoder;
        }
        finalCode += code;

        const finalLength = finalCode.length;

        OBF_STATS.textContent = `Original Size: ${originalLength} bytes | Obfuscated Size: ${finalLength} bytes | Ratio: ${((1 - finalLength / originalLength) * 100).toFixed(2)}% reduction`;

        return finalCode;
    }


    // --- UI Setup and Handlers ---

    // Aggressiveness slider update
    AGG_SLIDER.addEventListener('input', () => {
        AGG_VALUE_DISPLAY.textContent = AGG_SLIDER.value;
    });

    // Obfuscate Button Handler
    BTN_OBFUSCATE.addEventListener('click', () => {
        const inputCode = INPUT_CODE.value;
        if (!inputCode.trim()) {
            OUTPUT_CODE.value = "Error: Input code is empty.";
            return;
        }

        const config = {
            rename: document.getElementById('checkRename').checked,
            strings: document.getElementById('checkStrings').checked,
            minify: document.getElementById('checkMinify').checked,
            flatten: document.getElementById('checkFlatten').checked,
            symbolMap: document.getElementById('checkSymbolMap').checked,
            preserveComments: document.getElementById('checkPreserveComments').checked,
            aggressiveness: parseInt(AGG_SLIDER.value, 10)
        };

        try {
            finalObfuscatedCode = obfuscateCode(inputCode, config);
            OUTPUT_CODE.value = finalObfuscatedCode;

            BTN_COPY.disabled = false;
            BTN_DOWNLOAD_LUA.disabled = false;
            BTN_DOWNLOAD_MAP.disabled = !(config.symbolMap && Object.keys(symbolMap).length > 0);

        } catch (e) {
            OUTPUT_CODE.value = `Obfuscation Error: ${e.message}`;
            console.error("Obfuscation failed:", e);
            BTN_COPY.disabled = true;
            BTN_DOWNLOAD_LUA.disabled = true;
            BTN_DOWNLOAD_MAP.disabled = true;
        }
    });

    BTN_COPY.addEventListener('click', () => {
        if (finalObfuscatedCode && navigator.clipboard) {
            navigator.clipboard.writeText(finalObfuscatedCode).then(() => {
                BTN_COPY.textContent = 'Copied!';
                setTimeout(() => { BTN_COPY.textContent = 'Copy Obfuscated Code'; }, 1500);
            });
        }
    });

    BTN_DOWNLOAD_LUA.addEventListener('click', () => {
        if (finalObfuscatedCode) {
            downloadFile('obfuscated.lua', finalObfuscatedCode, 'text/plain');
        }
    });

    BTN_DOWNLOAD_MAP.addEventListener('click', () => {
        if (Object.keys(symbolMap).length > 0) {
            downloadFile('symbol_map.json', JSON.stringify(symbolMap, null, 2), 'application/json');
        } else {
            alert("No symbols were renamed to generate a map.");
        }
    });

    // --- Initial Example Input ---

    INPUT_CODE.value = `-- Example Luau Script demonstrating features
local function calculateMagic(input)
    -- This calculates the square of the input plus a constant
    local constant = "Secret Key 123"
    local result = input * input
    print("Calculated:", result, constant)
    if result > 100 then
        return true -- High value flag
    end
    return false
end

local data = 15
local flag = calculateMagic(data)

if flag then
    game.Workspace.Part:Destroy() -- Global API call, must not be renamed
end
`;
});
