// Global variable to store the active tab url
var activeTabUrl = "youtube.com";

// Global variable that stores the amount of time spent by the user on facebook.com and twitter.com
var totalTimeOnWebsites;

// Global variable to track whether the user is active or not
var isUserActive;

// Stores the current date or the days that have passed since the UTC till today
var today;

// Stores the name of the key that stores the data for the current date 
var todayStorageName;

// An array of strings that hold the domain names of the websites that are supposed to be checked
var websitesToTrack;

var isFirstRun = false;

// Returns the current website being used
function getActiveWebsite() {
    return extractDomain(activeTabUrl);
}

// Returns whether the user is active right now or not
function isUserActiveNow() {
    return isUserActive;
}

// Will check if this is the first time the extension has been run, if yes then sets the timeSpentOnWebsites to 0
chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        isFirstRun = true;
        // Initialize the data objec that is to be placed in the localStorage
        var data = {};

        // Assign initial values to the variables
        today = numDaysSinceUTC();
        todayStorageName = "timeData" + numDaysSinceUTC();
        totalTimeOnWebsites = 0;
        websitesToTrack = ["twitter.com", "facebook.com", "plus.google.com"];

        // Store the values in the localStorage
        data[todayStorageName] = totalTimeOnWebsites;
        data["today"] = numDaysSinceUTC();
        data["trackData"] = JSON.stringify(websitesToTrack);
        data["sitesLocked"] = false;
        chrome.storage.local.set(data, function(){});
    }
});

// Detect for change in storage and update the variables
chrome.storage.onChanged.addListener(function(){
    // update the websites to track variable
    chrome.storage.local.get("trackData", function(result){
        websitesToTrack = JSON.parse(result.trackData);
    });
});

startUp();

// Do all the startup tasks
function startUp() {
    //Initialize the totalTimeOnWebsites variable to the data gained from the local storage of the user
    chrome.storage.local.get(null, function(result){
        totalTimeOnWebsites = result["timeData" + numDaysSinceUTC()];
        today = result["today"];
        websitesToTrack = JSON.parse(result.trackData);
    });
    // Updating the ActiveTabUrl during initialization
    updateActiveTabUrl();

    // Register Events
    registerEvents(); // This one is important better left untouched

    // Setting isUserActive as true while starting up
    isUserActive = true;

    updateData();
    // Setting up the listener that will check if a new day is there
    setInterval(function(){
    if(isNewDay()){
        updateData();
      }
    }, 1000);

}



function updateData(){
    totalTimeOnWebsites = 0;
    var newStorageName = "timeData" + numDaysSinceUTC();
    var newData = {};
    newData[newStorageName] = totalTimeOnWebsites;
    todayStorageName = newStorageName;
    today = numDaysSinceUTC();
    newData["today"] = numDaysSinceUTC();
    chrome.storage.local.set(newData, function(){});
}

function registerEvents() {
    // Registering for onActivated event
    // This is fired when the active tab changes
    chrome.tabs.onActivated.addListener(function(activeInfo) {
        updateActiveTabUrl();
    });

    // Registering for onChanged event
    // This is fired when the url of a tab changes
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        updateActiveTabUrl();
    });

    // Registering for onFocusChanged event
    // This is fired when the active chrome window is changed.
    chrome.windows.onFocusChanged.addListener(function(windowId) {
        // This happens if all the windows are out of focus
        // Using this condition to infer that the user is inactive
        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            isUserActive = false;
        } else {
            isUserActive = true;
        }
        updateActiveTabUrl();
    });

    // Registering for an interval of 1s
    window.setInterval(intervalListener, 1000); // Keeps listening to the current events 
}

// Listener for the timer
function intervalListener() {
    updateTotalTime();
}


function updateTotalTime() {
    var currDomain = getActiveWebsite();  
    if(isUserActiveNow() && isWatchedWebsite(currDomain)){
        totalTimeOnWebsites += 1; 
    }
}


function isWatchedWebsite(domainName){
    return ($.inArray(domainName, websitesToTrack) > -1);
}

// Returns the last time when the timeMap has been refresehed
function getLastRefreshTime() {
    return lastRefreshTimeStamp;
}

// Finds the current tab in the current window
// Updates the activeTabUrl global variable
function updateActiveTabUrl() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) { // The argument of the call back function is an array of tabs
        if (tabs.length < 1) { // If there are no tabs in the window, how the fuck is that possible ? let us see
            activeTabUrl = "facebook.com";
        } else {
            activeTabUrl = tabs[0].url;
        }
    });
}

function extractDomain(str) {
    // Removing the protocol and www prefixes
    var strList = str.split(":\/\/");
    if (strList.length > 1) {
        str = strList[1];
    } else {
        str = strList[0];
    }
    str = str.replace(/www\./g,'');
    
    // Extracting the domain name from full URL
    var domainName = str.split('\/')[0];
    return domainName;
}

function getTimeOnFbTwitter(){
    return totalTimeOnWebsites;
}


function numDaysSinceUTC(){
    var NUM_MILI_IN_A_DAY = 86400000;
    var today = new Date();
    var utcMili = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()); // miliseconds since UTC
    return (utcMili/ NUM_MILI_IN_A_DAY);
}


function isNewDay(){
    return (numDaysSinceUTC() - today >= 1);
}

function todayTimeData(){
    return todayStorageName;
}





