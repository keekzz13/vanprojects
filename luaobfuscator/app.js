function obfuscateCode() {
    const input = document.getElementById('input-code').value;
    if (!input.trim()) {
        alert('Please enter Lua code to obfuscate');
        return;
    }
    
    try {
        const obfuscated = LuaObfuscator.obfuscate(input);
        document.getElementById('output-code').value = obfuscated;
        updateStats();
    } catch (error) {
        alert('Error during obfuscation. Please check your code.');
    }
}

function clearInput() {
    document.getElementById('input-code').value = '';
    document.getElementById('output-code').value = '';
    updateStats();
}

function copyOutput() {
    const output = document.getElementById('output-code');
    if (!output.value) {
        alert('No obfuscated code to copy');
        return;
    }
    
    output.select();
    document.execCommand('copy');
    
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

function updateStats() {
    const input = document.getElementById('input-code').value;
    const output = document.getElementById('output-code').value;
    
    document.getElementById('input-size').textContent = input.length + ' bytes';
    document.getElementById('output-size').textContent = output.length + ' bytes';
}

document.getElementById('input-code').addEventListener('input', () => {
    document.getElementById('input-size').textContent = 
        document.getElementById('input-code').value.length + ' bytes';
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
