document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('input');
  const output = document.getElementById('output');
  const obfuscateBtn = document.getElementById('obfuscate');
  const copyBtn = document.getElementById('copy');

  obfuscateBtn.addEventListener('click', () => {
    try {
      const luaCode = input.value;
      if (!luaCode.trim()) return alert('Input is empty!');

      // Obfuscate with max security
      const obfuscated = LuaObfuscator.T(luaCode, {
        junk: true,
        antiDebugging: true,
        dynamicKeys: true,
        layers: 8
      });

      output.value = obfuscated;
    } catch (e) {
      output.value = `-- Obfuscation Error: ${e.message}`;
    }
  });

  copyBtn.addEventListener('click', () => {
    if (!output.value.trim()) return;
    navigator.clipboard.writeText(output.value)
      .then(() => alert('Copied to clipboard!'))
      .catch(() => alert('Failed to copy.'));
  });
});
