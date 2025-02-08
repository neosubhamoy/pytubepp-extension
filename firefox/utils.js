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

function downloadPopup(title, author, stream, captions) {
    const popup = document.getElementById('popup');
    
    while (popup.firstChild) {
        popup.removeChild(popup.firstChild);
    }
    
    const popupContent = document.createElement('div');
    popupContent.className = 'popupcontent';
    
    const headingElement = document.createElement('h3');
    headingElement.textContent = 'Are you sure ?';
    popupContent.appendChild(headingElement);
    
    const descriptionElement = document.createElement('p');
    const descText = document.createTextNode('You want to download ');
    const titleStrong = document.createElement('strong');
    titleStrong.textContent = title;
    const byText = document.createTextNode(' by ');
    const authorStrong = document.createElement('strong');
    authorStrong.textContent = author;
    const formatText = document.createTextNode(' in the following format:');
    
    descriptionElement.appendChild(descText);
    descriptionElement.appendChild(titleStrong);
    descriptionElement.appendChild(byText);
    descriptionElement.appendChild(authorStrong);
    descriptionElement.appendChild(formatText);
    popupContent.appendChild(descriptionElement);
    
    const listElement = document.createElement('ul');
    listElement.className = 'popuplist';
    
    // Resolution/Bitrate list item
    const resolutionItem = document.createElement('li');
    const resolutionIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    resolutionIcon.setAttribute('class', 'popuplisticon');
    resolutionIcon.setAttribute('width', '24');
    resolutionIcon.setAttribute('height', '24');
    resolutionIcon.setAttribute('viewBox', '0 0 24 24');
    resolutionIcon.setAttribute('fill', 'none');
    resolutionIcon.setAttribute('stroke', 'currentColor');
    resolutionIcon.setAttribute('stroke-width', '2');
    resolutionIcon.setAttribute('stroke-linecap', 'round');
    resolutionIcon.setAttribute('stroke-linejoin', 'round');
    
    if (stream.res !== 'mp3') {
        // Video resolution icon paths
        const paths = [
            ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
            ['path', { d: 'M7 3v18' }],
            ['path', { d: 'M3 7.5h4' }],
            ['path', { d: 'M3 12h18' }],
            ['path', { d: 'M3 16.5h4' }],
            ['path', { d: 'M17 3v18' }],
            ['path', { d: 'M17 7.5h4' }],
            ['path', { d: 'M17 16.5h4' }]
        ];
        
        paths.forEach(([elementType, attributes]) => {
            const element = document.createElementNS('http://www.w3.org/2000/svg', elementType);
            Object.entries(attributes).forEach(([attr, value]) => {
                element.setAttribute(attr, value);
            });
            resolutionIcon.appendChild(element);
        });
        
        const resText = document.createElement('strong');
        resText.textContent = 'Resolution: ';
        resolutionItem.appendChild(resolutionIcon);
        resolutionItem.appendChild(resText);
        resolutionItem.appendChild(document.createTextNode(`${stream.res} ${stream.fps}fps ${stream.is_hdr ? 'HDR' : ''}`));
    } else {
        // Audio icon paths
        const paths = [
            ['path', { d: 'M9 18V5l12-2v13' }],
            ['circle', { cx: '6', cy: '18', r: '3' }],
            ['circle', { cx: '18', cy: '16', r: '3' }]
        ];
        
        paths.forEach(([elementType, attributes]) => {
            const element = document.createElementNS('http://www.w3.org/2000/svg', elementType);
            Object.entries(attributes).forEach(([attr, value]) => {
                element.setAttribute(attr, value);
            });
            resolutionIcon.appendChild(element);
        });
        
        const bitrateText = document.createElement('strong');
        bitrateText.textContent = 'Bitrate: ';
        resolutionItem.appendChild(resolutionIcon);
        resolutionItem.appendChild(bitrateText);
        resolutionItem.appendChild(document.createTextNode(stream.abitrate));
    }
    listElement.appendChild(resolutionItem);
    
    // File Format list item
    const formatItem = document.createElement('li');
    const formatIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    formatIcon.setAttribute('class', 'popuplisticon');
    formatIcon.setAttribute('width', '24');
    formatIcon.setAttribute('height', '24');
    formatIcon.setAttribute('viewBox', '0 0 24 24');
    formatIcon.setAttribute('fill', 'none');
    formatIcon.setAttribute('stroke', 'currentColor');
    formatIcon.setAttribute('stroke-width', '2');
    formatIcon.setAttribute('stroke-linecap', 'round');
    formatIcon.setAttribute('stroke-linejoin', 'round');
    
    const formatPaths = stream.res !== 'mp3' ? [
        ['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }],
        ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }],
        ['path', { d: 'm10 11 5 3-5 3v-6Z' }]
    ] : [
        ['path', { d: 'M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v2' }],
        ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }],
        ['circle', { cx: '3', cy: '17', r: '1' }],
        ['path', { d: 'M2 17v-3a4 4 0 0 1 8 0v3' }],
        ['circle', { cx: '9', cy: '17', r: '1' }]
    ];
    
    formatPaths.forEach(([elementType, attributes]) => {
        const element = document.createElementNS('http://www.w3.org/2000/svg', elementType);
        Object.entries(attributes).forEach(([attr, value]) => {
            element.setAttribute(attr, value);
        });
        formatIcon.appendChild(element);
    });
    
    const formatTextLabel = document.createElement('strong');
    formatTextLabel.textContent = 'FileFormat: ';
    formatItem.appendChild(formatIcon);
    formatItem.appendChild(formatTextLabel);
    formatItem.appendChild(document.createTextNode(stream.mime_type));
    listElement.appendChild(formatItem);
    
    // File Size list item
    const sizeItem = document.createElement('li');
    const sizeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sizeIcon.setAttribute('class', 'popuplisticon');
    sizeIcon.setAttribute('width', '24');
    sizeIcon.setAttribute('height', '24');
    sizeIcon.setAttribute('viewBox', '0 0 24 24');
    sizeIcon.setAttribute('fill', 'none');
    sizeIcon.setAttribute('stroke', 'currentColor');
    sizeIcon.setAttribute('stroke-width', '2');
    sizeIcon.setAttribute('stroke-linecap', 'round');
    sizeIcon.setAttribute('stroke-linejoin', 'round');
    
    const sizePaths = [
        ['path', { d: 'M12 13v8l-4-4' }],
        ['path', { d: 'm12 21 4-4' }],
        ['path', { d: 'M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284' }]
    ];
    
    sizePaths.forEach(([elementType, attributes]) => {
        const element = document.createElementNS('http://www.w3.org/2000/svg', elementType);
        Object.entries(attributes).forEach(([attr, value]) => {
            element.setAttribute(attr, value);
        });
        sizeIcon.appendChild(element);
    });
    
    const sizeText = document.createElement('strong');
    sizeText.textContent = 'FileSize: ';
    sizeItem.appendChild(sizeIcon);
    sizeItem.appendChild(sizeText);
    sizeItem.appendChild(document.createTextNode(formatFileSize(stream.file_size)));
    listElement.appendChild(sizeItem);
    
    popupContent.appendChild(listElement);
    
    const captionText = document.createElement('p');
    captionText.textContent = stream.res === 'mp3' ? 'Cannot embed caption in mp3' : (captions ? 'Select a caption track to embed:' : 'Caption not available');
    popupContent.appendChild(captionText);
    
    const captionSelect = document.createElement('select');
    captionSelect.className = 'captions';
    captionSelect.id = 'captions';
    captionSelect.disabled = stream.res === 'mp3' || !captions;
    
    const noCaptionOption = document.createElement('option');
    noCaptionOption.className = 'captionitem';
    noCaptionOption.value = 'none';
    noCaptionOption.selected = true;
    noCaptionOption.textContent = 'No Caption';
    captionSelect.appendChild(noCaptionOption);
    
    if (captions) {
        captions.forEach(caption => {
            const option = document.createElement('option');
            option.className = 'captionitem';
            option.value = caption.code;
            option.textContent = caption.lang;
            captionSelect.appendChild(option);
        });
    }
    
    popupContent.appendChild(captionSelect);
    
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
        const handleClick = (confirmed) => {
            popup.style.display = 'none';
            okButton.removeEventListener('click', okClick);
            cancelButton.removeEventListener('click', cancelClick);
            resolve({
                confirmed,
                caption: confirmed ? captionSelect.value : null
            });
        };
        
        const okClick = () => handleClick(true);
        const cancelClick = () => handleClick(false);
        
        okButton.addEventListener('click', okClick);
        cancelButton.addEventListener('click', cancelClick);
    });
}

