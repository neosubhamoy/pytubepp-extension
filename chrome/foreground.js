// (function() {
//     'use strict';

//     // Function to create and add the download button
//     function addDownloadButton() {
//         // Check if we're on a YouTube video page
//         if (!window.location.href.includes('youtube.com/watch')) return;

//         // Check if the button already exists
//         if (document.getElementById('yt-download-btn')) return;

//         // Create the button
//         const downloadBtn = document.createElement('button');
//         downloadBtn.id = 'pytubepp-download-btn';
//         downloadBtn.innerHTML = 'Download';
//         downloadBtn.style.cssText = `
//             position: absolute;
//             bottom: -10px;
//             right: 20px;
//             z-index: 1000;
//             background-color: red;
//             color: white;
//             border: none;
//             border-radius: 2px;
//             padding: 10px 16px;
//             font-size: 14px;
//             cursor: pointer;
//             opacity: 0.9;
//         `;

//         // Add click event listener
//         downloadBtn.addEventListener('click', function() {
//             // Get video ID from URL
//             const videoId = new URLSearchParams(window.location.search).get('v');
//             if (videoId) {
//                 // Send message to background script
//                 chrome.runtime.sendMessage({action: "download", videoId: videoId});
//             } else {
//                 console.error('Could not find video ID');
//             }
//         });

//         // Find the YouTube player
//         const playerContainer = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        
//         if (playerContainer) {
//             playerContainer.appendChild(downloadBtn);
//         } else {
//             console.error('Could not find YouTube player container');
//         }
//     }

//     // Run the function initially
//     addDownloadButton();

//     // Use a MutationObserver to check for changes in the DOM
//     const observer = new MutationObserver(function(mutations) {
//         mutations.forEach(function(mutation) {
//             if (mutation.type === 'childList') {
//                 addDownloadButton();
//             }
//         });
//     });

//     // Start observing the document with the configured parameters
//     observer.observe(document.body, { childList: true, subtree: true });

// })();