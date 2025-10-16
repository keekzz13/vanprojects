const _0x4a2b=['charCodeAt','floor','random','stringify','parse','split','join','replace','match','substr','substring','length','toString','fromCharCode','slice','push','pop','shift','unshift','reverse','sort','map','filter','reduce','forEach','includes','indexOf','lastIndexOf','concat','trim','toLowerCase','toUpperCase','repeat','padStart','padEnd','test','exec'];(function(_0x1a2b3c,_0x4d5e6f){const _0x7g8h9i=function(_0xabcdef){while(--_0xabcdef){_0x1a2b3c['push'](_0x1a2b3c['shift']());}};_0x7g8h9i(++_0x4d5e6f);}(_0x4a2b,0x1a3));const _0x2b3c=function(_0x1a2b3c,_0x4d5e6f){_0x1a2b3c=_0x1a2b3c-0x0;let _0x7g8h9i=_0x4a2b[_0x1a2b3c];return _0x7g8h9i;};

function clearInput(){
    const input = document.getElementById('inputCode');
    const output = document.getElementById('outputCode');
    input.value = '';
    output.value = '';
    updateStats(0, 0, 0);
    showNotification('Input cleared');
}

function copyOutput(){
    const output = document.getElementById('outputCode');
    const copyBtn = document.querySelector('.copy-btn');
    
    if(!output.value.trim()){
        showNotification('Nothing to copy', 'error');
        return;
    }
    
    output.select();
    document.execCommand('copy');
    
    copyBtn.classList.add('copied');
    showNotification('Code copied to clipboard!');
    
    setTimeout(() => {
        copyBtn.classList.remove('copied');
    }, 2000);
}

function showNotification(message, type = 'success'){
    const notification = document.getElementById('notification');
    const textEl = notification.querySelector('.notification-text');
    textEl.textContent = message;
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function updateStats(inputSize, outputSize, time){
    document.getElementById('inputSize').textContent = inputSize.toLocaleString();
    document.getElementById('outputSize').textContent = outputSize.toLocaleString();
    document.getElementById('obfuscationTime').textContent = time + 'ms';
}

function showLoading(){
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');
    
    const steps = ['step1', 'step2', 'step3', 'step4'];
    let currentStep = 0;
    let progress = 0;
    
    const stepInterval = setInterval(() => {
        if(currentStep > 0){
            const prevStep = document.getElementById(steps[currentStep - 1]);
            prevStep.classList.remove('active');
            prevStep.classList.add('completed');
        }
        
        if(currentStep < steps.length){
            const currentStepEl = document.getElementById(steps[currentStep]);
            currentStepEl.classList.add('active');
            currentStep++;
        }
    }, 400);
    
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if(progress > 95) progress = 95;
        document.getElementById('progressBar').style.width = progress + '%';
    }, 100);
    
    return { stepInterval, progressInterval };
}

function hideLoading(intervals){
    document.getElementById('progressBar').style.width = '100%';
    
    const lastStep = document.getElementById('step4');
    lastStep.classList.remove('active');
    lastStep.classList.add('completed');
    
    clearInterval(intervals.stepInterval);
    clearInterval(intervals.progressInterval);
    
    setTimeout(() => {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('active');
        
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active', 'completed');
        });
        document.getElementById('progressBar').style.width = '0%';
    }, 500);
}

async function obfuscateCode(){
    const input = document.getElementById('inputCode').value;
    
    if(!input.trim()){
        showNotification('Please enter Lua code to obfuscate', 'error');
        return;
    }
    
    const btn = document.querySelector('.obfuscate-btn');
    btn.classList.add('loading');
    btn.disabled = true;
    
    const startTime = Date.now();
    const intervals = showLoading();
    
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    const obfuscated = _0x9j0k1l(input);
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    document.getElementById('outputCode').value = obfuscated;
    
    updateStats(input.length, obfuscated.length, processingTime);
    
    hideLoading(intervals);
    
    btn.classList.remove('loading');
    btn.disabled = false;
    
    showNotification('Code obfuscated successfully!');
}

