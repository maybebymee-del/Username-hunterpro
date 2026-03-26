// متغيرات عامة
let generatedUsernames = [];
let scanStartTime = 0;

// عناصر DOM
const generateBtn = document.getElementById('generateBtn');
const resultsDiv = document.getElementById('results');
const totalGeneratedSpan = document.getElementById('totalGenerated');
const totalAvailableSpan = document.getElementById('totalAvailable');
const scanTimeSpan = document.getElementById('scanTime');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const showOnlyAvailableCheckbox = document.getElementById('showOnlyAvailable');
const autoCopyCheckbox = document.getElementById('autoCopy');

/**
 * فحص توفر اليوزر (محاكاة ذكية)
 */
async function checkAvailability(username) {
    await new Promise(resolve => setTimeout(resolve, 30));
    
    const length = username.length;
    let availableChance;
    
    switch(length) {
        case 3: availableChance = 0.05; break;
        case 4: availableChance = 0.10; break;
        case 5: availableChance = 0.25; break;
        default: availableChance = 0.40;
    }
    
    const isAvailable = Math.random() < availableChance;
    
    return {
        available: isAvailable,
        message: isAvailable ? '✅ متاح' : '❌ محجوز'
    };
}

/**
 * توليد يوزرات عشوائية
 */
function generateUsernames(chars, count, length) {
    const usernames = [];
    const charArray = chars.split('');
    
    for (let i = 0; i < count; i++) {
        let username = '';
        for (let j = 0; j < length; j++) {
            username += charArray[Math.floor(Math.random() * charArray.length)];
        }
        usernames.push(username);
    }
    
    return [...new Set(usernames)];
}

/**
 * نسخ النص إلى الحافظة
 */
async function copyToClipboard(text, element) {
    try {
        await navigator.clipboard.writeText(text);
        
        // تغيير شكل الزر مؤقتاً
        const originalHtml = element.innerHTML;
        element.innerHTML = '<i class="fas fa-check"></i> تم';
        element.style.background = '#00ff88';
        element.style.color = '#000';
        
        setTimeout(() => {
            element.innerHTML = originalHtml;
            element.style.background = '';
            element.style.color = '';
        }, 1500);
        
        // إشعار منبثق
        const notification = document.createElement('div');
        notification.textContent = `📋 تم نسخ: @${text}`;
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #00ff88, #00cc66);
            color: #000;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: bold;
            z-index: 10000;
            animation: fadeOut 2s forwards;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            font-family: monospace;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
        
    } catch(err) {
        alert(`✨ انسخ هذا اليوزر: ${text}`);
    }
}

/**
 * عرض النتائج مع زر نسخ لكل يوزر
 */
function displayResults(usernamesData) {
    const showOnlyAvailable = showOnlyAvailableCheckbox.checked;
    let filteredData = usernamesData;
    
    if (showOnlyAvailable) {
        filteredData = usernamesData.filter(u => u.available);
    }
    
    const resultCountSpan = document.getElementById('resultCount');
    if (resultCountSpan) {
        resultCountSpan.textContent = `(${filteredData.length})`;
    }
    
    if (filteredData.length === 0) {
        resultsDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sad-tear"></i>
                <p>لا توجد نتائج ${showOnlyAvailable ? 'متاحة' : ''}</p>
                <small>جرب تغيير الإعدادات أو زيادة عدد اليوزرات</small>
            </div>
        `;
        return;
    }
    
    resultsDiv.innerHTML = filteredData.map(item => `
        <div class="username-card ${item.available ? 'available' : 'unavailable'}">
            <div class="username-info">
                <span class="username">${item.username}</span>
                <span class="status">
                    <i class="fas ${item.available ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${item.available ? 'متاح' : 'محجوز'}
                </span>
            </div>
            <button class="copy-btn" onclick="copyToClipboard('${item.username}', this)">
                <i class="fas fa-copy"></i> نسخ
            </button>
        </div>
    `).join('');
}

/**
 * تصدير اليوزرات المتاحة
 */
function exportResults() {
    const availableUsernames = generatedUsernames.filter(u => u.available);
    
    if (availableUsernames.length === 0) {
        alert('⚠️ لا توجد يوزرات متاحة للتصدير!');
        return;
    }
    
    const text = availableUsernames.map(u => u.username).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usernames_available_${new Date().toISOString().slice(0,19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`✅ تم تصدير ${availableUsernames.length} يوزر متاح`);
}

/**
 * مسح النتائج
 */
function clearResults() {
    generatedUsernames = [];
    totalGeneratedSpan.textContent = '0';
    totalAvailableSpan.textContent = '0';
    scanTimeSpan.textContent = '0';
    
    resultsDiv.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <p>اضغط على "بدء التوليد" لبدء الفحص</p>
            <small>سيظهر باللون الأخضر ✅ المتاح | باللون الأحمر ❌ المحجوز</small>
        </div>
    `;
    
    const resultCountSpan = document.getElementById('resultCount');
    if (resultCountSpan) resultCountSpan.textContent = '';
}

/**
 * الوظيفة الرئيسية
 */
generateBtn.addEventListener('click', async () => {
    const chars = document.getElementById('chars').value;
    const count = parseInt(document.getElementById('count').value);
    const length = parseInt(document.getElementById('length').value);
    
    if (!chars || chars.length === 0) {
        alert('⚠️ الرجاء إدخال الأحرف المسموحة');
        return;
    }
    
    if (count < 1 || count > 500) {
        alert('⚠️ عدد اليوزرات يجب أن يكون بين 1 و 500');
        return;
    }
    
    generateBtn.disabled = true;
    const originalBtnText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الفحص التلقائي...';
    
    const usernames = generateUsernames(chars, count, length);
    totalGeneratedSpan.textContent = usernames.length;
    
    const results = [];
    scanStartTime = Date.now();
    
    for (let i = 0; i < usernames.length; i++) {
        const status = await checkAvailability(usernames[i]);
        results.push({
            username: usernames[i],
            available: status.available,
            message: status.message
        });
        
        if (i % 10 === 0 || i === usernames.length - 1) {
            generatedUsernames = results;
            const availableCount = results.filter(r => r.available).length;
            totalAvailableSpan.textContent = availableCount;
            displayResults(results);
        }
    }
    
    const scanTime = ((Date.now() - scanStartTime) / 1000).toFixed(1);
    scanTimeSpan.textContent = scanTime;
    
    generateBtn.disabled = false;
    generateBtn.innerHTML = originalBtnText;
    
    const availableCount = results.filter(r => r.available).length;
    if (availableCount > 0) {
        alert(`🎉 اكتمل الفحص!\n✅ ${availableCount} يوزر متاح من أصل ${usernames.length}\n⏱️ ${scanTime} ثانية`);
    } else {
        alert(`⚠️ لم يتم العثور على يوزرات متاحة.\n💡 جرب تغيير الأحرف أو تقليل طول اليوزر`);
    }
});

// إضافة مستمعي الأحداث
exportBtn.addEventListener('click', exportResults);
clearBtn.addEventListener('click', clearResults);
showOnlyAvailableCheckbox.addEventListener('change', () => displayResults(generatedUsernames));