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
        while (streamsDiv.firstChild) {
            streamsDiv.removeChild(streamsDiv.firstChild);
        }
        
        if (error) {
            streamsDiv.appendChild(createElementWithText('p', error, 'message'));
        } else if (streamInfo && streamInfo.streams.length > 0) {
            const urlParameters = new URLSearchParams(new URL(url).search);
            const videoId = urlParameters.get("v");
            streamsDiv.appendChild(createElementWithText('div', `Video ID: ${videoId}`, 'videoid'));

            const videoPreviewDiv = document.createElement('div');
            videoPreviewDiv.className = 'videopreview';
            
            const thumbnailWrapper = document.createElement('div');
            thumbnailWrapper.className = 'thumbnailwrapper';
            const thumbnail = document.createElement('img');
            thumbnail.className = 'videothumbnail';
            thumbnail.src = streamInfo.thumbnail_url;
            thumbnail.alt = 'thumbnail';
            thumbnailWrapper.appendChild(thumbnail);
            
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'previewwrapper';
            const infoDiv = document.createElement('div');
            const title = document.createElement('h2');
            title.className = 'videotitle';
            title.textContent = streamInfo.title;
            const author = document.createElement('h5');
            author.className = 'videoauthor';
            author.textContent = streamInfo.author;
            
            infoDiv.appendChild(title);
            infoDiv.appendChild(author);
            previewWrapper.appendChild(infoDiv);
            
            videoPreviewDiv.appendChild(thumbnailWrapper);
            videoPreviewDiv.appendChild(previewWrapper);
            streamsDiv.appendChild(videoPreviewDiv);
            injectBeforeContent('.videopreview', formatSecondsToTime(streamInfo.duration));

            const devider = document.createElement('hr');
            devider.className = 'devider';
            streamsDiv.appendChild(devider);

            streamInfo.streams.forEach(stream => {
                const button = document.createElement('button');
                button.className = `stream ${formatResString(stream.res)} ${stream.is_hdr ? 'hdr' : 'nonhdr'}`;
                
                const span1 = document.createElement('span');
                span1.className = 'btntxt1';
                span1.textContent = `${stream.res} (${stream.res === 'mp3' ? stream.abitrate : stream.fps + 'fps'})`;
                
                const span2 = document.createElement('span');
                span2.className = 'btntxt2';
                span2.textContent = `${formatMimeType(stream.mime_type.toUpperCase())} (${formatFileSize(stream.file_size)})`;
                
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("class", "downloadicon");
                svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                svg.setAttribute("width", "24");
                svg.setAttribute("height", "24");
                svg.setAttribute("viewBox", "0 0 24 24");
                svg.setAttribute("fill", "none");
                svg.setAttribute("stroke", "currentColor");
                svg.setAttribute("stroke-width", "2");
                svg.setAttribute("stroke-linecap", "round");
                svg.setAttribute("stroke-linejoin", "round");
                
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4");
                
                const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                polyline.setAttribute("points", "7 10 12 15 17 10");
                
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", "12");
                line.setAttribute("x2", "12");
                line.setAttribute("y1", "15");
                line.setAttribute("y2", "3");
                
                svg.appendChild(path);
                svg.appendChild(polyline);
                svg.appendChild(line);
                
                button.appendChild(span1);
                button.appendChild(span2);
                button.appendChild(svg);
                
                button.addEventListener('click', () => {
                    confirmPopup('Are you sure ?', `You want to download ${streamInfo.author + ' - ' + streamInfo.title + '_' + (stream.res !== 'mp3' ? stream.res : 'audio')  + '.' + formatMimeType(stream.mime_type)} it will consume ${formatFileSize(stream.file_size)} of your network bandwidth and disk space.`).then((result) => {
                        if(result) {
                            console.log(`Selected stream: ${stream.res} - ${stream.fps}`);
                            console.log(`For video: ${url}`);
                            showSpinner('Starting');
                            browser.runtime.sendMessage({
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
            streamsDiv.appendChild(createElementWithText('p', 'Failed to fetch video stream information. Make sure PytubePP Helper is installed and running or try again refreshing', 'message'));
        }
    }

    function isYouTubeWatchPage(url) {
        return url && url.includes("youtube.com/watch");
    }

    function fetchAndDisplayData(tabId) {
        while (streamsDiv.firstChild) {
            streamsDiv.removeChild(streamsDiv.firstChild);
        }
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
            while (streamsDiv.firstChild) {
                streamsDiv.removeChild(streamsDiv.firstChild);
            }
            streamsDiv.appendChild(createElementWithText('p', 'This is not a YouTube watch page', 'message'));
            refreshBtn.disabled = true;
        }
    });

    refreshBtn.addEventListener('click', () => {
        browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
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
                while (streamsDiv.firstChild) {
                    streamsDiv.removeChild(streamsDiv.firstChild);
                }
                streamsDiv.appendChild(createElementWithText('p', 'Loading...', 'message'));

                browser.runtime.sendMessage({
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