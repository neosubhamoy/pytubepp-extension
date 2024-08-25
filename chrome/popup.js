import { formatResString } from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const streamsDiv = document.getElementById('streams');
    const refreshBtn = document.getElementById('refresh');

    function updateUI(streamInfo, url, tabId, error) {
        streamsDiv.innerHTML = "";
        if (error) {
            streamsDiv.innerHTML = `<p class='message'>${error}</p>`;
        } else if (streamInfo && streamInfo.length > 0) {
            const urlParameters = new URLSearchParams(new URL(url).search);
            const videoId = urlParameters.get("v");
            const videoIdDiv = document.createElement('div');
            videoIdDiv.className = 'videoid';
            videoIdDiv.textContent = `Video ID: ${videoId}`;
            streamsDiv.appendChild(videoIdDiv);

            streamInfo.forEach(stream => {
                const button = document.createElement('button');
                button.className = `stream ${formatResString(stream.res)} ${stream.is_hdr ? 'hdr' : 'nonhdr'}`;
                button.textContent = `${stream.res} (${stream.res === 'mp3' ? stream.abr : stream.fps})`;
                button.addEventListener('click', () => {
                    console.log(`Selected stream: ${stream.res} - ${stream.fps}`);
                    console.log(`For video: ${url}`);
                    // Send message to background script to initiate download
                    chrome.runtime.sendMessage({
                        action: "downloadStream",
                        resolution: stream.res,
                        tabId: tabId
                    }, response => {
                        if (response && response.success) {
                            console.log("Download initiated successfully");
                        } else {
                            console.error("Failed to initiate download", response ? response.error : "Unknown error");
                        }
                    });
                });
                streamsDiv.appendChild(button);
            });
        } else {
            streamsDiv.innerHTML = "<p class='message'>Failed to fetch video stream information. Make sure PytubePP Helper is installed and running or try again refreshing</p>";
        }
    }

    function isYouTubeWatchPage(url) {
        return url && url.includes("youtube.com/watch");
    }

    function fetchAndDisplayData(tabId) {
        streamsDiv.innerHTML = "<p class='message'>Loading...</p>";
        chrome.runtime.sendMessage({action: "getStreamInfo", tabId: tabId}, (response) => {
            if (response.error) {
                console.error('Error fetching stream info for tab', tabId, ':', response.error);
                updateUI(null, null, tabId, response.error);
            } else if (response && response.streamInfo) {
                console.log('Fetched stream info for tab', tabId, ':', response.streamInfo);
                updateUI(response.streamInfo, response.url, tabId);
            } else {
                console.log('No stream info available for tab', tabId);
                updateUI(null, null, tabId);
            }
        });
    }

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const currentTab = tabs[0];
        if (isYouTubeWatchPage(currentTab.url)) {
            fetchAndDisplayData(currentTab.id);
            refreshBtn.disabled = false;
        } else {
            streamsDiv.innerHTML = "<p class='message'>This is not a YouTube watch page</p>";
            refreshBtn.disabled = true;
        }
    });

    refreshBtn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const currentTab = tabs[0];
            if (isYouTubeWatchPage(currentTab.url)) {
                refreshBtn.disabled = true;
                streamsDiv.innerHTML = "<p class='message'>Loading...</p>";
                chrome.runtime.sendMessage({
                    action: "refreshData",
                    tabId: currentTab.id,
                    tab: currentTab
                }).then(response => {
                    refreshBtn.disabled = false;
                });
            }
        });
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "newDataAvailable") {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                const currentTab = tabs[0];
                if (request.tabId === currentTab.id && isYouTubeWatchPage(currentTab.url)) {
                    fetchAndDisplayData(currentTab.id);
                }
            });
        }
    });
});