import {sendMessageToNativeHost, storeData, processVideoStreams} from './utils.js';

// Object to store stream info and URL for each tab
const tabStreamInfo = {};

function updateTabInfo(tabId, streamInfo, url, error = null) {
    if (error) {
        tabStreamInfo[tabId] = { error: error };
    } else {
        tabStreamInfo[tabId] = { streams: streamInfo, url: url };
    }
    // Store the data in Chrome storage
    return storeData({ [tabId]: tabStreamInfo[tabId] }).then(() => {
        console.log('Data stored successfully for tab', tabId);
    });
}

function clearTabInfo(tabId) {
    delete tabStreamInfo[tabId];
    return new Promise((resolve) => {
        chrome.storage.local.remove(tabId.toString(), () => {
            console.log('Cleared data for tab', tabId);
            resolve();
        });
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes("youtube.com/watch")) {
        const urlParameters = new URLSearchParams(new URL(tab.url).search);
        const videoId = urlParameters.get("v");

        if (videoId) {
            clearTabInfo(tabId).then(() => {
                return sendMessageToNativeHost({url: `https://www.youtube.com/watch?v=${videoId}`, command: 'send-stream-info', argument: ''});
            })
            .then(response => {
                if (response.status === 'error') {
                    throw new Error(response.message);
                }
                const streamInfo = response ? processVideoStreams(JSON.parse(response)) : null;
                console.log('Available Streams for tab', tabId, ':', streamInfo);
                return updateTabInfo(tabId, streamInfo, tab.url);
            })
            .then(() => {
                // Notify the popup that new data is available for this tab
                chrome.runtime.sendMessage({action: "newDataAvailable", tabId: tabId});
            })
            .catch(error => {
                console.error('Error for tab', tabId, ':', error);
                return updateTabInfo(tabId, null, null, 'Failed to fetch video stream information. Make sure PytubePP Helper is installed and running or try again refreshing');
            })
            .then(() => {
                // Always notify the popup, even if there's an error
                chrome.runtime.sendMessage({action: "newDataAvailable", tabId: tabId});
            });
        }
    }
});

// Listen for tab removal to clean up stored data
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabStreamInfo[tabId]) {
        delete tabStreamInfo[tabId];
        // Remove the data from Chrome storage
        chrome.storage.local.remove(tabId.toString(), () => {
            console.log('Removed data for closed tab', tabId);
        });
    }
});

// Function to get stream info and URL for a specific tab
function getStreamInfoForTab(tabId) {
    return new Promise((resolve) => {
        if (tabStreamInfo[tabId]) {
            resolve(tabStreamInfo[tabId]);
        } else {
            // If not in memory, try to fetch from storage
            chrome.storage.local.get(tabId.toString(), (result) => {
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

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getStreamInfo") {
        getStreamInfoForTab(request.tabId).then((tabData) => {
            sendResponse({
                streamInfo: tabData && tabData.streams ? tabData.streams : null, 
                url: tabData && tabData.url ? tabData.url : null,
                error: tabData && tabData.error ? tabData.error : null
            });
        });
        return true; // Indicates that the response will be sent asynchronously
    } else if (request.action === "downloadStream") {
        getStreamInfoForTab(request.tabId).then((tabData) => {
            if (tabData && tabData.url) {
                sendMessageToNativeHost({
                    url: tabData.url,
                    command: 'download-stream',
                    argument: request.resolution
                }).then(response => {
                    console.log('Download initiated:', response);
                    sendResponse({success: true});
                }).catch(error => {
                    console.error('Error initiating download:', error);
                    sendResponse({success: false, error: error.message});
                });
            } else {
                sendResponse({success: false, error: "No URL found for this tab"});
            }
        });
        return true; // Indicates that the response will be sent asynchronously
    } else if (request.action === "refreshData") {
        const tabId = request.tabId;
        const tab = request.tab;

        clearTabInfo(tabId).then(() => {
            const urlParameters = new URLSearchParams(new URL(tab.url).search);
            const videoId = urlParameters.get("v");

            if (videoId) {
                sendMessageToNativeHost({url: `https://www.youtube.com/watch?v=${videoId}`, command: 'send-stream-info', argument: ''})
                    .then(response => {
                        if (response.status === 'error') {
                            throw new Error(response.message);
                        }
                        const streamInfo = response ? processVideoStreams(JSON.parse(response)) : null;
                        console.log('Available Streams for tab', tabId, ':', streamInfo);
                        return updateTabInfo(tabId, streamInfo, tab.url);
                    })
                    .then(() => {
                        // Notify the popup that new data is available for this tab
                        chrome.runtime.sendMessage({action: "newDataAvailable", tabId: tabId});
                        sendResponse({success: true});
                    })
                    .catch(error => {
                        console.error('Error for tab', tabId, ':', error);
                        return updateTabInfo(tabId, null, null, 'Failed to fetch video stream information. Make sure PytubePP Helper is installed and running or try again refreshing');
                    })
                    .then(() => {
                        // Always notify the popup, even if there's an error
                        chrome.runtime.sendMessage({action: "newDataAvailable", tabId: tabId});
                        sendResponse({success: true});
                    });
            }
        });
        return true; // Indicates that the response will be sent asynchronously
    }
});