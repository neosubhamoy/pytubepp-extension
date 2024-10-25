var tabStreamInfo = {};

function updateTabInfo(tabId, streamInfo, url, error) {
    if (error) {
        tabStreamInfo[tabId] = { error: error };
    } else {
        tabStreamInfo[tabId] = { streams: streamInfo, url: url };
    }
    return storeData({ [tabId]: tabStreamInfo[tabId] }).then(function() {
        console.log('Data stored successfully for tab', tabId);
    });
}

function clearTabInfo(tabId) {
    delete tabStreamInfo[tabId];
    return new Promise(function(resolve) {
        browser.storage.local.remove(tabId.toString(), function() {
            console.log('Cleared data for tab', tabId);
            resolve();
        });
    });
}

browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes("youtube.com/watch")) {
        var urlParameters = new URLSearchParams(new URL(tab.url).search);
        var videoId = urlParameters.get("v");

        if (videoId) {
            clearTabInfo(tabId).then(function() {
                return sendMessageToNativeHost({url: `https://www.youtube.com/watch?v=${videoId}`, command: 'send-stream-info', argument: ''});
            })
            .then(function(response) {
                if (response.status === 'error') {
                    throw new Error(response.message);
                }
                var streamInfo = response ? JSON.parse(response) : null;
                console.log('Available Streams for tab', tabId, ':', streamInfo);
                return updateTabInfo(tabId, streamInfo, tab.url);
            })
            .then(function() {
                browser.runtime.sendMessage({action: "newDataAvailable", tabId: tabId});
            })
            .catch(function(error) {
                console.error('Error for tab', tabId, ':', error);
                return updateTabInfo(tabId, null, null, 'Failed to fetch video stream information. Make sure PytubePP Helper is installed and running or try again refreshing');
            })
            .then(function() {
                browser.runtime.sendMessage({action: "newDataAvailable", tabId: tabId});
            });
        }
    }
});

browser.tabs.onRemoved.addListener(function(tabId) {
    if (tabStreamInfo[tabId]) {
        delete tabStreamInfo[tabId];
        browser.storage.local.remove(tabId.toString(), function() {
            console.log('Removed data for closed tab', tabId);
        });
    }
});

function getStreamInfoForTab(tabId) {
    return new Promise(function(resolve) {
        if (tabStreamInfo[tabId]) {
            resolve(tabStreamInfo[tabId]);
        } else {
            browser.storage.local.get(tabId.toString(), function(result) {
                if (result[tabId]) {
                    tabStreamInfo[tabId] = result[tabId];
                    resolve(tabStreamInfo[tabId]);
                } else {
                    resolve(null);
                }
            });
        }
    });
}

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getStreamInfo") {
        getStreamInfoForTab(request.tabId).then(function(tabData) {
            sendResponse({
                streamInfo: tabData && tabData.streams ? tabData.streams : null, 
                url: tabData && tabData.url ? tabData.url : null,
                error: tabData && tabData.error ? tabData.error : null
            });
        });
        return true;
    } else if (request.action === "downloadStream") {
        getStreamInfoForTab(request.tabId).then(function(tabData) {
            if (tabData && tabData.url) {
                sendMessageToNativeHost({
                    url: tabData.url,
                    command: 'download-stream',
                    argument: request.resolution
                }).then(function(response) {
                    console.log('Download initiated:', response);
                    sendResponse({success: true});
                }).catch(function(error) {
                    console.error('Error initiating download:', error);
                    sendResponse({success: false, error: error.message});
                });
            } else {
                sendResponse({success: false, error: "No URL found for this tab"});
            }
        });
        return true;
    } else if (request.action === "refreshData") {
        var tabId = request.tabId;
        var tab = request.tab;

        clearTabInfo(tabId).then(function() {
            var urlParameters = new URLSearchParams(new URL(tab.url).search);
            var videoId = urlParameters.get("v");

            if (videoId) {
                sendMessageToNativeHost({url: `https://www.youtube.com/watch?v=${videoId}`, command: 'send-stream-info', argument: ''})
                    .then(function(response) {
                        if (response.status === 'error') {
                            throw new Error(response.message);
                        }
                        var streamInfo = response ? JSON.parse(response) : null;
                        console.log('Available Streams for tab', tabId, ':', streamInfo);
                        return updateTabInfo(tabId, streamInfo, tab.url);
                    })
                    .then(function() {
                        browser.runtime.sendMessage({action: "newDataAvailable", tabId: tabId});
                        sendResponse({success: true});
                    })
                    .catch(function(error) {
                        console.error('Error for tab', tabId, ':', error);
                        return updateTabInfo(tabId, null, null, 'Failed to fetch video stream information. Make sure PytubePP Helper is installed and running or try again refreshing');
                    })
                    .then(function() {
                        browser.runtime.sendMessage({action: "newDataAvailable", tabId: tabId});
                        sendResponse({success: true});
                    });
            }
        });
        return true;
    }
});