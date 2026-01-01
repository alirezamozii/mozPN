/**
 * MozPN Smart Bundler + Obfuscator
 * ساخته شده برای ساختار ماژولار جدید
 * با قابلیت یونیک کردن خودکار توابع و متغیرهای تکراری
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT_DIR = path.join(__dirname, 'dist');
const OUTPUT_FILE = process.argv[2] || 'MozPN-bundled.js';
const OBFUSCATED_FILE = process.argv[3] || 'MozPN-obfuscated.js';

// ساخت پوشه dist اگه نیست
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const fileContents = new Map();
const fileOrder = [];
const processedFiles = new Set();

// ذخیره اسامی توابع و متغیرها برای جلوگیری از تکرار
const globalIdentifiers = new Map(); // name -> count

function removeImports(content) {
    content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*/g, '');
    content = content.replace(/import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];?\s*/g, '');
    content = content.replace(/import\s+\w+\s+from\s+['"][^'"]+['"];?\s*/g, '');
    content = content.replace(/import\s+['"][^'"]+['"];?\s*/g, '');
    return content;
}

function removeExports(content) {
    content = content.replace(/export\s+(async\s+)?function\s+/g, '$1function ');
    content = content.replace(/export\s+(const|let|var)\s+/g, '$1 ');
    content = content.replace(/export\s+class\s+/g, 'class ');
    content = content.replace(/export\s*\{[^}]+\};?\s*/g, '');
    content = content.replace(/export\s+default\s+/g, 'const __default__ = ');
    return content;
}

/**
 * یونیک کردن توابع و متغیرهای تکراری در یک فایل
 * @param {string} content - محتوای فایل
 * @param {string} filePrefix - پیشوند یونیک برای فایل
 * @returns {string} - محتوای با اسامی یونیک
 */
