document.addEventListener('DOMContentLoaded', () => {
    // === Seleksi Elemen DOM ===
    const apiKeyModal = document.getElementById('apiKeyModal');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const apiKeyError = document.getElementById('apiKeyError');
    const cancelApiKeyBtn = document.getElementById('cancelApiKeyBtn');

    const appContainer = document.getElementById('appContainer'); // Kontainer utama untuk Generator dan History
    const generatorContent = document.getElementById('generatorContent'); // Konten Generator (form dan hasil)
    const historyContent = document.getElementById('historyContent'); // Konten History
    const historyList = document.getElementById('historyList'); // Tempat daftar riwayat

    const loadingOverlay = document.getElementById('loadingOverlay');
    const settingsBtn = document.getElementById('settingsBtn');

    // Navigasi Tabs
    const generatorTabBtn = document.getElementById('generatorTabBtn');
    const historyTabBtn = document.getElementById('historyTabBtn');

    const generatePromptBtn = document.getElementById('generatePromptBtn');
    const promptOutput = document.getElementById('promptOutput');
    const indonesianPromptTextArea = document.getElementById('indonesianPrompt');
    const englishPromptTextArea = document.getElementById('englishPrompt');
    const copyEnglishPromptBtn = document.getElementById('copyEnglishPromptBtn');
    const copyIndonesianPromptBtn = document.getElementById('copyIndonesianPromptBtn');

    const subjectInput = document.getElementById('subject');
    const actionInput = document.getElementById('action');
    const expressionInput = document = document.getElementById('expression');
    const placeInput = document.getElementById('place');
    const timeSelect = document.getElementById('time');
    const cameraMovementSelect = document.getElementById('cameraMovement');
    const lightingSelect = document.getElementById('lighting');
    const videoStyleSelect = document.getElementById('videoStyle');
    const videoMoodSelect = document.getElementById('videoMood');
    const soundMusicInput = document.getElementById('soundMusic');
    const spokenSentenceInput = document.getElementById('spokenSentence');
    const additionalDetailsInput = document.getElementById('additionalDetails');

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=`;
    const HISTORY_KEY = 'veo3_prompt_history'; // Kunci untuk localStorage history

    // --- Elemen Footer (untuk update tahun) ---
    const currentYearSpan = document.getElementById('currentYear');


    // --- Inisialisasi Awal: Pastikan semua elemen UI dalam kondisi tersembunyi yang benar ---
    loadingOverlay.classList.add('hidden');
    loadingOverlay.classList.remove('active');
    apiKeyModal.classList.add('hidden');
    apiKeyModal.classList.remove('open');
    generatorContent.classList.add('hidden'); // Sembunyikan konten generator
    historyContent.classList.add('hidden'); // Sembunyikan konten history
    cancelApiKeyBtn.classList.add('hidden');
    console.log('DOM Content Loaded: Semua elemen UI diinisialisasi sebagai tersembunyi.');


    /**
     * Fungsi untuk menampilkan atau menyembunyikan overlay loading.
     * @param {boolean} show - Jika `true`, overlay ditampilkan; jika `false`, disembunyikan.
     */
    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.remove('hidden');
            loadingOverlay.classList.add('active');
            console.log('Loading overlay DITAMPILKAN (aktif).');
        } else {
            loadingOverlay.classList.remove('active');
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                console.log('Loading overlay DISEMBUYIKAN (tersembunyi total).');
            }, 300);
        }
    }

    /**
     * Fungsi untuk menampilkan atau menyembunyikan modal API Key.
     * Mengelola visibilitas tombol "Batal" dan konten utama.
     * @param {boolean} show - `true` untuk menampilkan modal, `false` untuk menyembunyikan.
     * @param {boolean} [fromSettings=false] - `true` jika modal dibuka dari tombol Settings, `false` jika dari awal aplikasi.
     */
    function toggleApiKeyModal(show, fromSettings = false) {
        if (show) {
            apiKeyModal.classList.remove('hidden');
            apiKeyModal.classList.add('open');
            // Sembunyikan semua konten aplikasi di belakang modal
            generatorContent.classList.add('hidden');
            historyContent.classList.add('hidden');

            const currentApiKey = localStorage.getItem('geminiApiKey');
            geminiApiKeyInput.value = currentApiKey || '';
            apiKeyError.classList.add('hidden');

            if (fromSettings) {
                cancelApiKeyBtn.classList.remove('hidden');
                console.log('Modal API Key ditampilkan dari Settings, tombol Batal terlihat.');
            } else {
                cancelApiKeyBtn.classList.add('hidden');
                console.log('Modal API Key ditampilkan di awal load, tombol Batal tersembunyi.');
            }
        } else { // Jika `show` adalah `false` (sembunyikan modal)
            apiKeyModal.classList.remove('open');
            setTimeout(() => {
                apiKeyModal.classList.add('hidden');
                if (localStorage.getItem('geminiApiKey')) {
                    // Tampilkan kembali konten generator jika API Key valid
                    generatorContent.classList.remove('hidden');
                    // Aktifkan tab generator secara visual
                    generatorTabBtn.classList.add('active');
                    historyTabBtn.classList.remove('active');
                    console.log('Modal API Key disembunyikan. Konten generator ditampilkan kembali.');
                } else {
                    // Jika API Key tidak ada/tidak valid, biarkan modal tetap terlihat (tidak bisa ditutup)
                    apiKeyModal.classList.remove('hidden');
                    apiKeyModal.classList.add('open');
                    cancelApiKeyBtn.classList.add('hidden');
                    apiKeyError.textContent = "API Key diperlukan untuk melanjutkan.";
                    apiKeyError.classList.remove('hidden');
                    console.log('API Key tidak valid/kosong. Modal tetap terbuka.');
                    return; // Hentikan eksekusi selanjutnya untuk mencegah penutupan
                }
            }, 300);
        }
    }

    /**
     * Fungsi untuk memeriksa API Key saat aplikasi pertama kali dimuat.
     * Menampilkan modal API Key jika tidak ada, atau konten generator jika ada.
     */
    async function checkInitialApiKey() {
        let apiKey = localStorage.getItem('geminiApiKey');
        if (!apiKey) {
            toggleApiKeyModal(true, false);
        } else {
            generatorContent.classList.remove('hidden'); // Tampilkan konten generator
            generatorTabBtn.classList.add('active'); // Aktifkan tab generator
            console.log('API Key ditemukan di local storage.');
        }
    }

    /**
     * Fungsi helper untuk mengambil nilai dari elemen input dan memformatnya.
     * Mengembalikan string kosong jika input kosong.
     */
    function getInputValue(element, prefix = '', suffix = '') {
        const value = element.value.trim();
        return value ? `${prefix}${value}${suffix}` : '';
    }

    /**
     * Fungsi untuk membuat prompt dasar dalam Bahasa Indonesia dari semua input form.
     */
    function createBaseIndonesianPrompt() {
        const subject = getInputValue(subjectInput);
        const action = getInputValue(actionInput);
        const expression = getInputValue(expressionInput, ' dengan ekspresi ');
        const place = getInputValue(placeInput, ' di ');
        const time = getInputValue(timeSelect, ' pada ');
        const cameraMovement = getInputValue(cameraMovementSelect, ' gerakan kamera: ');
        const lighting = getInputValue(lightingSelect, ' pencahayaan: ');
        const videoStyle = getInputValue(videoStyleSelect, ' gaya video: ');
        const videoMood = getInputValue(videoMoodSelect, ' suasana: ');
        const soundMusic = getInputValue(soundMusicInput, ' suara/musik: ');
        const spokenSentence = getInputValue(spokenSentenceInput, ' kalimat yang diucapkan: "');
        const additionalDetails = getInputValue(additionalDetailsInput, ' detail tambahan: ');

        let prompt = `Buat video dengan subjek ${subject}`;
        if (action) prompt += ` ${action}`;
        if (expression) prompt += expression;
        if (place) prompt += place;
        if (time) prompt += time;

        let details = [cameraMovement, lighting, videoStyle, videoMood, soundMusic, additionalDetails]
            .filter(Boolean)
            .join(', ');

        if (details) prompt += `. ${details}.`;
        if (spokenSentence) prompt += `${spokenSentence}"`;

        return prompt;
    }

    /**
     * Fungsi asinkron utama untuk memicu pembuatan prompt via Gemini API.
     */
    async function generatePrompt() {
        showLoading(true);
        console.log('Generate Prompt: Memulai proses...');

        const baseIndonesianPrompt = createBaseIndonesianPrompt();
        const spokenSentenceText = spokenSentenceInput.value.trim();

        if (!baseIndonesianPrompt.replace(/[^a-zA-Z0-9 ]/g, '').trim()) {
            alert("Mohon isi setidaknya beberapa kolom (Subjek, Aksi, dll.) untuk membuat prompt yang berarti.");
            showLoading(false);
            console.log('Generate Prompt: Validasi gagal, prompt kosong.');
            return;
        }

        let chatHistory = [];
        chatHistory.push({
            role: "user",
            parts: [{
                text: `Kembangkan prompt video berikut dalam Bahasa Indonesia agar lebih detail dan sinematik. Setelah itu, terjemahkan prompt yang sudah dikembangkan tersebut ke Bahasa Inggris. Pastikan untuk menjaga 'kalimat yang diucapkan' tetap dalam Bahasa aslinya (Indonesia atau apa pun yang diinput).
                Format respons harus JSON dengan dua properti: "indonesianPrompt" dan "englishPrompt".
                
                Prompt dasar: "${baseIndonesianPrompt}"
                `
            }]
        });

        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "indonesianPrompt": {
                            "type": "STRING"
                        },
                        "englishPrompt": {
                            "type": "STRING"
                        }
                    },
                    "propertyOrdering": ["indonesianPrompt", "englishPrompt"]
                }
            }
        };

        const apiKey = localStorage.getItem('geminiApiKey') || "";
        console.log('Generate Prompt: Memanggil Gemini API...');

        try {
            const response = await fetch(`${API_URL}${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API error:", errorData);
                alert(`Gagal membuat prompt. Error: ${errorData.error?.message || response.statusText}. Pastikan API Key Anda benar.`);
                return;
            }

            const result = await response.json();
            console.log('Generate Prompt: Respon API diterima.', result);

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const jsonText = result.candidates[0].content.parts[0].text;
                let parsedJson;
                try {
                    parsedJson = JSON.parse(jsonText);
                    console.log('Generate Prompt: JSON berhasil di-parse.', parsedJson);
                } catch (parseError) {
                    console.error("Gagal memparsing JSON dari respons API:", parseError);
                    alert("Terjadi kesalahan dalam memproses respons dari AI. Format data tidak sesuai.");
                    return;
                }

                let finalEnglishPrompt = parsedJson.englishPrompt;
                if (spokenSentenceText) {
                    if (!finalEnglishPrompt.includes(spokenSentenceText)) {
                        finalEnglishPrompt += ` Spoken sentence: "${spokenSentenceText}"`;
                    }
                }

                indonesianPromptTextArea.value = parsedJson.indonesianPrompt || "";
                englishPromptTextArea.value = finalEnglishPrompt || "";
                promptOutput.classList.remove('hidden');
                console.log('Generate Prompt: Output prompt diperbarui.');

                // --- Simpan prompt ke history ---
                savePromptToHistory(parsedJson.indonesianPrompt || "", finalEnglishPrompt || "");

            } else {
                alert("Gagal membuat prompt. Respons AI tidak lengkap atau tidak valid.");
                console.warn('Generate Prompt: Respons AI tidak lengkap/valid.');
            }
        } catch (error) {
            console.error("Kesalahan saat membuat prompt:", error);
            alert("Terjadi kesalahan saat berkomunikasi dengan Gemini API. Pastikan API Key Anda benar dan koneksi internet stabil.");
        } finally {
            showLoading(false);
            console.log('Generate Prompt: Proses selesai, loading disembunyikan.');
        }
    }

    /**
     * Fungsi untuk menyalin teks dari sumber yang diberikan ke clipboard.
     * Dapat menerima elemen textarea atau string. Akan menampilkan alert jika kosong.
     * @param {HTMLTextAreaElement | string} source - Elemen textarea atau string teks yang akan disalin.
     * @param {string} promptType - Tipe prompt (e.g., "Bahasa Inggris", "Bahasa Indonesia", "History") untuk pesan alert.
     */
    function copyPromptToClipboard(source, promptType) {
        let textToCopy;
        if (typeof source === 'string') {
            textToCopy = source;
        } else if (source instanceof HTMLTextAreaElement) {
            textToCopy = source.value.trim();
        } else {
            alert("Sumber tidak valid untuk disalin.");
            return;
        }

        if (textToCopy === '') {
            alert(`Prompt ${promptType} kosong, tidak ada yang bisa disalin.`);
            return;
        }

        // Buat elemen textarea sementara untuk menyalin teks
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = textToCopy;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        tempTextArea.setSelectionRange(0, 99999); /* Untuk perangkat seluler */

        try {
            const successful = document.execCommand('copy');
            const msg = successful ? 'Berhasil disalin!' : 'Gagal menyalin.';
            alert(msg);
            console.log(`Copy ${promptType} Prompt:`, msg);
        } catch (err) {
            console.error(`Gagal menyalin teks (${promptType}): `, err);
            alert(`Gagal menyalin prompt ${promptType}. Browser Anda mungkin tidak mendukung fitur ini.`);
        } finally {
            document.body.removeChild(tempTextArea); // Hapus elemen sementara
        }
    }

    /**
     * Menyimpan prompt yang dihasilkan ke localStorage.
     * @param {string} indonesianPrompt - Prompt dalam Bahasa Indonesia.
     * @param {string} englishPrompt - Prompt dalam Bahasa Inggris.
     */
    function savePromptToHistory(indonesianPrompt, englishPrompt) {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const newEntry = {
            id: Date.now(), // ID unik berdasarkan timestamp
            date: new Date().toLocaleString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            indonesian: indonesianPrompt,
            english: englishPrompt
        };
        history.unshift(newEntry); // Tambahkan ke awal array (terbaru di atas)
        if (history.length > 50) { // Batasi jumlah history agar tidak terlalu besar
            history = history.slice(0, 50);
        }
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        console.log('Prompt disimpan ke history.');
    }

    /**
     * Memuat dan menampilkan daftar prompt dari history.
     */
    function displayHistory() {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        historyList.innerHTML = ''; // Bersihkan daftar sebelumnya

        if (history.length === 0) {
            historyList.innerHTML = '<p class="empty-message" id="emptyHistoryMessage">Riwayat prompt masih kosong.</p>';
            return;
        }

        history.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');

            historyItem.innerHTML = `
                <div class="history-item-header">
                    <p class="history-item-date">${entry.date}</p>
                    <button class="copy-history-prompt-btn"
                            data-prompt="${encodeURIComponent(entry.english)}">Copy</button>
                </div>
                <p class="history-item-prompt-text">${entry.english}</p>
            `;
            historyList.appendChild(historyItem);
        });

        historyList.querySelectorAll('.copy-history-prompt-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const promptToCopy = decodeURIComponent(event.target.dataset.prompt);
                copyPromptToClipboard(promptToCopy, 'History');
            });
        });
        console.log('History ditampilkan.');
    }

    /**
     * Mengganti tampilan antara Generator dan History.
     * @param {string} view - 'generator' atau 'history'.
     */
    function switchView(view) {
        if (view === 'generator') {
            generatorContent.classList.remove('hidden');
            historyContent.classList.add('hidden');
            generatorTabBtn.classList.add('active');
            historyTabBtn.classList.remove('active');
            console.log('Beralih ke tampilan Generator.');
        } else if (view === 'history') {
            generatorContent.classList.add('hidden');
            historyContent.classList.remove('hidden');
            generatorTabBtn.classList.remove('active');
            historyTabBtn.classList.add('active');
            displayHistory(); // Muat dan tampilkan history saat beralih ke tab history
            console.log('Beralih ke tampilan History.');
        }
    }


    // === Event Listeners ===
    saveApiKeyBtn.addEventListener('click', async () => {
        const inputKey = geminiApiKeyInput.value.trim();
        if (inputKey) {
            if (inputKey.startsWith('AIza')) {
                localStorage.setItem('geminiApiKey', inputKey);
                toggleApiKeyModal(false); // Sembunyikan modal HANYA jika API Key valid
                console.log('API Key disimpan via tombol Simpan.');
            } else {
                apiKeyError.textContent = "API Key tidak valid. Pastikan dimulai dengan 'AIza'.";
                apiKeyError.classList.remove('hidden');
                console.log('API Key tidak valid saat disimpan.');
            }
        } else {
            apiKeyError.textContent = "Mohon masukkan API Key Gemini Anda.";
            apiKeyError.classList.remove('hidden');
            console.log('API Key kosong saat disimpan.');
        }
    });

    generatePromptBtn.addEventListener('click', generatePrompt);

    copyEnglishPromptBtn.addEventListener('click', () => {
        copyPromptToClipboard(englishPromptTextArea, 'Bahasa Inggris');
    });

    copyIndonesianPromptBtn.addEventListener('click', () => {
        copyPromptToClipboard(indonesianPromptTextArea, 'Bahasa Indonesia');
    });

    settingsBtn.addEventListener('click', () => {
        toggleApiKeyModal(true, true);
        console.log('Settings button clicked.');
    });

    cancelApiKeyBtn.addEventListener('click', () => {
        if (localStorage.getItem('geminiApiKey')) {
            toggleApiKeyModal(false);
            console.log('API Key modal dibatalkan (API Key sudah ada).');
        } else {
            apiKeyError.textContent = "API Key diperlukan untuk melanjutkan.";
            apiKeyError.classList.remove('hidden');
            console.log('API Key modal dibatalkan (API Key kosong), modal tetap terbuka.');
        }
    });

    // Navigasi Tab Event Listeners
    generatorTabBtn.addEventListener('click', () => switchView('generator'));
    historyTabBtn.addEventListener('click', () => switchView('history'));


    // === Inisialisasi Aplikasi ===
    // Update tahun saat ini di footer
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    
    checkInitialApiKey();
});
