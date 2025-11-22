document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'https://edge-shortener-api.onrender.com';
    const shortenBtn = document.getElementById('shortenBtn');
    const urlInput = document.getElementById('currentUrl');
    const resultDiv = document.getElementById('result');
    const shortUrlInput = document.getElementById('shortUrl');
    const qrcodeDiv = document.getElementById('qrcode');
    const message = document.getElementById('message');


    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    urlInput.value = tab.url;


    shortenBtn.addEventListener('click', async () => {
        try {
            shortenBtn.disabled = true;
            shortenBtn.innerText = "İşleniyor...";
            message.innerText = "";

            const response = await fetch(`${API_BASE_URL}/api/shorten`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: tab.url
            });

            if (!response.ok) throw new Error('API Hatası');

            const data = await response.json();
            const fullShortUrl = `${API_BASE_URL}/r/${data.shortKey}`;

 
            shortUrlInput.value = fullShortUrl;
            

            qrcodeDiv.innerHTML = "";
            new QRCode(qrcodeDiv, {
                text: fullShortUrl,
                width: 128,
                height: 128
            });

            resultDiv.classList.remove('hidden');
            document.getElementById('main').classList.add('hidden');

        } catch (error) {
            console.error(error);
            message.innerText = "Hata oluştu. API çalışıyor mu?";
            message.classList.add("error");
        } finally {
            shortenBtn.disabled = false;
            shortenBtn.innerText = "🚀 Kısalt ve QR Oluştur";
        }
    });

    document.getElementById('copyBtn').addEventListener('click', () => {
        shortUrlInput.select();
        document.execCommand('copy');
        message.innerText = "Panoya kopyalandı! ✨";
        message.classList.remove("error");
        setTimeout(() => message.innerText = "", 2000);
    });
});