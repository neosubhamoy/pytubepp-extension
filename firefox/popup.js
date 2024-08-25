document.addEventListener('DOMContentLoaded', function() {
    const streamsDiv = document.getElementById('streams');
    const refreshBtn = document.getElementById('refresh');

    function createElementWithText(tag, text, className) {
        const element = document.createElement(tag);
        element.textContent = text;
        if (className) element.className = className;
        return element;
    }

    function updateUI(streamInfo, url, tabId, error) {
        streamsDiv.innerHTML = ''; // Clear existing content safely
        if (error) {
            streamsDiv.appendChild(createElementWithText('p', error, 'message'));
        } else if (streamInfo && streamInfo.length > 0) {
            const urlParameters = new URLSearchParams(new URL(url).search);
            const videoId = urlParameters.get("v");
            streamsDiv.appendChild(createElementWithText('div', `Video ID: ${videoId}`, 'videoid'));

            streamInfo.forEach(function(stream) {
                const button = document.createElement('button');
                button.className = `stream ${formatResString(stream.res)} ${stream.is_hdr ? 'hdr' : 'nonhdr'}`;
                button.textContent = `${stream.res} (${stream.res === 'mp3' ? stream.abr : stream.fps})`;
                button.addEventListener('click', function() {
                    console.log(`Selected stream: ${stream.res} - ${stream.fps}`);
                    console.log(`For video: ${url}`);
                    browser.runtime.sendMessage({
                        action: "downloadStream",
                        resolution: stream.res,
                        tabId: tabId
                    }, function(response) {
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
            streamsDiv.appendChild(createElementWithText('p', 'Failed to fetch video stream information. Make sure PytubePP Helper is installed and running or try again refreshing', 'message'));
        }
    }

    function isYouTubeWatchPage(url) {
        return url && url.includes("youtube.com/watch");
    }

    function fetchAndDisplayData(tabId) {
        streamsDiv.innerHTML = ''; // Clear existing content safely
        streamsDiv.appendChild(createElementWithText('p', 'Loading...', 'message'));
        browser.runtime.sendMessage({action: "getStreamInfo", tabId: tabId}, function(response) {
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

    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (isYouTubeWatchPage(currentTab.url)) {
            fetchAndDisplayData(currentTab.id);
            refreshBtn.disabled = false;
        } else {
            streamsDiv.innerHTML = ''; // Clear existing content safely
            streamsDiv.appendChild(createElementWithText('p', 'This is not a YouTube watch page', 'message'));
            refreshBtn.disabled = true;
        }
    });

    refreshBtn.addEventListener('click', function() {
        browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            if (isYouTubeWatchPage(currentTab.url)) {
                refreshBtn.disabled = true;
                streamsDiv.innerHTML = ''; // Clear existing content safely
                streamsDiv.appendChild(createElementWithText('p', 'Loading...', 'message'));
                browser.runtime.sendMessage({
                    action: "refreshData",
                    tabId: currentTab.id,
                    tab: currentTab
                }).then(function(response) {
                    refreshBtn.disabled = false;
                });
            }
        });
    });

    browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "newDataAvailable") {
            browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
                const currentTab = tabs[0];
                if (request.tabId === currentTab.id && isYouTubeWatchPage(currentTab.url)) {
                    fetchAndDisplayData(currentTab.id);
                }
            });
        }
    });
});