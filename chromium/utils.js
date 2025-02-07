export function sendMessageToNativeHost(message) {
    return new Promise((resolve, reject) => {
        let port = chrome.runtime.connectNative('com.neosubhamoy.pytubepp.helper');
        
        port.onMessage.addListener(function(response) {
            console.log('Received from native host:', response);
            if (response.status === 'success') {
                resolve(response.response);
            } else if (response.status === 'error') {
                reject(new Error(response.message));
            }
        });

        port.onDisconnect.addListener(function() {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            }
        });

        port.postMessage(message);
    });
}

export function storeData(data) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(data, function() {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

export function formatResString(resolution) {
    if (resolution === '4320p') return 'eightk';
    if (resolution === '2160p') return 'fourk';
    if (resolution === '1440p') return 'twok';
    if (resolution === '1080p') return 'fhd';
    if (resolution === '720p') return 'hd';
    if (resolution === '480p') return 'sd';
    if (resolution === '360p') return 'sd';
    if (resolution === '240p') return 'ld';
    if (resolution === '144p') return 'ld';
    if (resolution === 'mp3') return 'audio';
    return resolution;
}

export function injectBeforeContent(selector, newContent) {
    const styleSheet = document.styleSheets[0];
    const rules = styleSheet.cssRules || styleSheet.rules;

    for (let i = 0; i < rules.length; i++) {
        if (rules[i].selectorText === selector + '::before') {
            rules[i].style.content = `"${newContent}"`;
            break;
        }
    }
}

export function formatSecondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');

    if (hours > 0) {
        const formattedHours = String(hours).padStart(2, '0');
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    } else {
        return `${formattedMinutes}:${formattedSeconds}`;
    }
}

export function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const fileSize = (bytes / Math.pow(1024, i)).toFixed(2);
    return `${fileSize} ${sizes[i]}`;
}

export function formatMimeType(mimeType) {
    if (mimeType.includes('/')) {
        return mimeType.split('/')[1];
    } else {
        return null;
    }
}

export function downloadPopup(title, author, stream, captions) {
    const popup = document.getElementById('popup');
    popup.innerHTML = `
    <div class="popupcontent">
        <h3>Are you sure ?</h3>
        <p>You want to download <strong>${title}</strong> by <strong>${author}</strong> in the following format:</p>
        <ul class="popuplist">
            ${stream.res !== 'mp3' ? `
            <li>
                <svg class="popuplisticon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-film"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>
                <strong>Resolution:</strong> ${stream.res} ${stream.fps}fps ${stream.is_hdr ? 'HDR' : ''}
            </li>
            ` : `
            <li>
                <svg class="popuplisticon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-music"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                <strong>Bitrate:</strong> ${stream.abitrate}
            </li>
            `}
            <li>
                ${stream.res !== 'mp3' ? `
                    <svg class="popuplisticon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-video"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 11 5 3-5 3v-6Z"/></svg>
                ` : `
                    <svg class="popuplisticon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-audio-2"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v2"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><circle cx="3" cy="17" r="1"/><path d="M2 17v-3a4 4 0 0 1 8 0v3"/><circle cx="9" cy="17" r="1"/></svg>
                `}
                <strong>FileFormat:</strong> ${stream.mime_type}
            </li>
            <li>
                <svg class="popuplisticon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-download"><path d="M12 13v8l-4-4"/><path d="m12 21 4-4"/><path d="M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284"/></svg>
                <strong>FileSize:</strong> ${formatFileSize(stream.file_size)}
            </li>
        </ul>
        <p>${stream.res === 'mp3' ? ('Cannot embed caption in mp3') : (captions ? 'Select a caption track to embed:' : 'Caption not available')}</p>
        <select class="captions" id="captions" ${stream.res === 'mp3' || !captions ? 'disabled' : ''}>
            <option class="captionitem" value="none" selected>No Caption</option>
            ${captions?.map(caption => `<option class="captionitem" value="${caption.code}">${caption.lang}</option>`).join('')}
        </select>
        <div class="popupbtns">
            <button id="cancelbtn" class="cancelbtn">Cancel</button>
            <button id="okbtn" class="okbtn">OK</button>
        </div>
    </div>
    `;
    popup.style.display = 'flex';
    
    return new Promise((resolve) => {
        const okButton = document.getElementById('okbtn');
        const cancelButton = document.getElementById('cancelbtn');
        const captionsSelect = document.getElementById('captions');

        okButton.addEventListener('click', () => {
            popup.style.display = 'none';
            resolve({
                confirmed: true,
                caption: captionsSelect.value
            });
        });

        cancelButton.addEventListener('click', () => {
            popup.style.display = 'none';
            resolve({
                confirmed: false,
                caption: null
            });
        });
    });
}

export function showSpinner(text) {
    const popup = document.getElementById('popup');
    popup.innerHTML = text ? `
    <div class="spinner">
        <svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
        <p>${text}...</p>
    </div>
    `:
    `
    <div class="spinner">
        <svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
    </div>
    `;
    popup.style.display = 'flex';
}

export function hideSpinner() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}