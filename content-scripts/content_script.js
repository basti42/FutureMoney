(function(){

  console.debug("[DEBUG] Content script running in: ", window.location.href);
  getDataFromBackground();

  const PRICEREGEX = /(\d+[\.,]\d{2}\s?[€£$])/gm;
  const PRICESELECTORS = ["span.a-price", "span.a-color-price"];

  function findElements(data, callback){
    let currencyvalue = parseFloat(data.MIOTA.EUR)
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
    console.log(eurovalue, cryptovalue);


    let parent = node.parentNode;
    let fragment = new DocumentFragment();

    let span = document.createElement("span");
    for (let cl of node.classList){
      span.classList.add(cl);
    }
    span.innerText = cryptovalue;
    span.style.border = "thin solid yellow";
    span.style.fontSize = "14pt";

    let img = document.createElement("img");  
    img.src = browser.runtime.getURL("icons/symbol_iota.png");
    img.style.width = "25px";
    //img.alt = "MIOTA";

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
    console.log("[DEBUG] Received response from background script");
    console.log("[DEBUG] response: ", response);

    // TODO
    findElements(response.data, addCryptoElement);
  }


  /** 
      Ask for the data from the background script
      The incomong reponse then triggers the addition
      of DOM elements and display of crypto values
  */
  function getDataFromBackground(){
    browser.runtime.sendMessage( {"url": window.location.href, "key": "getData" } );
  }

  // Listener
  browser.runtime.onMessage.addListener(handleResponse);
})();
