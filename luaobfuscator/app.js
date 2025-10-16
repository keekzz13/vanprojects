document.addEventListener('DOMContentLoaded', function() {
    const inputCode = document.getElementById('inputCode');
    const outputCode = document.getElementById('outputCode');
    const obfuscateBtn = document.getElementById('obfuscateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const originalSize = document.getElementById('originalSize');
    const obfuscatedSize = document.getElementById('obfuscatedSize');
    const ratio = document.getElementById('ratio');
    
    function updateStats() {
        const inputLength = inputCode.value.length;
        const outputLength = outputCode.value.length;
        
        originalSize.textContent = inputLength + ' bytes';
        obfuscatedSize.textContent = outputLength + ' bytes';
        
        if (inputLength > 0) {
            const compressionRatio = ((outputLength / inputLength) * 100).toFixed(1);
            ratio.textContent = compressionRatio + '%';
        } else {
            ratio.textContent = '0%';
        }
    }
    
    obfuscateBtn.addEventListener('click', function() {
        const input = inputCode.value.trim();
        
        if (!input) {
            outputCode.value = 'Please enter Lua code to obfuscate';
            return;
        }
        
        try {
            const obfuscated = obfuscateLua(input);
            outputCode.value = obfuscated;
            updateStats();
            
            obfuscateBtn.textContent = 'Obfuscated!';
            obfuscateBtn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            
            setTimeout(() => {
                obfuscateBtn.textContent = 'Obfuscate';
                obfuscateBtn.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
            }, 2000);
        } catch (error) {
            outputCode.value = 'Error during obfuscation. Please check your code.';
        }
    });
    
    clearBtn.addEventListener('click', function() {
        inputCode.value = '';
        outputCode.value = '';
        updateStats();
    });
    
    copyBtn.addEventListener('click', function() {
        if (outputCode.value) {
            outputCode.select();
            document.execCommand('copy');
            
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
            
            setTimeout(() => {
                copyBtn.textContent = 'Copy to Clipboard';
                copyBtn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            }, 2000);
        }
    });
    
    inputCode.addEventListener('input', updateStats);
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
