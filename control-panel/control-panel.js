
const allowedSymbols = ["MIOTA"];
const allowedInputKeys = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 188, 190];

const calcButton = document.querySelector("#calc-button");
const switchButton = document.querySelector("#enableSwitch");
const fiatInput = document.querySelector("#fiat-userinput");
const cryptOutput = document.querySelector("#crypto-userinput");

var currentSymbol = undefined;
var currentValue = undefined;


document.addEventListener("DOMContentLoaded", async ()=>{
	await getSettingsFromBackground();
	await getDataFromBackground();

});


function createCryptosTabel(data){
	let tbody = document.querySelector("#available-cryptos-table-body");
	let fragment = new DocumentFragment();
	for (let symbol in data){
		let tr = document.createElement("tr");
		// row number		
		let row = document.createElement("th");
		row.scope = "col";
		tr.appendChild(row);
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
		// apend to fragment
		if (!allowedSymbols.includes(symbol)){
			tr.style.color = "lightgrey";
		}
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
	console.debug("[DEBUG] setup the control panel according to settings, current symbol: ", currentSymbol);
}


function handleResponse(response){
	console.log("[INFO] received data from background: ", response);
	if (response.originalrequest === "GETCRYPTOVALUES"){
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



