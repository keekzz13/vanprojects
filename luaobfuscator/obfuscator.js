(function(){
var r=function(n){var s="";for(var i=0;i<n;i++){s+=String.fromCharCode(Math.floor(Math.random()*256))}return s};
var n=function(min,max){return min+Math.floor(Math.random()*(max-min+1))};
var e=function(s){var a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var o="",i=0;while(i<s.length){var c=s.charCodeAt(i++),d=s.charCodeAt(i++),f=s.charCodeAt(i++);var x=c>>2;var y=((c&3)<<4)|(d>>4);var z=((d&15)<<2)|(f>>6);var u=f&63;if(isNaN(d)){z=u=64}else if(isNaN(f)){u=64}o+=a.charAt(x)+a.charAt(y)+a.charAt(z)+a.charAt(u)}return o};
var d=function(s){var a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var o="",i=0,c,f,g,p=[0,0,0,0];while(i<s.length){p[0]=a.indexOf(s.charAt(i++));p[1]=a.indexOf(s.charAt(i++));p[2]=a.indexOf(s.charAt(i++));p[3]=a.indexOf(s.charAt(i++));c=(p[0]<<2)|(p[1]>>4);f=((p[1]&15)<<4)|(p[2]>>2);g=((p[2]&3)<<6)|p[3];o+=String.fromCharCode(c);if(p[2]!==64){o+=String.fromCharCode(f)}if(p[3]!==64){o+=String.fromCharCode(g)}}return o};
var x=function(s,k){var o="",j=0;for(var i=0;i<s.length;i++){o+=String.fromCharCode(s.charCodeAt(i)^k.charCodeAt(j));j=(j+1)%k.length}return o};
var o=function(s,t){var o="";for(var i=0;i<s.length;i++){o+=String.fromCharCode((s.charCodeAt(i)+t)&255)}return o};
var h=function(s,t){var o="";for(var i=0;i<s.length;i++){o+=String.fromCharCode(s.charCodeAt(i)^((i+t)&255))}return o};
var a=function(src){var k1=r(n(12,24)),k2=r(n(12,24));var seq=[],layers=n(2,4),out=src;for(var i=0;i<layers;i++){var pick=n(1,4);seq.push(pick);if(pick===1){out=e(x(out,k1))}else if(pick===2){out=e(o(out,n(7,23)))}else if(pick===3){out=e(h(out,n(9,29)))}else{out=e(x(o(out,13),k2))}}var meta=JSON.stringify({l:layers,a:seq,k1:e(k1),k2:e(k2),t:(Date.now().toString(36))});return e(meta)+"."+out};
var s=function(len){var g="!@#$%^&*()[]{}<>+=-_,.;:|~`/?0123456789";var o="";for(var i=0;i<len;i++){o+=g.charAt(Math.floor(Math.random()*g.length))}return o};
var m=function(code){return code.replace(/\r/g,"").replace(/[ \t]+\n/g,"\n").replace(/\n{2,}/g,"\n")};
var k=function(code){
var src=m(code);
var pack=a(src);
var pad=s(n(256,512)),pad2=s(n(256,512));
var blob=pad+pack+pad2;
var t=function(s){var o="";for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);o+=String.fromCharCode(((c+((i%23)+9))&255))}return o};
var b=e(t(blob));
var A="a",B="b",C="c",D="d",E="e",F="f";
var lua="";
lua+="--[[ Obfuscated in https://vanprojects.netlify.app/luaobfuscator ]]--\n";
lua+=s(n(64,144))+"\n";
lua+="local "+A+"=\""+b.replace(/\\/g,"\\\\").replace(/"/g,'\\"')+"\"\n";
lua+="local "+B+"=function("+C+")local "+D+"=\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\"local "+E+"={}for i=1,#"+C+" do local q="+D+":find("+C+":sub(i,i),1,true) if q then "+E+"[#"+E+"+1]=q-1 end end local o=\"\"for i=1,#"+E+",4 do local n=("+E+"[i]<<18)|("+E+"[i+1]<<12)|((("+E+"[i+2]or 0)<<6))|((("+E+"[i+3]or 0))) o=o..string.char((n>>16)&255,(n>>8)&255,n&255) end return o end\n";
lua+="local "+F+"=function(s)local o=\"\"for i=1,#s do local c=s:byte(i) o=o..string.char(((c-((i%23)+9))%256)) end return o end\n";
lua+="do local p=false pcall(function() local g=debug and debug.getinfo if g then local u=g(1) if u and u.source and u.source:match(\"vanprojects\") then p=true end end end) if not p then return end end\n";
lua+="local _=(function(q) local f=q:find(\"%.\") local m=q:sub(1,f-1) local v=q:sub(f+1) local t=(load(\"return \".."+B+"(m)))() local y="+B+"(v) for i=t.l,1,-1 do local w=t.a[i] if w==1 then local k="+B+"(t.k1) local z=\"\" local j=1 for c=1,#y do z=z..string.char(bit32.bxor(y:byte(c),k:byte(j))) j=j%#k+1 end y=z elseif w==2 then local z=\"\" for c=1,#y do z=z..string.char((y:byte(c)-13)%256) end y=z elseif w==3 then local z=\"\" for c=1,#y do z=z..string.char(bit32.bxor(y:byte(c),((c+17)%256))) end y=z else local k="+B+"(t.k2) local z=\"\" local j=1 for c=1,#y do z=z..string.char(bit32.bxor((y:byte(c)+13)%256,k:byte(j))) j=j%#k+1 end y=z end end return y end)("+
F+"("+B+"("+A+")))\n";
lua+="(function(p) return assert(load(p))() end)(_)\n";
lua+=s(n(96,192))+"\n";
return lua};
var ui=function(){var o=document.getElementById("o");if(!o)return;var i=document.getElementById("i");var u=document.getElementById("u");var pulse=function(n){u.style.boxShadow="0 0 0 3px rgba(0,255,161,.22),0 14px 28px rgba(0,234,255,.14)";setTimeout(function(){u.style.boxShadow="0 0 0 1px rgba(0,255,161,.12),0 8px 16px rgba(0,234,255,.08)"},n||260)};
o.addEventListener("click",function(){var src=i.value||"";var out=k(src);u.value=out;pulse(280)});
i.addEventListener("focus",function(){i.style.borderColor="#00ffa1";i.style.boxShadow="0 0 0 3px rgba(0,255,161,.18)"});
i.addEventListener("blur",function(){i.style.borderColor="#142233";i.style.boxShadow="none"});
};
ui();
})();
