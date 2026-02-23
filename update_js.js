const fs = require('fs');
let js = fs.readFileSync('src/renderer/settings/renderer.js', 'utf8');

js = js.replace(/currencySettings: isAr \? 'إعدادات العملة' : 'Currency Settings'/g, "currencySettings: isAr ? 'شاشة العرض والعملة' : 'Display and Currency'");
js = js.replace(/else if\(txt === 'إعدادات العملة' \|\| txt === 'Currency Settings'\) el.textContent = t.currencySettings;/g, "else if(txt === 'شاشة العرض والعملة' || txt === 'Display and Currency' || txt === 'إعدادات العملة' || txt === 'Currency Settings') el.textContent = t.currencySettings;");

fs.writeFileSync('src/renderer/settings/renderer.js', js, 'utf8');
console.log('Renderer.js updated for the new title.');
