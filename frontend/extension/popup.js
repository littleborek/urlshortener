// Localization strings
const translations = {
    en: {
        urlLabel: "Current URL",
        slugBtn: "Custom Slug?",
        slugLabel: "Custom Slug (Max 15)",
        copyBtn: "Copy Link",
        btnText: "Shorten & Create QR",
        processing: "Processing...",
        errorMsg: "Error occurred. Check URL.",
        langBtn: "TR"
    },
    tr: {
        urlLabel: "Mevcut URL",
        slugBtn: "Özel Bağlantı?",
        slugLabel: "Özel Bağlantı (Max 15)",
        copyBtn: "Kopyala",
        btnText: "Kısalt ve QR Oluştur",
        processing: "İşleniyor...",
        errorMsg: "Hata oluştu. URL'yi kontrol edin.",
        langBtn: "EN"
    }
};

let currentLang = 'en';

// Helper function to apply translations
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    document.getElementById('currentUrlLabel').textContent = t.urlLabel;
    document.getElementById('shortenBtn').textContent = `🚀 ${t.btnText}`;
    document.getElementById('copyBtn').textContent = t.copyBtn;
    document.getElementById('customSlugLabel').textContent = t.slugLabel;

    // Update slug toggle button text
    const toggleBtn = document.getElementById('toggleSlugBtn');
    if (toggleBtn) {
        toggleBtn.textContent = document.getElementById('customSlugContainer').classList.contains('hidden') 
            ? t.slugBtn 
            : (lang === 'en' ? 'Hide Slug' : 'Linki Gizle');
    }

    // Update language button text
    const nextLang = lang === 'en' ? 'tr' : 'en';
    document.getElementById('currentLangFlag').textContent = nextLang === 'en' ? '🇬🇧' : '🇹🇷';
    document.getElementById('currentLangText').textContent = nextLang.toUpperCase();
}


document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = "https://s.berkk.cloud";
    const SHORT_LINK = "s.berkk.cloud";

    
    // Element Definitions
    const longUrlInput = document.getElementById('currentUrl');
    const customSlugInput = document.getElementById('customSlugInput');
    const toggleSlugBtn = document.getElementById('toggleSlugBtn');
    const customSlugContainer = document.getElementById('customSlugContainer');
    const shortenBtn = document.getElementById('shortenBtn');
    const resultArea = document.getElementById('result-area');
    const initialView = document.getElementById('main');
    const shortUrlInput = document.getElementById('shortUrl');
    const qrcodeDiv = document.getElementById('qrcode');
    const statusMsg = document.getElementById('message');
    const langBtn = document.getElementById('langBtn');

    // Initialize language
    setLanguage('en'); 
    
    // Language button binding
    langBtn.addEventListener('click', () => {
        const newLang = currentLang === 'en' ? 'tr' : 'en';
        setLanguage(newLang);
    });

    // Custom Slug Toggle Logic
    toggleSlugBtn.addEventListener('click', () => {
        customSlugContainer.classList.toggle('hidden');
        const isHidden = customSlugContainer.classList.contains('hidden');
        const t = translations[currentLang];

        if (isHidden) {
            toggleSlugBtn.textContent = t.slugBtn;
            customSlugInput.value = ''; // Clear input when hiding
        } else {
            toggleSlugBtn.textContent = (currentLang === 'en' ? 'Hide Slug' : 'Linki Gizle');
        }
    });

    // 1. Get Current Tab URL using async/await
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
            longUrlInput.value = tab.url;
        }
    } catch (e) {
        longUrlInput.value = "Error: Permission denied or URL not supported.";
        console.error("Failed to get current tab URL:", e);
    }
    
    // 2. Shorten Action (POST JSON Payload)
    shortenBtn.addEventListener('click', async () => {
        const originalUrl = longUrlInput.value;
        
        // Determine custom slug based on container visibility
        const customSlug = customSlugContainer.classList.contains('hidden') 
                           ? null 
                           : (customSlugInput.value.trim() || null); 

        if (!originalUrl || originalUrl.startsWith("Error:")) return;

        try {
            setLoading(true);

            // Construct JSON payload
            const payload = {
                longUrl: originalUrl,
                customSlug: customSlug
            };

            const response = await fetch(`${API_BASE}/api/shorten`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Check for 409 Conflict error message
                if (response.status === 409) {
                    throw new Error(errorText); 
                }
                throw new Error('Network error');
            }

            const data = await response.json();
            const fullShortUrl = `${SHORT_LINK}/${data.shortKey}`;

            showResult(fullShortUrl);

        } catch (error) {
            console.error(error);
            statusMsg.innerText = error.message.startsWith('Network') ? "API Error. Check connection." : error.message;
            statusMsg.classList.add("error-msg");
            setLoading(false);
        }
    });

    // 3. Copy Action
    document.getElementById('copyBtn').addEventListener('click', () => {
        shortUrlInput.select();
        navigator.clipboard.writeText(shortUrlInput.value).then(() => {
            statusMsg.innerText = "Copied to clipboard! ✨";
            statusMsg.classList.remove("error-msg");
            setTimeout(() => statusMsg.innerText = "", 2000);
        }).catch(() => {
             statusMsg.innerText = "Failed to copy.";
             statusMsg.classList.add("error-msg");
        });
    });
    
    // Helper: UI loading state management
    function setLoading(isLoading) {
        if (isLoading) {
            shortenBtn.textContent = translations[currentLang].processing;
            shortenBtn.disabled = true;
        } else {
            shortenBtn.textContent = `🚀 ${translations[currentLang].btnText}`;
            shortenBtn.disabled = false;
        }
    }

    // Helper: Display results and QR code
    function showResult(url) {
        initialView.classList.add('hidden');
        resultArea.classList.remove('hidden');
        shortUrlInput.value = url;
        
        qrcodeDiv.innerHTML = "";
        new QRCode(qrcodeDiv, {
            text: url,
            width: 128,
            height: 128
        });
    }
});