
const allowedSymbols = ["MIOTA"];
const allowedInputKeys = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 188, 190];

const calcButton = document.querySelector("#calc-button");
const fiatInput = document.querySelector("#fiat-userinput");
const cryptOutput = document.querySelector("#crypto-userinput");

var currentSymbol = undefined;
var currentValue = undefined;


document.addEventListener("DOMContentLoaded", ()=>{
	getDataFromBackground();
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
		fragment.appendChild(tr);
	}
	tbody.appendChild(fragment);
}


function setUpdateDate(date){
	document.querySelector("#update-date").innerText = date.toLocaleString();
}


function handleResponse(response){
	console.log("[INFO] received data from background: ", response);
	createCryptosTabel(response.data);
	setUpdateDate(response.date);
	currentValue = parseFloat(response.data.MIOTA.EUR);
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


calcButton.addEventListener("click", (event)=>{
	cryptOutput.value = "";								// clear crypto output
	let m = fiatInput.value.match(/^\d+[.,]?\d*$/);		// check the input with regex
	console.log(m, currentValue);
	if (m !== null){									// convert and set the crypto output
		cryptOutput.value = parseFloat(m[0].replace(",", ".")) / currentValue;
	} else {											// clear everything
		fiatInput.value = "";
		cryptOutput.value = "";
	}
	event.preventDefault();
});

