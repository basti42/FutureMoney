 
const allowedSymbols = ["MIOTA"];
const allowedInputKeys = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 188, 190];

const calcButton = document.querySelector("#calc-button");
const switchButton = document.querySelector("#enableSwitch");
const fiatInput = document.querySelector("#fiat-userinput");
const cryptOutput = document.querySelector("#crypto-userinput");

var currentSymbol = undefined;
var currentValue = undefined;
var cryptodata = undefined;


document.addEventListener("DOMContentLoaded", async ()=>{
	await getSettingsFromBackground();
	await getDataFromBackground();

});


function createCryptosTabel(data){
	let tbody = document.querySelector("#available-cryptos-table-body");
	let fragment = new DocumentFragment();
	for (let symbol in data){
		let tr = document.createElement("tr");
		// row number / radio button		
		let rb = document.createElement("th");
		rb.scope = "col";
		let circle = document.createElement("div");
		circle.classList.add("dot");
		circle.id = symbol;
		dotApplyEventListener(circle, handleDotClick);
	    rb.appendChild(circle);

		tr.appendChild(rb);
		// symbol name
		let sym = document.createElement("td");
		sym.innerText = symbol;
		tr.appendChild(sym);
		// euro conversion
		let eur = document.createElement("td");
		eur.innerText = data[symbol].EUR;
		tr.appendChild(eur);
		// usd conversion
		let usd = document.createElement("td");
		usd.innerText = data[symbol].USD;
		tr.appendChild(usd);
		// chf conversion
		let chf = document.createElement("td");
		chf.innerText = data[symbol].CHF;
		tr.appendChild(chf);
		if (symbol === currentSymbol){
			// highlight the currently selected symbol
			tr.classList.add("table-primary");
		}
		fragment.appendChild(tr);
	}
	tbody.appendChild(fragment);
}


function setUpdateDate(date){
	document.querySelector("#update-date").innerText = date.toLocaleString();
}


/**
 *	Apply the settings to the switch button, and remember the current symbol
 */
function applySettings(settings){
	currentSymbol = settings.symbol;
	switchButton.checked = settings.enabled;
	document.querySelector("#crypto-prepend").innerText = settings.symbol;
	console.debug("[DEBUG] setup the control panel according to settings, current symbol: ", currentSymbol);
}


function handleResponse(response){
	console.log("[INFO] received data from background: ", response);
	if (response.originalrequest === "GETCRYPTOVALUES"){
		cryptodata = response.data;
		createCryptosTabel(response.data);
		setUpdateDate(response.date);
		let c = (currentSymbol === undefined) ? "MIOTA" : currentSymbol;
		currentValue = parseFloat(response.data[c].EUR);		
	} else if (response.originalrequest === "GETSETTINGS"){
		console.debug("[DEBUG] ", response.settings);
		applySettings(response.settings);	
	}
}

function changeBrowserActionIcon(value){
	let something = "TODO";
}

/**
 * Refresh the current crypto (symbol and value) on the entire control panel
 */
function setAndUpdateCurrentCrypto(symbol){
	currentSymbol = symbol;
	currentValue = parseFloat(cryptodata[symbol].EUR);
	// set the values for the calculator
	document.querySelector("#crypto-prepend").innerText = currentSymbol;
	document.querySelector("#fiat-userinput").value = "";
	document.querySelector("#crypto-userinput").value = "";
}


async function handleDotClick(event){
	let target = event.target;
	console.log("Dot was clicked: ", target);
	// update the settings according to the id = symbol
	let d = { symbol: target.id, enabled: switchButton.checked };
	await browser.runtime.sendMessage({url: window.location.href, data: d, request: "UPDATESETTINGS"});	
	for (let tr of document.querySelectorAll("tbody>tr")){
		tr.remove();
	}
	setAndUpdateCurrentCrypto(d.symbol);
	createCryptosTabel(cryptodata);
}


/** 
  Ask for the data from the background script
  The incomong reponse then triggers the addition
  of DOM elements and display of crypto values
*/
async function getDataFromBackground(){
	browser.runtime.sendMessage( {url: window.location.href, request: "GETCRYPTOVALUES" } );
}

async function getSettingsFromBackground(){
	browser.runtime.sendMessage({url: window.location.href, request: "GETSETTINGS"});
}


// Listener
browser.runtime.onMessage.addListener(handleResponse);


calcButton.addEventListener("click", (event)=>{
	cryptOutput.value = "";								// clear crypto output
	let m = fiatInput.value.match(/^\d+[.,]?\d*$/);		// check the input with regex
	if (m !== null){									// convert and set the crypto output
		cryptOutput.value = parseFloat(m[0].replace(",", ".")) / currentValue;
	} else {											// clear everything
		fiatInput.value = "";
		cryptOutput.value = "";
	}
	event.preventDefault();
});


switchButton.addEventListener("change", async (event) => {	// toggle conversion
	let value = switchButton.checked;
	let d = { symbol: currentSymbol, enabled: value };
	await browser.runtime.sendMessage({url: window.location.href, data: d, request: "UPDATESETTINGS"});	
	// changeBrowserActionIcon(value); // TODO
});


function dotApplyEventListener(element, func){
	element.addEventListener("click", func);
}