function aboutPopup() {
    const manifest = browser.runtime.getManifest();
    const popup = document.getElementById('popup');
    
    // Clear existing content
    while (popup.firstChild) {
        popup.removeChild(popup.firstChild);
    }
    
    // Create main container
    const popupContent = document.createElement('div');
    popupContent.className = 'aboutpopupcontent';
    
    // Create title container
    const titleContainer = document.createElement('div');
    titleContainer.id = 'abouttitlecont';
    titleContainer.className = 'abouttitlecont';
    
    // Create and setup logo
    const logo = document.createElement('img');
    logo.id = 'aboutlogo';
    logo.className = 'aboutlogo';
    logo.src = 'assets/logo/pytubepp-128.png';
    logo.alt = 'logo';
    
    // Create title
    const title = document.createElement('h3');
    title.id = 'abouttitle';
    title.className = 'abouttitle';
    title.textContent = 'PytubePP';
    
    titleContainer.appendChild(logo);
    titleContainer.appendChild(title);
    
    // Create subtitle
    const subtitle = document.createElement('p');
    subtitle.id = 'aboutsubtitle';
    subtitle.className = 'aboutsubtitle';
    subtitle.textContent = 'Extension';
    
    // Create author section
    const author = document.createElement('p');
    author.id = 'aboutauthor';
    author.className = 'aboutauthor';
    author.innerHTML = 'Made with &#10084; by ';
    const authorLink = document.createElement('a');
    authorLink.href = 'https://neosubhamoy.com';
    authorLink.target = '_blank';
    authorLink.textContent = 'Subhamoy';
    author.appendChild(authorLink);
    
    // Create version list
    const list = document.createElement('ul');
    list.id = 'aboutlist';
    list.className = 'aboutlist';
    
    const versionItem = document.createElement('li');
    versionItem.textContent = `v${manifest.version}-beta`;
    
    const licenseItem = document.createElement('li');
    const licenseLink = document.createElement('a');
    licenseLink.href = 'https://github.com/neosubhamoy/pytubepp-extension/blob/main/LICENSE';
    licenseLink.target = '_blank';
    licenseLink.textContent = 'MIT License';
    licenseItem.appendChild(licenseLink);
    
    list.appendChild(versionItem);
    list.appendChild(licenseItem);
    
    // Create icons container
    const iconsContainer = document.createElement('div');
    iconsContainer.id = 'abouticons';
    iconsContainer.className = 'abouticons';
    
    // Website icon
    const websiteLink = document.createElement('a');
    websiteLink.href = 'https://pytubepp.neosubhamoy.com';
    websiteLink.target = '_blank';
    websiteLink.title = 'Website';
    
    const websiteIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    websiteIcon.setAttribute('width', '24');
    websiteIcon.setAttribute('height', '24');
    websiteIcon.setAttribute('viewBox', '0 0 24 24');
    websiteIcon.setAttribute('fill', 'none');
    websiteIcon.setAttribute('stroke', 'currentColor');
    websiteIcon.setAttribute('stroke-width', '2');
    websiteIcon.setAttribute('stroke-linecap', 'round');
    websiteIcon.setAttribute('stroke-linejoin', 'round');
    
    const websitePaths = [
        ['circle', { cx: '12', cy: '12', r: '10' }],
        ['path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }],
        ['path', { d: 'M2 12h20' }]
    ];
    
    websitePaths.forEach(([elementType, attributes]) => {
        const element = document.createElementNS('http://www.w3.org/2000/svg', elementType);
        Object.entries(attributes).forEach(([attr, value]) => {
            element.setAttribute(attr, value);
        });
        websiteIcon.appendChild(element);
    });
    
    websiteLink.appendChild(websiteIcon);
    
    // GitHub icon
    const githubLink = document.createElement('a');
    githubLink.href = 'https://github.com/neosubhamoy/pytubepp-extension';
    githubLink.target = '_blank';
    githubLink.title = 'GitHub';
    
    const githubIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    githubIcon.setAttribute('width', '24');
    githubIcon.setAttribute('height', '24');
    githubIcon.setAttribute('viewBox', '0 0 24 24');
    githubIcon.setAttribute('fill', 'none');
    githubIcon.setAttribute('stroke', 'currentColor');
    githubIcon.setAttribute('stroke-width', '2');
    githubIcon.setAttribute('stroke-linecap', 'round');
    githubIcon.setAttribute('stroke-linejoin', 'round');
    
    const githubPaths = [
        ['path', { d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4' }],
        ['path', { d: 'M9 18c-4.51 2-5-2-7-2' }]
    ];
    
    githubPaths.forEach(([elementType, attributes]) => {
        const element = document.createElementNS('http://www.w3.org/2000/svg', elementType);
        Object.entries(attributes).forEach(([attr, value]) => {
            element.setAttribute(attr, value);
        });
        githubIcon.appendChild(element);
    });
    
    githubLink.appendChild(githubIcon);
    
    iconsContainer.appendChild(websiteLink);
    iconsContainer.appendChild(githubLink);
    
    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'aboutpopupbtns';
    buttonsContainer.className = 'aboutpopupbtns';
    
    const closeButton = document.createElement('button');
    closeButton.id = 'aboutclosebtn';
    closeButton.className = 'aboutclosebtn';
    closeButton.textContent = 'Close';
    
    buttonsContainer.appendChild(closeButton);
    
    // Append all elements to main container
    popupContent.appendChild(titleContainer);
    popupContent.appendChild(subtitle);
    popupContent.appendChild(author);
    popupContent.appendChild(list);
    popupContent.appendChild(iconsContainer);
    popupContent.appendChild(buttonsContainer);
    
    // Add main container to popup
    popup.appendChild(popupContent);
    popup.style.display = 'flex';
    
    return new Promise((resolve) => {
        const handleClose = () => {
            popup.style.display = 'none';
            closeButton.removeEventListener('click', handleClose);
            resolve();
        };
        
        closeButton.addEventListener('click', handleClose);
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