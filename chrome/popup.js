import { formatResString, injectBeforeContent, formatFileSize, formatMimeType, formatSecondsToTime, confirmPopup, showSpinner, hideSpinner } from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const streamsDiv = document.getElementById('streams');
    const refreshBtn = document.getElementById('refresh');

    function updateUI(streamInfo, url, tabId, error) {
        streamsDiv.innerHTML = "";
        if (error) {
            streamsDiv.innerHTML = `<p class='message'>${error}</p>`;
        } else if (streamInfo && streamInfo.streams.length > 0) {
            const urlParameters = new URLSearchParams(new URL(url).search);
            const videoId = urlParameters.get("v");
            const videoIdDiv = document.createElement('div');
            videoIdDiv.className = 'videoid';
            videoIdDiv.textContent = `Video ID: ${videoId}`;
            streamsDiv.appendChild(videoIdDiv);

            const videoPreviewDiv = document.createElement('div');
            videoPreviewDiv.className = 'videopreview';
            videoPreviewDiv.innerHTML = `
            <div class="thumbnailwrapper">
                <img class="videothumbnail" src="${streamInfo.thumbnail_url}" alt="thumbnail">
            </div>
            <div class="previewwrapper">
                <div>
                    <h2 class="videotitle">${streamInfo.title}</h2>
                    <h5 class="videoauthor">${streamInfo.author}</h5>
                </div>
            </div>
            `;
            streamsDiv.appendChild(videoPreviewDiv);
            injectBeforeContent('.videopreview', formatSecondsToTime(streamInfo.duration));

            const devider = document.createElement('hr');
            devider.className = 'devider';
            streamsDiv.appendChild(devider);

            streamInfo.streams.forEach(stream => {
                const button = document.createElement('button');
                button.className = `stream ${formatResString(stream.res)} ${stream.is_hdr ? 'hdr' : 'nonhdr'}`;
                button.innerHTML = `
                <span class="btntxt1">${stream.res} (${stream.res === 'mp3' ? stream.abitrate : stream.fps + 'fps'})</span>
                <span class="btntxt2">${formatMimeType(stream.mime_type.toUpperCase())} (${formatFileSize(stream.file_size)})</span>
                <svg class="downloadicon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                `;
                button.addEventListener('click', () => {
                    confirmPopup('Are you sure ?', `You want to download ${streamInfo.author + ' - ' + streamInfo.title + '_' + (stream.res !== 'mp3' ? stream.res : 'audio')  + '.' + formatMimeType(stream.mime_type)} it will consume ${formatFileSize(stream.file_size)} of your network bandwidth and disk space.`).then((result) => {
                        if(result) {
                            console.log(`Selected stream: ${stream.res} - ${stream.fps}`);
                            console.log(`For video: ${url}`);
                            showSpinner('Starting');
                            // Send message to background script to initiate download
                            chrome.runtime.sendMessage({
                                action: "downloadStream",
                                resolution: stream.res,
                                tabId: tabId
                            }, response => {
                                hideSpinner();
                                if (response && response.success) {
                                    console.log("Download initiated successfully");
                                } else {
                                    console.error("Failed to initiate download", response ? response.error : "Unknown error");
                                }
                            });
                        }
                    });
                });
                streamsDiv.appendChild(button);
            });

            const popup = document.createElement('div');
            popup.className = 'popup';
            popup.id = 'popup';
            streamsDiv.appendChild(popup);
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
            const refreshIcon = document.getElementById('refresh-icon');
            if (isYouTubeWatchPage(currentTab.url)) {
                refreshBtn.disabled = true;
                let rotationTimeout;
                function startRotation() {
                    refreshIcon.classList.add("rotate");
                
                    rotationTimeout = setTimeout(() => {
                      refreshIcon.classList.remove("rotate");
                      rotationTimeout = setTimeout(startRotation, 100);
                    }, 1000);
                }
                startRotation();
                streamsDiv.innerHTML = "<p class='message'>Loading...</p>";

                chrome.runtime.sendMessage({
                    action: "refreshData",
                    tabId: currentTab.id,
                    tab: currentTab
                }).then(response => {
                    refreshBtn.disabled = false;
                    clearTimeout(rotationTimeout);
                    refreshIcon.classList.remove("rotate");
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