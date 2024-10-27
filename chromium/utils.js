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

export function confirmPopup(heading, message) {
    const popup = document.getElementById('popup');
    popup.innerHTML = `
    <div class="popupcontent">
        <h3>${heading}</h3>
        <p>${message}</p>
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

        okButton.addEventListener('click', () => {
            popup.style.display = 'none';
            resolve(true);
        });

        cancelButton.addEventListener('click', () => {
            popup.style.display = 'none';
            resolve(false);
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