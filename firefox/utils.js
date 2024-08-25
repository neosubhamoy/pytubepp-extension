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

function processVideoStreams(streams) {
    var priorityMap = {
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

    var hdrItags = ['698', '699', '700', '701', '702'];

    var resolutionOrder = ['4320p', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];

    var processedStreams = {};

    streams.forEach(function(stream) {
        var resolution = stream.res;
        var itag = stream.itag;

        if (priorityMap[resolution]) {
            var priority = priorityMap[resolution].indexOf(itag);
            if (priority !== -1 && (!processedStreams[resolution] || priority < processedStreams[resolution].priority)) {
                processedStreams[resolution] = Object.assign({}, stream, {
                    is_hdr: hdrItags.includes(itag),
                    priority: priority
                });
            }
        }
    });

    var result = resolutionOrder
        .filter(function(res) { return processedStreams[res]; })
        .map(function(res) {
            var stream = processedStreams[res];
            delete stream.priority;
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