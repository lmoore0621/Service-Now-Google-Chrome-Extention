// receive messages from Options.js
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
  if(message.popupOpen) {
    //once message is recieved, capture screenshot of the current page 
    chrome.tabs.captureVisibleTab(function(url) {
      chrome.extension.sendMessage({method: 'setScreenshotUrl', data: url}, function(response) {});
    });

    // gets current tab url and sends it as a message to options.js
    chrome.tabs.getSelected(null, function(tab) {
      var tablink = tab.url;
      chrome.extension.sendMessage({method:'getAppName', data: tablink}, function(response){});
    });
  }
});
