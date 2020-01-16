(function(){

  console.debug("[DEBUG] Content script running in: ", window.location.href);
  // getDataFromBackground();
  getSettingsFromBackground();

  const PRICEREGEX = /(\d+[\.,]\d{2}\s?[€])/gm;
  const PRICESELECTORS = ["span.a-price", "span.a-color-price"];

  // variables set via settings and data from background
  var SELECTEDSYMBOL = undefined;
  var CONVERSIONVALUE = undefined;


  /**
   *  iterates over all elements having a class listed
   *  in PRICESELECTORS
   */
  function findElements(data, callback){
    let currencyvalue = parseFloat(CONVERSIONVALUE);
    for (let selector of PRICESELECTORS){
      for (let node of document.querySelectorAll(selector)){
        let m = node.innerText.match(PRICEREGEX);
        if (m !== null){
          callback(node, currencyvalue);        
        }
      }      
    }
  }


  function addCryptoElement(node, currencyvalue){
    // get the euro value and convert it to iota
    let match = node.innerText.match(PRICEREGEX);
    let eurovalue = parseFloat(match[0].replace(",", ".").substr(0, match[0].length-1));
    let cryptovalue = eurovalue / currencyvalue;
    cryptovalue = cryptovalue.toFixed(3);
    // create a fragment to off-dom append a clone and append to orginal element's parent
    let parent = node.parentNode;
    let fragment = new DocumentFragment();

    let span = document.createElement("span");
    for (let cl of node.classList){
      span.classList.add(cl);
    }
    span.innerText = cryptovalue;
    span.style.border = "thin solid yellow";
    span.style.fontSize = "13pt";

    let img = document.createElement("img");  
    img.src = browser.runtime.getURL("icons/symbol_" + SELECTEDSYMBOL.toLowerCase() + ".png");
    img.style.height = "20px";
    img.alt = SELECTEDSYMBOL;

    span.appendChild(img);
    fragment.appendChild(span);
    parent.appendChild(fragment);
  }


  function highlight(node, currencyvalue){
    console.log(node);
    node.style.backgroundColor = "yellow";
  }


  /**
    find all elements that contain a monetary value, 
    calculate their values in crypto currencies and 
    display them on new element cloned from the original
  */
  function handleResponse(response){
    console.debug("[DEBUG] Received response from background script");
    console.debug("[DEBUG] response: ", response);

    if (response.originalrequest === "GETCRYPTOVALUES"){
      CONVERSIONVALUE = response.data[SELECTEDSYMBOL].EUR;  // set the current selected conversion value
      findElements(response.data, addCryptoElement);      
    }
    else if (response.originalrequest === "GETSETTINGS"){
      if (response.settings.enabled){
        SELECTEDSYMBOL = response.settings.symbol;  // set the current selected currency by symbol
        console.log("[INFO] selected crypto currency: ", SELECTEDSYMBOL);
        getDataFromBackground();
      } else {
        console.log("[INFO] FutureMoney: Conversion of prices is disabled! Turn back on via control panel!");
      }
    } else {
      console.error("[ERROR] Unable to handle response: ", response);
    }

  }


  /**
   *  Check if conversion is enabled, if so, get data and convert prices 
   */
  function getSettingsFromBackground(){
    browser.runtime.sendMessage( {url: window.location.href, request: "GETSETTINGS" } );
  }


  /** 
      Ask for the data from the background script
      The incomong reponse then triggers the addition
      of DOM elements and display of crypto values
  */
  function getDataFromBackground(){
    browser.runtime.sendMessage( {url: window.location.href, request: "GETCRYPTOVALUES" } );
  }

  // Listener
  browser.runtime.onMessage.addListener(handleResponse);
})();
