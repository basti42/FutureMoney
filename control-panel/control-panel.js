 
const allowedSymbols = ["MIOTA"];
const allowedInputKeys = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 188, 190];

const calcButton = document.querySelector("#calc-button");
const switchButton = document.querySelector("#enableSwitch");
const fiatInput = document.querySelector("#fiat-userinput");
const cryptOutput = document.querySelector("#crypto-userinput");

var currentSymbol = undefined;
var currentValue = undefined;
var cryptodata = undefined;
var prevCryptodata = undefined;
var comparisonTolerance = 1E-3


calcDelta = (currValue, prevValue) => {
	return ((currValue - prevValue) * 100.0 / currValue).toFixed(2);
}


document.addEventListener("DOMContentLoaded", async ()=>{
	await getSettingsFromBackground();
	await getDataFromBackground();

});


/**
 * Builds up the overview table from the data and prev data
 * @param {object} data 
 * @param {object} prev 
 */
async function createCryptosTable(data, prev){

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
		let eur_td_wrapper = document.createElement("td");
		let eur_curr_value = data[symbol].EUR;
		let indicator_eur = document.createElement("span");
		indicator_eur.classList.add("margin-right");
		let arrow_eur = document.createElement("i");
		let e_delta = calcDelta(eur_curr_value, prev[symbol].EUR);
		if (!(e_delta > comparisonTolerance) && !(e_delta < -comparisonTolerance) ){
			indicator_eur.classList.add('nochange');
		} else if ( e_delta < comparisonTolerance){
			arrow_eur.classList.add("arrow", "down");
			indicator_eur.appendChild(arrow_eur);
		} else {
			arrow_eur.classList.add("arrow", "up");
			indicator_eur.appendChild(arrow_eur);
		}
		let eur_delta_td = document.createElement("span");
		eur_delta_td.classList.add("margin-right", "delta-information");
		eur_delta_td.innerText = "(" + e_delta + "%)";
		let eur = document.createElement("span");
		eur.innerText = eur_curr_value;
		eur_td_wrapper.appendChild(indicator_eur);
		eur_td_wrapper.appendChild(eur_delta_td);
		eur_td_wrapper.appendChild(eur);
		tr.appendChild(eur_td_wrapper);
		// usd conversion
		let usd_td_wrapper = document.createElement("td");
		let usd_curr_value = data[symbol].USD;
		let indicator_usd = document.createElement("span");
		indicator_usd.classList.add("margin-right");
		let arrow_usd = document.createElement("i");
		let u_delta = calcDelta(usd_curr_value, prev[symbol].USD);
		if (!(u_delta > comparisonTolerance) && !(u_delta < -comparisonTolerance) ){
			indicator_usd.classList.add('nochange');
		} else if (u_delta < comparisonTolerance){
			arrow_usd.classList.add("arrow", "down");
			indicator_usd.appendChild(arrow_usd);
		} else {
			arrow_usd.classList.add("arrow", "up");
			indicator_usd.appendChild(arrow_usd);
		}
		let usd_delta_td = document.createElement("span");
		usd_delta_td.classList.add("margin-right", "delta-information");
		usd_delta_td.innerText = "(" + u_delta + "%)";
		let usd = document.createElement("span");
		usd.innerText = usd_curr_value;
		usd_td_wrapper.appendChild(indicator_usd);
		usd_td_wrapper.appendChild(usd_delta_td);
		usd_td_wrapper.appendChild(usd);
		tr.appendChild(usd_td_wrapper);
		// chf conversion
		let chf_td_wrapper = document.createElement("td");
		let chf_curr_value = data[symbol].CHF;
		let indicator_chf = document.createElement("span");
		indicator_chf.classList.add("margin-right");
		let arrow_chf = document.createElement("i");
		let c_delta = calcDelta(chf_curr_value, prev[symbol].CHF);
		if (!(c_delta > comparisonTolerance) && !(c_delta < -comparisonTolerance) ){
			indicator_chf.classList.add('nochange');
		} else if (c_delta < comparisonTolerance){
			arrow_chf.classList.add("arrow", "down");
			indicator_chf.appendChild(arrow_chf);
		} else {
			arrow_chf.classList.add("arrow", "up");
			indicator_chf.appendChild(arrow_chf);
		}
		let chf_delta_td = document.createElement("span");
		chf_delta_td.classList.add("margin-right", "delta-information");
		chf_delta_td.innerText = "(" + c_delta +"%)"; 
		let chf = document.createElement("span");
		chf.innerText = chf_curr_value;
		chf_td_wrapper.appendChild(indicator_chf);
		chf_td_wrapper.appendChild(chf_delta_td);
		chf_td_wrapper.appendChild(chf);
		tr.appendChild(chf_td_wrapper);
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
	document.querySelector("#current-selected-crypto").innerText = currentSymbol;
	console.debug("[DEBUG] setup the control panel according to settings, current symbol: ", currentSymbol);
}


function handleResponse(response){
	console.log("[INFO] received data from background: ", response);
	if (response.originalrequest === "GETCRYPTOVALUES"){
		cryptodata = response.data;
		prevCryptodata = response.prevData;
		createCryptosTable(cryptodata, prevCryptodata);
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
	// and anywhere else on the site
	document.querySelector("#current-selected-crypto").innerText = currentSymbol;
}


async function handleDotClick(event){
	let target = event.target;
	// update the settings according to the id = symbol
	let d = { symbol: target.id, enabled: switchButton.checked };
	await browser.runtime.sendMessage({url: window.location.href, data: d, request: "UPDATESETTINGS"});	
	for (let tr of document.querySelectorAll("tbody>tr")){
		tr.remove();
	}
	setAndUpdateCurrentCrypto(d.symbol);
	createCryptosTable(cryptodata, prevCryptodata);
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