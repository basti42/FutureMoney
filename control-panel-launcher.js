var landingPage = "/control-panel/index.html";

var browser;
if (typeof InstallTrigger !== 'undefined'){ // firefox
  browser = browser;
} else if (!!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)) { // chrome
  browser = chrome;
}


/************      utiilitiy functions      ************/
function focusOrOpenLandigpageInTab(url){
  browser.tabs.query({}, (tabs)=>{
    let isOpen = false;
    for (let i=tabs.length-1; i>=0; i--){
      if (tabs[i].url.includes(url)) {
        // the url is already open in this tab
        isOpen = true;
        browser.tabs.update(tabs[i].id, {active: true});
        break;
      }
    }
    if (!isOpen){ // the url was not yet open
        browser.tabs.create({url: url});
        return true;
    }
  });
  return false;
}


/************      setup functions      ************/

// create a new tab and open the landing page
// for the interaction with the application
function setupLandingPage(event){
  return focusOrOpenLandigpageInTab(landingPage);
}


// main starting point
// from here on a tab with the landing page should be created
// an initial database connection established before the
// landing page is displayed
browser.browserAction.onClicked.addListener(setupLandingPage);
