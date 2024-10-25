function sendMessageToNativeHost(message) {
    return new Promise(function(resolve, reject) {
        var port = browser.runtime.connectNative('com.neosubhamoy.pytubepp.helper');
        
        port.onMessage.addListener(function(response) {
            console.log('Received from native host:', response);
            if (response.status === 'success') {
                resolve(response.response);
            } else if (response.status === 'error') {
                reject(new Error(response.message));
            }
        });

        port.onDisconnect.addListener(function() {
            if (browser.runtime.lastError) {
                reject(new Error(browser.runtime.lastError.message));
            }
        });

        port.postMessage(message);
    });
}

function storeData(data) {
    return new Promise(function(resolve, reject) {
        browser.storage.local.set(data, function() {
            if (browser.runtime.lastError) {
                reject(new Error(browser.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

function formatResString(resolution) {
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

function injectBeforeContent(selector, newContent) {
    try {
        const style = document.createElement('style');
        document.head.appendChild(style);

        const styleSheet = document.styleSheets[document.styleSheets.length - 1];
        const rule = `${selector}::before { content: "${newContent}"; }`;
        styleSheet.insertRule(rule, styleSheet.cssRules.length);
    } catch (error) {
        console.error('Error injecting style:', error);
    }
}

function formatSecondsToTime(seconds) {
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

function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const fileSize = (bytes / Math.pow(1024, i)).toFixed(2);
    return `${fileSize} ${sizes[i]}`;
}

function formatMimeType(mimeType) {
    if (mimeType.includes('/')) {
        return mimeType.split('/')[1];
    } else {
        return null;
    }
}

function confirmPopup(heading, message) {
    const popup = document.getElementById('popup');
    
    while (popup.firstChild) {
        popup.removeChild(popup.firstChild);
    }
    
    const popupContent = document.createElement('div');
    popupContent.className = 'popupcontent';
    
    const headingElement = document.createElement('h3');
    headingElement.textContent = heading;
    popupContent.appendChild(headingElement);
    
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    popupContent.appendChild(messageElement);
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'popupbtns';
    
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancelbtn';
    cancelButton.className = 'cancelbtn';
    cancelButton.textContent = 'Cancel';
    
    const okButton = document.createElement('button');
    okButton.id = 'okbtn';
    okButton.className = 'okbtn';
    okButton.textContent = 'OK';
    
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(okButton);
    popupContent.appendChild(buttonsContainer);
    
    popup.appendChild(popupContent);
    popup.style.display = 'flex';
    
    return new Promise((resolve) => {
        const handleClick = (result) => {
            popup.style.display = 'none';
            okButton.removeEventListener('click', okClick);
            cancelButton.removeEventListener('click', cancelClick);
            resolve(result);
        };
        
        const okClick = () => handleClick(true);
        const cancelClick = () => handleClick(false);
        
        okButton.addEventListener('click', okClick);
        cancelButton.addEventListener('click', cancelClick);
    });
}

function showSpinner(text) {
    const popup = document.getElementById('popup');
    
    while (popup.firstChild) {
        popup.removeChild(popup.firstChild);
    }
    
    const spinnerContainer = document.createElement('div');
    spinnerContainer.className = 'spinner';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'spinner-icon');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    
    const paths = [
        'M12 2v4',
        'm16.2 7.8 2.9-2.9',
        'M18 12h4',
        'm16.2 16.2 2.9 2.9',
        'M12 18v4',
        'm4.9 19.1 2.9-2.9',
        'M2 12h4',
        'm4.9 4.9 2.9 2.9'
    ];
    
    paths.forEach(d => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
    });
    
    spinnerContainer.appendChild(svg);
    
    if (text) {
        const textElement = document.createElement('p');
        textElement.textContent = text + '...';
        spinnerContainer.appendChild(textElement);
    }
    
    popup.appendChild(spinnerContainer);
    popup.style.display = 'flex';
}

function hideSpinner() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}