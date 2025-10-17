function randomName() {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var name = '_';
    var length = Math.floor(Math.random() * 4) + 3;
    for (var i = 0; i < length; i++) {
        name += chars[Math.floor(Math.random() * chars.length)];
    }
    return name;
}

function escapeStr(str) {
    var es = '';
    for (var j = 0; j < str.length; j++) {
        var code = str.charCodeAt(j);
        es += '\\' + ('00' + code.toString(10)).slice(-3);
    }
    return es;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function applyReverseEncode(s) {
    return s.split('').reverse().join('');
}

function applyXorEncode(s, key) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
        out += String.fromCharCode(s.charCodeAt(i) ^ key);
    }
    return out;
}

function applyShiftEncode(s, key) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
        out += String.fromCharCode((s.charCodeAt(i) + key) % 256);
    }
    return out;
}

function buildPartsStr(parts) {
    return '{' + parts.map(function(p) { return '"' + p + '"'; }).join(',') + '}';
}

function buildDecodeExpr(decExpr, layers, numLayers, nR, nGS, nC, nB, nTN) {
    var paramName = randomName();
    decExpr = nGS + '(' + decExpr + ', "\\\\\\\\(%d%d?%d?)", function(' + paramName + ') return ' + nC + '(' + nTN + '(' + paramName + ')) end)';
    for (var i = numLayers - 1; i >= 0; i--) {
        var layer = layers[i];
        paramName = randomName();
        if (layer.type === 1) {
            decExpr = nR + '(' + decExpr + ')';
        } else if (layer.type === 2) {
            decExpr = nGS + '(' + decExpr + ', "' + escapeStr('.') + '", function(' + paramName + ') return ' + nC + '(' + nB + '(' + paramName + ') ^ ' + layer.key + ') end)';
        } else {
            decExpr = nGS + '(' + decExpr + ', "' + escapeStr('.') + '", function(' + paramName + ') return ' + nC + '((' + nB + '(' + paramName + ') - ' + layer.key + ') % 256) end)';
        }
    }
    return decExpr;
}

function obfuscateLua(code) {
    var output = '--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--\n';
    var numLayers = getRandomInt(2, 4);
    var layers = [];
    for (var i = 0; i < numLayers; i++) {
        var type = getRandomInt(1, 3);
        var key = (type === 1) ? null : getRandomInt(1, 255);
        layers.push({type: type, key: key});
    }
    var encoded = code;
    for (var k = 0; k < layers.length; k++) {
        var layer = layers[k];
        if (layer.type === 1) {
            encoded = applyReverseEncode(encoded);
        } else if (layer.type === 2) {
            encoded = applyXorEncode(encoded, layer.key);
        } else {
            encoded = applyShiftEncode(encoded, layer.key);
        }
    }
    var escaped = '';
    for (var m = 0; m < encoded.length; m++) {
        var c = encoded.charCodeAt(m);
        escaped += '\\' + ('00' + c.toString(10)).slice(-3);
    }
    var chunkSize = 50;
    var parts = [];
    for (var n = 0; n < escaped.length; n += chunkSize) {
        parts.push(escaped.substring(n, n + chunkSize));
    }
    var nG = randomName();
    var nS = randomName();
    var nT = randomName();
    var nL = randomName();
    var nB = randomName();
    var nC = randomName();
    var nR = randomName();
    var nGS = randomName();
    var nTC = randomName();
    var nTN = randomName();
    var nE = randomName();
    output += 'local ' + nG + ' = _G;\n';
    output += 'local ' + nS + ' = ' + nG + '["' + escapeStr('string') + '"];\n';
    output += 'local ' + nT + ' = ' + nG + '["' + escapeStr('table') + '"];\n';
    output += 'local ' + nL + ' = ' + nG + '["' + escapeStr('load') + '"];\n';
    output += 'local ' + nB + ' = ' + nS + '["' + escapeStr('byte') + '"];\n';
    output += 'local ' + nC + ' = ' + nS + '["' + escapeStr('char') + '"];\n';
    output += 'local ' + nR + ' = ' + nS + '["' + escapeStr('reverse') + '"];\n';
    output += 'local ' + nGS + ' = ' + nS + '["' + escapeStr('gsub') + '"];\n';
    output += 'local ' + nTC + ' = ' + nT + '["' + escapeStr('concat') + '"];\n';
    output += 'local ' + nTN + ' = ' + nG + '["' + escapeStr('tonumber') + '"];\n';
    var partsStr = buildPartsStr(parts);
    output += 'local ' + nE + ' = ' + nTC + '(' + partsStr + ');\n';
    var decExpr = nE;
    decExpr = buildDecodeExpr(decExpr, layers, numLayers, nR, nGS, nC, nB, nTN);
    output += nL + '(' + decExpr + ')();\n';
    return output;
}

function obfuscate() {
    var input = document.getElementById('input').value;
    var obfuscated = obfuscateLua(input);
    document.getElementById('output').value = obfuscated;
}
