

document.addEventListener("DomContentLoaded", ()=>{
	getDataFromBackground();
});


function handleResponse(response){
	console.log(response);
	document.querySelector("#test").innerText = response;
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
