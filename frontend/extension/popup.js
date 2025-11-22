document.addEventListener('DOMContentLoaded', async () => { // ADD 'async' HERE
    const API_BASE = "https://s.berkk.cloud";
    
    // Elements
    const longUrlInput = document.getElementById('currentUrl');
    const shortenBtn = document.getElementById('shorten-btn');
    const resultArea = document.getElementById('result-area');
    const initialView = document.getElementById('initial-view');
    const shortUrlInput = document.getElementById('short-url');
    const qrImage = document.getElementById('qr-image');
    const copyBtn = document.getElementById('copy-btn');
    const statusMsg = document.getElementById('status-msg');

    // 1. Get Current Tab URL (FIXED: Using async/await for reliability)
    try {
        // Use the promise-based query (works in modern Chrome/Firefox MV3)
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
            longUrlInput.value = tab.url;
        }
    } catch (e) {
        // This catches permission errors or issues getting the tab
        longUrlInput.value = "Error: Permission denied or URL not supported.";
        console.error("Failed to get current tab URL:", e);
    }

    // 2. Shorten Action
    shortenBtn.addEventListener('click', async () => {
        const originalUrl = longUrlInput.value;

        if (!originalUrl || originalUrl.startsWith("Error:")) return;

        try {
            setLoading(true);

            const response = await fetch(`${API_BASE}/api/shorten`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: originalUrl
            });

            if (!response.ok) throw new Error('Network error');

            const data = await response.json();
            const fullShortUrl = `${API_BASE}/${data.shortKey}`; // Make sure API_BASE includes https://

            showResult(fullShortUrl);

        } catch (error) {
            console.error(error);
            statusMsg.textContent = "Error occurred. Please check the URL.";
            statusMsg.classList.add('error-msg');
            setLoading(false);
        }
    });

    // 3. Copy Action
    copyBtn.addEventListener('click', () => {
        shortUrlInput.select();
        navigator.clipboard.writeText(shortUrlInput.value).then(() => {
            statusMsg.textContent = "Copied to clipboard! ✨";
            statusMsg.classList.remove('error-msg');
            setTimeout(() => statusMsg.textContent = "", 2000);
        }).catch(() => {
            statusMsg.textContent = "Failed to copy.";
            statusMsg.classList.add('error-msg');
        });
    });

    // Helpers
    function setLoading(isLoading) {
        if (isLoading) {
            shortenBtn.textContent = "Processing...";
            shortenBtn.disabled = true;
        } else {
            shortenBtn.textContent = "🚀 Shorten & QR";
            shortenBtn.disabled = false;
        }
    }

    function showResult(url) {
        initialView.classList.add('hidden');
        resultArea.classList.remove('hidden');
        shortUrlInput.value = url;
        
        // Generate QR using external API
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}&bgcolor=ffffff`;
    }
});