function _0x9j0k1l(_0xm2n3o4){const _0xp5q6r7='--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--
';const _0xs8t9u0=_0xv1w2x3(_0xm2n3o4);const _0xy4z5a6=_0xb7c8d9(_0xs8t9u0);const _0xe0f1g2=_0xh3i4j5(_0xy4z5a6);const _0xk6l7m8=_0xn9o0p1(_0xe0f1g2);const _0xq2r3s4=_0xt5u6v7(_0xk6l7m8);const _0xw8x9y0=_0xz1a2b3(_0xq2r3s4);const _0xc4d5e6=_0xf7g8h9(_0xw8x9y0);const _0xi0j1k2=_0xl3m4n5(_0xc4d5e6);const _0xo6p7q8=_0xr9s0t1(_0xi0j1k2);const _0xu2v3w4=_0xx5y6z7(_0xo6p7q8);return _0xp5q6r7+_0xu2v3w4;}function _0xv1w2x3(_0xa8b9c0){let _0xd1e2f3='';for(let _0xg4h5i6=0x0;_0xg4h5i6<_0xa8b9c0['length'];_0xg4h5i6++){const _0xj7k8l9=_0xa8b9c0['charCodeAt'](_0xg4h5i6);_0xd1e2f3+=String['fromCharCode'](_0xj7k8l9^0x7a);}return _0xd1e2f3;}function _0xb7c8d9(_0xm0n1o2){const _0xp3q4r5=[];let _0xs6t7u8='';for(let _0xv9w0x1=0x0;_0xv9w0x1<_0xm0n1o2['length'];_0xv9w0x1++){_0xs6t7u8+=_0xm0n1o2['charCodeAt'](_0xv9w0x1)['toString'](0x10)['padStart'](0x2,'0');}return _0xs6t7u8;}function _0xh3i4j5(_0xy2z3a4){let _0xb5c6d7='';for(let _0xe8f9g0=0x0;_0xe8f9g0<_0xy2z3a4['length'];_0xe8f9g0+=0x2){_0xb5c6d7+=_0xy2z3a4['charAt'](_0xe8f9g0+0x1)+_0xy2z3a4['charAt'](_0xe8f9g0);}return _0xb5c6d7;}function _0xn9o0p1(_0xh1i2j3){const _0xk4l5m6=_0xh1i2j3['split']('');for(let _0xn7o8p9=_0xk4l5m6['length']-0x1;_0xn7o8p9>0x0;_0xn7o8p9--){const _0xq0r1s2=Math['floor'](Math['random']()*(_0xn7o8p9+0x1));[_0xk4l5m6[_0xn7o8p9],_0xk4l5m6[_0xq0r1s2]]=[_0xk4l5m6[_0xq0r1s2],_0xk4l5m6[_0xn7o8p9]];}return _0xk4l5m6['join']('');}function _0xt5u6v7(_0xw3x4y5){let _0xz6a7b8='';const _0xc9d0e1=_0xw3x4y5['length'];for(let _0xf2g3h4=0x0;_0xf2g3h4<_0xc9d0e1;_0xf2g3h4++){_0xz6a7b8+=_0xw3x4y5['charAt']((_0xf2g3h4+0x5)%_0xc9d0e1);}return _0xz6a7b8;}function _0xz1a2b3(_0xi5j6k7){let _0xl8m9n0='';for(let _0xo1p2q3=0x0;_0xo1p2q3<_0xi5j6k7['length'];_0xo1p2q3+=0x2){if(_0xo1p2q3+0x1<_0xi5j6k7['length']){_0xl8m9n0+=_0xi5j6k7['charAt'](_0xo1p2q3+0x1)+_0xi5j6k7['charAt'](_0xo1p2q3);}else{_0xl8m9n0+=_0xi5j6k7['charAt'](_0xo1p2q3);}}return _0xl8m9n0;}function _0xf7g8h9(_0xr4s5t6){let _0xu7v8w9='';for(let _0xx0y1z2=0x0;_0xx0y1z2<_0xr4s5t6['length'];_0xx0y1z2++){const _0xa3b4c5=_0xr4s5t6['charCodeAt'](_0xx0y1z2);_0xu7v8w9+=String['fromCharCode'](_0xa3b4c5^0x3f);}return _0xu7v8w9;}function _0xl3m4n5(_0xd6e7f8){const _0xg9h0i1=_0xd6e7f8['split']('');const _0xj2k3l4=Math['floor'](_0xg9h0i1['length']/0x2);const _0xm5n6o7=_0xg9h0i1['splice'](0x0,_0xj2k3l4);return _0xg9h0i1['concat'](_0xm5n6o7)['join']('');}function _0xr9s0t1(_0xp8q9r0){let _0xs1t2u3='';for(let _0xv4w5x6=_0xp8q9r0['length']-0x1;_0xv4w5x6>=0x0;_0xv4w5x6--){_0xs1t2u3+=_0xp8q9r0['charAt'](_0xv4w5x6);}return _0xs1t2u3;}function _0xx5y6z7(_0xa7b8c9){const _0xd0e1f2=_0xg3h4i5();const _0xj6k7l8=_0xm9n0o1(_0xa7b8c9,_0xd0e1f2);const _0xp2q3r4='local _0xVAR1="'+ _0xd0e1f2+'";'+' local _0xVAR2="'+_0xj6k7l8+'";'+' local function _0xFUNC1(_0xP1)'+' local _0xR1="";'+ ' for _0xI1=1,#_0xP1,2 do'+' _0xR1=_0xR1..string.char(tonumber(_0xP1:sub(_0xI1,_0xI1+1),16));'+ ' end;'+ ' return _0xR1;'+ ' end;'+ ' local function _0xFUNC2(_0xP2,_0xK1)'+' local _0xR2="";'+ ' local _0xKL1=#_0xK1;'+ ' for _0xI2=1,#_0xP2 do'+' local _0xC1=string.byte(_0xP2,_0xI2);'+' local _0xK2=string.byte(_0xK1,((_0xI2-1)%_0xKL1)+1);'+ ' _0xR2=_0xR2..string.char(bit32.bxor(_0xC1,_0xK2));'+ ' end;'+ ' return _0xR2;'+ ' end;'+ ' local function _0xFUNC3(_0xP3)'+' local _0xR3="";'+ ' for _0xI3=#_0xP3,1,-1 do'+' _0xR3=_0xR3.._0xP3:sub(_0xI3,_0xI3);'+ ' end;'+ ' return _0xR3;'+ ' end;'+ ' local function _0xFUNC4(_0xP4)'+' local _0xL1=#_0xP4;'+ ' local _0xM1=math.floor(_0xL1/2);'+ ' return _0xP4:sub(_0xM1+1).._0xP4:sub(1,_0xM1);'+ ' end;'+ ' local function _0xFUNC5(_0xP5)'+' local _0xR5="";'+ ' for _0xI5=1,#_0xP5,2 do'+ ' if _0xI5+1<=#_0xP5 then'+' _0xR5=_0xR5.._0xP5:sub(_0xI5+1,_0xI5+1).._0xP5:sub(_0xI5,_0xI5);'+ ' else'+ ' _0xR5=_0xR5.._0xP5:sub(_0xI5,_0xI5);'+ ' end;'+ ' end;'+ ' return _0xR5;'+ ' end;'+ ' local function _0xFUNC6(_0xP6)'+' local _0xL2=#_0xP6;'+ ' local _0xR6="";'+ ' for _0xI6=1,_0xL2 do'+' _0xR6=_0xR6.._0xP6:sub(((_0xI6+4)%_0xL2)+1,((_0xI6+4)%_0xL2)+1);'+ ' end;'+ ' return _0xR6;'+ ' end;'+ ' local function _0xFUNC7(_0xP7)'+' local _0xT1={};'+ ' for _0xC2 in _0xP7:gmatch(".") do'+' table.insert(_0xT1,_0xC2);'+ ' end;'+ ' for _0xI7=#_0xT1,2,-1 do'+' local _0xJ1=math.random(1,_0xI7);'+ ' _0xT1[_0xI7],_0xT1[_0xJ1]=_0xT1[_0xJ1],_0xT1[_0xI7];'+ ' end;'+ ' return table.concat(_0xT1);'+ ' end;'+ ' local _0xDATA=_0xFUNC1(_0xFUNC5(_0xFUNC4(_0xFUNC3(_0xFUNC6(_0xFUNC2(_0xFUNC5(_0xFUNC3(_0xVAR2)),_0xVAR1))))));'+ ' local _0xEXEC=loadstring(_0xDATA);'+ ' if _0xEXEC then _0xEXEC(); end;';return _0xp2q3r4;}function _0xg3h4i5(){let _0xs5t6u7='';const _0xv8w9x0='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';for(let _0xy1z2a3=0x0;_0xy1z2a3<0x20;_0xy1z2a3++){_0xs5t6u7+=_0xv8w9x0['charAt'](Math['floor'](Math['random']()*_0xv8w9x0['length']));}return _0xs5t6u7;}function _0xm9n0o1(_0xb4c5d6,_0xe7f8g9){let _0xh0i1j2='';for(let _0xk3l4m5=0x0;_0xk3l4m5<_0xb4c5d6['length'];_0xk3l4m5++){const _0xn6o7p8=_0xb4c5d6['charCodeAt'](_0xk3l4m5);const _0xq9r0s1=_0xe7f8g9['charCodeAt'](_0xk3l4m5%_0xe7f8g9['length']);_0xh0i1j2+=(_0xn6o7p8^_0xq9r0s1)['toString'](0x10)['padStart'](0x2,'0');}return _0xh0i1j2;}function _0xt2u3v4(_0xw5x6y7){let _0xz8a9b0='';for(let _0xc1d2e3=0x0;_0xc1d2e3<_0xw5x6y7['length'];_0xc1d2e3++){_0xz8a9b0+=_0xw5x6y7['charCodeAt'](_0xc1d2e3)['toString'](0x10)['padStart'](0x4,'0');}return _0xz8a9b0;}function _0xf4g5h6(_0xi7j8k9){const _0xl0m1n2=[];for(let _0xo3p4q5=0x0;_0xo3p4q5<_0xi7j8k9['length'];_0xo3p4q5+=0x4){_0xl0m1n2['push'](String['fromCharCode'](parseInt(_0xi7j8k9['substr'](_0xo3p4q5,0x4),0x10)));}return _0xl0m1n2['join']('');}function _0xr6s7t8(_0xu9v0w1){const _0xx2y3z4=[];let _0xa5b6c7=0x0;for(let _0xd8e9f0=0x0;_0xd8e9f0<_0xu9v0w1['length'];_0xd8e9f0++){_0xa5b6c7=(_0xa5b6c7+0x1)%0x100;const _0xg1h2i3=_0xu9v0w1['charCodeAt'](_0xd8e9f0);_0xx2y3z4['push'](String['fromCharCode'](_0xg1h2i3^_0xa5b6c7));}return _0xx2y3z4['join']('');}function _0xj4k5l6(_0xm7n8o9){let _0xp0q1r2='';for(let _0xs3t4u5=0x0;_0xs3t4u5<_0xm7n8o9['length'];_0xs3t4u5++){const _0xv6w7x8=_0xm7n8o9['charCodeAt'](_0xs3t4u5);const _0xy9z0a1=((_0xv6w7x8&0xf)<<0x4)|(_0xv6w7x8>>0x4);_0xp0q1r2+=String['fromCharCode'](_0xy9z0a1);}return _0xp0q1r2;}function _0xb2c3d4(_0xe5f6g7){let _0xh8i9j0='';const _0xk1l2m3=[0x5,0xd,0x3,0xf,0xb,0x7,0x9,0x1];for(let _0xn4o5p6=0x0;_0xn4o5p6<_0xe5f6g7['length'];_0xn4o5p6++){const _0xq7r8s9=_0xe5f6g7['charCodeAt'](_0xn4o5p6);const _0xt0u1v2=_0xk1l2m3[_0xn4o5p6%_0xk1l2m3['length']];_0xh8i9j0+=String['fromCharCode'](_0xq7r8s9^_0xt0u1v2);}return _0xh8i9j0;}function _0xw3x4y5(_0xz6a7b8){const _0xc9d0e1=_0xz6a7b8['split']('');let _0xf2g3h4=0x0;for(let _0xi5j6k7=0x0;_0xi5j6k7<_0xc9d0e1['length'];_0xi5j6k7++){_0xf2g3h4+=_0xc9d0e1[_0xi5j6k7]['charCodeAt'](0x0);}return _0xf2g3h4%0x100;}function _0xl8m9n0(_0xo1p2q3,_0xr4s5t6){let _0xu7v8w9='';for(let _0xx0y1z2=0x0;_0xx0y1z2<_0xo1p2q3['length'];_0xx0y1z2++){const _0xa3b4c5=_0xo1p2q3['charCodeAt'](_0xx0y1z2);_0xu7v8w9+=String['fromCharCode'](_0xa3b4c5+_0xr4s5t6);}return _0xu7v8w9;}function _0xd6e7f8(_0xg9h0i1){let _0xj2k3l4='';for(let _0xm5n6o7=0x0;_0xm5n6o7<_0xg9h0i1['length'];_0xm5n6o7++){const _0xp8q9r0=_0xg9h0i1['charCodeAt'](_0xm5n6o7);_0xj2k3l4+=(_0xp8q9r0&0x1?'1':'0')+(_0xp8q9r0&0x2?'1':'0')+(_0xp8q9r0&0x4?'1':'0')+(_0xp8q9r0&0x8?'1':'0')+(_0xp8q9r0&0x10?'1':'0')+(_0xp8q9r0&0x20?'1':'0')+(_0xp8q9r0&0x40?'1':'0')+(_0xp8q9r0&0x80?'1':'0');}return _0xj2k3l4;}function _0xs1t2u3(_0xv4w5x6){let _0xy7z8a9='';for(let _0xb0c1d2=0x0;_0xb0c1d2<_0xv4w5x6['length'];_0xb0c1d2+=0x8){const _0xe3f4g5=_0xv4w5x6['substr'](_0xb0c1d2,0x8);let _0xh6i7j8=0x0;for(let _0xk9l0m1=0x0;_0xk9l0m1<0x8;_0xk9l0m1++){if(_0xe3f4g5[_0xk9l0m1]==='1'){_0xh6i7j8|=(0x1<<_0xk9l0m1);}}_ 0xy7z8a9+=String['fromCharCode'](_0xh6i7j8);}return _0xy7z8a9;}function _0xn2o3p4(_0xq5r6s7,_0xt8u9v0){let _0xw1x2y3=0x0;let _0xz4a5b6=_0xq5r6s7['length'];while(_0xz4a5b6>0x0){_0xw1x2y3=(_0xw1x2y3<<0x5)-_0xw1x2y3+_0xq5r6s7['charCodeAt'](--_0xz4a5b6);_0xw1x2y3=_0xw1x2y3&_0xw1x2y3;}return Math['abs'](_0xw1x2y3)%_0xt8u9v0;}function _0xc7d8e9(_0xf0g1h2){const _0xi3j4k5=[];const _0xl6m7n8=_0xf0g1h2['length'];for(let _0xo9p0q1=0x0;_0xo9p0q1<_0xl6m7n8;_0xo9p0q1++){const _0xr2s3t4=_0xf0g1h2['charCodeAt'](_0xo9p0q1);_0xi3j4k5['push'](((_0xr2s3t4&0xaa)>>0x1)|((_0xr2s3t4&0x55)<<0x1));}return String['fromCharCode']['apply'](null,_0xi3j4k5);}function _0xu5v6w7(_0xx8y9z0){let _0xa1b2c3='';const _0xd4e5f6=[0x3,0x7,0x5,0x2,0x8,0x6,0x4,0x1,0x9,0xa,0xc,0xb,0xe,0xd,0xf,0x0];for(let _0xg7h8i9=0x0;_0xg7h8i9<_0xx8y9z0['length'];_0xg7h8i9++){const _0xj0k1l2=_0xx8y9z0['charCodeAt'](_0xg7h8i9);const _0xm3n4o5=_0xd4e5f6[_0xj0k1l2&0xf];const _0xp6q7r8=_0xd4e5f6[(_0xj0k1l2>>0x4)&0xf];_0xa1b2c3+=String['fromCharCode']((_0xp6q7r8<<0x4)|_0xm3n4o5);}return _0xa1b2c3;}function _0xs9t0u1(_0xv2w3x4){let _0xy5z6a7='';for(let _0xb8c9d0=0x0;_0xb8c9d0<_0xv2w3x4['length'];_0xb8c9d0+=0x3){const _0xe1f2g3=_0xv2w3x4['charCodeAt'](_0xb8c9d0);const _0xh4i5j6=_0xb8c9d0+0x1<_0xv2w3x4['length']?_0xv2w3x4['charCodeAt'](_0xb8c9d0+0x1):0x0;const _0xk7l8m9=_0xb8c9d0+0x2<_0xv2w3x4['length']?_0xv2w3x4['charCodeAt'](_0xb8c9d0+0x2):0x0;const _0xn0o1p2=(_0xe1f2g3<<0x10)|(_0xh4i5j6<<0x8)|_0xk7l8m9;_0xy5z6a7+=String['fromCharCode']((_0xn0o1p2>>0x12)&0x3f,(_0xn0o1p2>>0xc)&0x3f,(_0xn0o1p2>>0x6)&0x3f,_0xn0o1p2&0x3f);}return _0xy5z6a7;}

document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.feature-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    featureCards.forEach(card => {
        observer.observe(card);
    });
});
