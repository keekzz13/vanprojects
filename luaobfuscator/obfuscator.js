// Utility Functions
const $ = (s, d = document) => d.querySelector(s);
const $$ = (s, d = document) => d.querySelectorAll(s);
const C = (t, c = 1) => t.split('').map((_, i) => String.fromCharCode(t.charCodeAt(i) ^ c)).join('');
const R = (m, n) => Math.floor(Math.random() * (n - m + 1) + m);
const S = (a) => a.sort(() => 0.5 - Math.random());
const X = (l = 32) => Array(l).fill().map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[R(0, 61)]).join('');
const Y = (s, k = X()) => s.split('').map(c => k[c.charCodeAt(0) % k.length] || c).join('');
const Z = (s, k = X()) => s.split('').map(c => k.indexOf(c) >= 0 ? String.fromCharCode(k.indexOf(c)) : c).join('');
const _ = (s, l = R(2, 4)) => { for (let i = 0; i < l; i++) s = C(Y(s)); return s; };
const __ = (s, l = R(2, 4)) => { for (let i = 0; i < l; i++) s = Z(C(s)); return s; };

// Anti-Debugging Tricks
const antiDebug = () => {
  const checks = [
    `if debug.getinfo then return end`,
    `if _G["debug"] then os.exit() end`,
    `local mt = getmetatable(_G) if mt then mt.__index = function() error("No debug!") end end`,
    `local oldprint = print; _G.print = function(...) if select('#', ...) > 0 and tostring(select(1, ...)):find("debug") then return else oldprint(...) end end`
  ];
  return checks[R(0, checks.length - 1)];
};

// Dynamic Key Generation
const dynamicKey = () => {
  const key = X(16);
  return `
    local function getKey()
      local key = "${key}"
      for i=1,#key do
        key = key:sub(2) .. key:sub(1,1)
        key = key:gsub(".(.)", function(a,b) return b..a end)
      end
      return key
    end
  `;
};

// Junk Code Injection
const junkCode = () => {
  const junk = [
    `local ${X(8)} = function() return ${R(100, 9999)} end`,
    `for ${X(5)}=1,${R(5, 20)} do local ${X(8)}=math.random() end`,
    `if ${R(1, 100)} > ${R(1, 100)} then ${X(8)}() end`,
    `local ${X(8)} = {${Array(R(3, 10)).fill().map(() => R(0, 255)).join(',')}}`,
    `pcall(function() ${X(8)} = ${R(1, 100)} end)`
  ];
  return junk[R(0, junk.length - 1)];
};

// Number Obfuscation
const obfuscateNumber = (n) => {
  if (n < 10) return n;
  const ops = ['+', '-', '*', '/', '^'];
  const a = R(1, n - 1);
  const b = n - a;
  const op = ops[R(0, ops.length - 1)];
  return `${a}${op}${b}`;
};

// Base64 + XOR Obfuscation
const B64 = (s) => btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode('0x' + p)));
const XOR_B64 = (s, k) => C(B64(s), k);

// Main Obfuscator Function
const T = (code, options = {}) => {
  const {
    junk = true,
    antiDebugging = true,
    dynamicKeys = true,
    layers = R(3, 8)
  } = options;

  // Generate random variable names
  const vars = Array(100).fill().map(() => X(8));
  const [r, n, e, o, u, a, i, s, l, d, p, h, v, g, y, m, b, w, k, E, S, x, N, C, D, P, L, O, A, I, U, F, R, B, W, K, V, G, Y, M, q, H, j, Q, z] = vars;

  // Obfuscate the input code
  let obfuscated = _(code);

  // Add layers of obfuscation
  for (let layer = 0; layer < layers; layer++) {
    obfuscated = R(0, 1) ? _(obfuscated) : __(obfuscated);
    if (junk) obfuscated = `${junkCode()}\n${obfuscated}`;
  }

  // Inject anti-debugging
  if (antiDebugging) obfuscated = `${antiDebug()}\n${obfuscated}`;

  // Inject dynamic key generation
  if (dynamicKeys) obfuscated = `${dynamicKey()}\n${obfuscated}`;

  // Wrap in a random function
  return `
--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--
local ${r}=function()
  ${vars.map(v => `local ${v}=${R(100, 9999)}`).join('\n  ')}
  ${obfuscated}
  return ${r}
end
${r}()
  `.trim();
};

// Export for Node.js / Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { T, _, __, C, Y, Z, X, R };
} else {
  window.LuaObfuscator = { T, _, __, C, Y, Z, X, R };
}
