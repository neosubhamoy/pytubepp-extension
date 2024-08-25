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

export function processVideoStreams(streams) {
    const priorityMap = {
        '144p': ['160'],
        '240p': ['133'],
        '360p': ['18'],
        '480p': ['135'],
        '720p': ['698', '298', '136'],
        '1080p': ['699', '299', '137'],
        '1440p': ['700', '308', '271'],
        '2160p': ['701', '315', '313'],
        '4320p': ['702', '571']
    };

    const hdrItags = ['698', '699', '700', '701', '702'];

    const resolutionOrder = ['4320p', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];

    const processedStreams = {};

    streams.forEach(stream => {
        const resolution = stream.res;
        const itag = stream.itag;

        if (priorityMap[resolution]) {
        const priority = priorityMap[resolution].indexOf(itag);
        if (priority !== -1 && (!processedStreams[resolution] || priority < processedStreams[resolution].priority)) {
            processedStreams[resolution] = {
            ...stream,
            is_hdr: hdrItags.includes(itag),
            priority: priority
            };
        }
        }
    });

    const result = resolutionOrder
        .filter(res => processedStreams[res])
        .map(res => {
        const { priority, ...stream } = processedStreams[res];
        return stream;
        });

    result.push({
        "itag": "140",
        "mime_type": "audio/mp3",
        "res": "mp3",
        "abr": "128kbps",
        "acodec": "mp4a.40.2"
    });

    return result;
};

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