function makeIdentifiersUnique(content, filePrefix) {
    const localRenames = new Map(); // oldName -> newName
    
    // پیدا کردن توابع (async function name, function name)
    const funcPattern = /(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    let match;
    
    while ((match = funcPattern.exec(content)) !== null) {
        const funcName = match[2];
        
        // اگه قبلاً این اسم استفاده شده، یونیکش کن
        if (globalIdentifiers.has(funcName)) {
            const count = globalIdentifiers.get(funcName) + 1;
            globalIdentifiers.set(funcName, count);
            const newName = `${funcName}_${filePrefix}`;
            localRenames.set(funcName, newName);
        } else {
            globalIdentifiers.set(funcName, 1);
        }
    }
    
    // پیدا کردن متغیرهای سطح بالا (let/const/var در ابتدای خط)
    const varPattern = /^(let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/gm;
    
    while ((match = varPattern.exec(content)) !== null) {
        const varName = match[2];
        
        if (globalIdentifiers.has(varName)) {
            const count = globalIdentifiers.get(varName) + 1;
            globalIdentifiers.set(varName, count);
            const newName = `${varName}_${filePrefix}`;
            localRenames.set(varName, newName);
        } else {
            globalIdentifiers.set(varName, 1);
        }
    }
    
    // جایگزینی اسامی تکراری
    for (const [oldName, newName] of localRenames) {
        // جایگزینی تعریف تابع
        content = content.replace(
            new RegExp(`(async\\s+)?function\\s+${oldName}\\s*\\(`, 'g'),
            `$1function ${newName}(`
        );
        
        // جایگزینی تعریف متغیر
        content = content.replace(
            new RegExp(`^(let|const|var)\\s+${oldName}\\s*=`, 'gm'),
            `$1 ${newName} =`
        );
        
        // جایگزینی استفاده‌ها (با word boundary)
        content = content.replace(
            new RegExp(`\\b${oldName}\\b(?!\\s*[:])`, 'g'),
            newName
        );
    }
    
    return content;
}

/**
 * ساخت پیشوند یونیک از مسیر فایل
 */
function getFilePrefix(filePath) {
    const relativePath = path.relative(SRC_DIR, filePath);
    // handlers/warp.js -> warp
    // services/kvStore.js -> kvStore
    const baseName = path.basename(relativePath, '.js');
    return baseName;
}

function processFile(filePath) {
    const normalizedPath = path.normalize(filePath);
    
    if (processedFiles.has(normalizedPath)) return;
    if (!fs.existsSync(normalizedPath)) {
        console.warn(`⚠️ فایل پیدا نشد: ${normalizedPath}`);
        return;
    }
    
    const content = fs.readFileSync(normalizedPath, 'utf8');
    const importMatches = content.matchAll(/import\s+(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g);
    
    for (const match of importMatches) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
            const dir = path.dirname(normalizedPath);
            let depPath = path.resolve(dir, importPath);
            if (!depPath.endsWith('.js')) depPath += '.js';
            processFile(depPath);
        }
    }
    
    processedFiles.add(normalizedPath);
    fileOrder.push(normalizedPath);
    
    let cleanContent = removeImports(content);
    cleanContent = removeExports(cleanContent);
    
    // یونیک کردن توابع و متغیرهای تکراری
    const filePrefix = getFilePrefix(normalizedPath);
    cleanContent = makeIdentifiersUnique(cleanContent, filePrefix);
    
    const relativePath = path.relative(SRC_DIR, normalizedPath);
    const header = `\n// ========== ${relativePath} ==========\n`;
    fileContents.set(normalizedPath, header + cleanContent);
}

function createBundle() {
    console.log('🔍 پیدا کردن فایل‌ها...');
    
    const workerPath = path.join(SRC_DIR, 'worker.js');
    if (!fs.existsSync(workerPath)) {
        console.error('❌ فایل worker.js پیدا نشد!');
        process.exit(1);
    }
    
    processFile(workerPath);
    
    console.log(`📁 ${fileOrder.length} فایل پیدا شد:`);
    fileOrder.forEach((f, i) => console.log(`   ${i + 1}. ${path.relative(SRC_DIR, f)}`));
    
    // نمایش تعداد توابع یونیک شده
    const renamedCount = Array.from(globalIdentifiers.values()).filter(c => c > 1).length;
    if (renamedCount > 0) {
        console.log(`\n🔄 ${renamedCount} تابع/متغیر تکراری یونیک شد`);
    }
    
    let bundle = `/**\n * MozPN - Bundled\n * Generated: ${new Date().toISOString()}\n */\n\n`;
    
    for (const filePath of fileOrder) {
        bundle += fileContents.get(filePath) + '\n';
    }
    
    bundle = bundle.replace(/const\s+__default__\s*=\s*\{/, 'export default {');
    return bundle;
}

function obfuscateCode(code) {
    console.log('🔒 Obfuscating...');
    
    const result = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        stringArray: true,
        stringArrayThreshold: 0.5,
        stringArrayEncoding: ['none'],
        rotateStringArray: true,
        renameGlobals: false,
        identifierNamesGenerator: 'hexadecimal',
        removeComments: true,
        selfDefending: false,
        debugProtection: false,
        disableConsoleOutput: false,
        deadCodeInjection: false,
        controlFlowFlattening: false,
        target: 'browser',
        sourceMap: false,
        simplify: true,
        splitStrings: false,
        transformObjectKeys: false,
        unicodeEscapeSequence: false,
        numbersToExpressions: false
    });
    
    return result.getObfuscatedCode();
}

try {
    console.log('🚀 MozPN Smart Bundler + Obfuscator\n');
    
    const bundle = createBundle();
    fs.writeFileSync(path.join(OUTPUT_DIR, OUTPUT_FILE), bundle, 'utf8');
    console.log(`\n📦 Bundle: dist/${OUTPUT_FILE}`);
    
    const obfuscated = obfuscateCode(bundle);
    fs.writeFileSync(path.join(OUTPUT_DIR, OBFUSCATED_FILE), obfuscated, 'utf8');
    
    const bundleSize = Buffer.byteLength(bundle, 'utf8');
    const obfuscatedSize = Buffer.byteLength(obfuscated, 'utf8');
    
    console.log(`🔒 Obfuscated: dist/${OBFUSCATED_FILE}`);
    console.log(`\n📊 Bundle: ${(bundleSize/1024).toFixed(2)} KB | Obfuscated: ${(obfuscatedSize/1024).toFixed(2)} KB`);
    console.log(`\n✅ تمام!`);
    
} catch (err) {
    console.error('❌ خطا:', err.message);
    process.exit(1);
}
