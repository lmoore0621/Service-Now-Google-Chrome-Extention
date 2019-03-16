// Allows Background.js to receive event that the popup was opened
chrome.runtime.sendMessage({popupOpen: true});
//Once Message is sent from Background.js, returns src uri for image
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  	switch (request.method) 
	{
		case 'setScreenshotUrl':
			//handles the image being set in the form
			document.getElementById('target').src = request.data;
			sendResponse({result: 'success'});
			break;
		case 'getAppName':
			//parses the url from background.js and reveals Application Name
			var full = request.data;
			var newUrl =  full.split('/');
			var appNameTemp =  newUrl[3];
			function capitalizeFirstLetter(string) {
				return string.charAt(0).toUpperCase() + string.slice(1);
			}
			document.querySelector('#applicationName').value = capitalizeFirstLetter(appNameTemp);
			sendResponse({result: 'success'});
			break;
	}
});

//adds event listener to the submit button
document.querySelector('#optionsSubmit').addEventListener('click', sendRequester);

//Converting base64 image data into a data binary
var base64toBlob = function(base64Data, contentType) {
    contentType = contentType || '';
    var sliceSize = 1024;
    var byteCharacters = window.atob(base64Data.split(',')[1]);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
}

//adding attachment to the correct table and incident report
 var sendAttachment = function(tableSysId, tableName) {
	//Getting the screenshot img location and Data
	var setScreenshotUrl = document.querySelector('#target').src;
	var binaryData = base64toBlob(setScreenshotUrl, "image/jpeg");
	
	//setting up request headers
	var fileAttachmentClient = new XMLHttpRequest();
	fileAttachmentClient.open("post", "https://dev60257.service-now.com/api/now/attachment/file?table_name=" + tableName + "&table_sys_id=" + tableSysId + "&file_name=IncidentScreenShot");
	fileAttachmentClient.setRequestHeader("Accept", "application/json");
	fileAttachmentClient.setRequestHeader("Content-Type", "image/jpeg");
	fileAttachmentClient.setRequestHeader('Authorization', 'Basic ' + btoa('admin' + ':' + 'JBtsE20JTobn'));

	fileAttachmentClient.send(binaryData);
}

//handles XMLHttp requst, POST
function sendRequester(){
	//values taken from form data including issue description and application name
	var requestDescription = document.querySelector('#issueDescription').value;

	//request template
	var tempRequest = {
		"assignment_group": {
			"link": "https://dev60257.service-now.com/api/now/table/sys_user_group/287ebd7da9fe198100f92cc8d1d2154e",
			"value": "287ebd7da9fe198100f92cc8d1d2154e"
		},
		"short_description": requestDescription,
		"urgency": '4',
		"impact": '5'
	}
	
	//return back as string to send to ServiceNow API
	var sendRequest = JSON.stringify(tempRequest);
	
	var client = new XMLHttpRequest();
	//opening connection to API at servicenow 
	client.open("POST", "https://dev60257.service-now.com/api/now/table/incident", true, "admin", "JBtsE20JTobn");
	
	//request headers settings
	client.setRequestHeader("Accept", "application/json");
	client.setRequestHeader("Content-Type","application/json");
		
	client.onreadystatechange = function() {
		if(this.readyState == this.DONE) {
			if(this.response != null)
			{
				var item = JSON.parse(this.response);
				var tableSysId = item.result.sys_id;
				var tableName = item.result.sys_class_name;

				document.querySelector("#sendInfo").innerHTML = "Ticket Created: " + item.result.number;
				sendAttachment(tableSysId, tableName);
			}
		}
	};

	client.send(sendRequest);
}