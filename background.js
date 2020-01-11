( function(){

	const PRICE_TICKER_API = "https://api.bitpanda.com/v1/ticker";
	const DBNAME = "future-money-data-cache";
	const DBVERSION = 1;
	const CRYPTOSTORE = "cryptocurrencyvalues";

	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	var db;

	/* ----------------------     DB CACHE     -------------------------------- */
	/**
		opens the initial db connection to cache
		the retrieved api data. Limit the number of api requests.
	*/
	function openDB(){
		console.log("[INFO] opening DB ...");
		    var req = indexedDB.open(DBNAME, DBVERSION);
		    req.onsuccess = function (evt) {
		      // Equal to: db = req.result;
		      db = this.result;
		      console.log("[INFO] opening DB DONE");
		    };
		    req.onerror = function (evt) {
		      console.error("openDb:", evt.target.errorCode);
		    };

		    req.onupgradeneeded = function (evt) {
		      console.log("[INFO] opening DB onupgradeneeded");
		      var store = evt.currentTarget.result.createObjectStore(
		        CRYPTOSTORE, { keyPath: 'id', autoIncrement: true });

		      store.createIndex('id', 'id', { unique: true  });
		    };
	}

	/**
   	 * @param {string} store_name
   	 * @param {string} mode either "readonly" or "readwrite"
   	 */
	function getObjectStore(store_name, mode) {
	  var tx = db.transaction(store_name, mode);
	  return tx.objectStore(store_name);
	}


	/**
	 * 	Add new data from the API to the indexedDB as cache
	 *	@param {object} obj, the data to be stored
	 */
	async function addCryptoValues(obj){
		console.log("[INFO] Adding new data: ", obj);
		let store = getObjectStore(CRYPTOSTORE, 'readwrite');
		let req
		try {
			req = store.add(obj);			
		} catch (e) {
      		if (e.name == 'DataCloneError'){ handleError(e); }
      	}
		req.onsuccess = function(evt){
			console.log("[INFO] successfully added data to ", CRYPTOSTORE);
		};
		req.onerror = function(){
			console.error("[Error] adding data ", this.error);
		};
	}


	/**
	 *	call the bitpanda price ticker api to obtain new data
	 */
	async function getApiData(){
		let response = await fetch(PRICE_TICKER_API);
		return await response.json();
	}


	/**
	 *	First check if the latest cached entry is valid
	 * 	else make a new api request to be cached and send back
	 *	@param {object} 	originalMessage, the message that made the request
	 *	@param {function}	sendbackCallback, method to be called with the response
	 */
	async function returnCryptoValues(originalMessage, sendbackCallback){
		let store = getObjectStore(CRYPTOSTORE, 'readonly');
		let countRequest = store.count();
		countRequest.onsuccess = async ()=>{
			let lastIndex = countRequest.result;
			if (lastIndex > 0){
				let req = store.get(lastIndex);
				req.onsuccess = async () => {
					let entry = req.result;
					let now = new Date().getTime();
					let hour = 1000 * 60 * 60;
					let entryDate = entry.date.getTime();
					// console.log("Now: ", now, " - entryDate: ", entryDate, " diff: ", Math.abs(now-entryDate));
					// console.log("Hour: ", hour);
					let isNewEnough = Math.abs(now - entryDate) < hour;
					if (isNewEnough){
						console.log("[INFO] Returning cached data.");
						sendbackCallback({"date": entry.date, "data": entry.data, "taburl": originalMessage.url});
					} else {
						let date = new Date();
						let data = await getApiData();
						console.log("[INFO] Outdated cache, returning new api data");
						let dataObj = {"date":date, "data":data, "taburl":originalMessage.url};
						addCryptoValues(dataObj);
						sendbackCallback(dataObj);
					}
				};
				req.onerror = (err)=> {handleError(err);};
			} else {
				let date = new Date();
				let data = await getApiData();
				console.log("[INFO] No cached results, returning new api data");
				let dataObj = {"date":date, "data":data, "taburl":originalMessage.url};
				addCryptoValues(dataObj);
				sendbackCallback(dataObj);
			}
		};
		countRequest.onerror = (err) => {handleError(err);};
	}


	/* ---------------------- MESSAGE HANDLING -------------------------------- */

	/* Generic error handling */
	function handleError(error){
		console.error("[ERROR] ", error);
	}

	/**
		Finds the requesting tab and sends back 
		the response object to its content script
	*/
	async function sendResponse(msgObj){
		console.debug("[DEBUG] Response message: ", msgObj);
		let query = browser.tabs.query({active: true, currentWindow: true});
		query.then((tabs) => {
			for (let tab of tabs){
				if (tab.url === msgObj.taburl){
					browser.tabs.sendMessage(tab.id, msgObj);
				}
			}
		}, handleError);
	}

	/**
		request the data from the Bitpanda Price Ticker
		build up a response object and send it back to 
		the requesting tab
	*/
	async function handleMessage(message){
		console.debug("[DEBUG] Message from: ", message.url);	
		// save a response object and send it back to the requestor
		await returnCryptoValues(message, sendResponse);
	}



	// Execute on startup
	openDB();


	// Listener
	browser.runtime.onMessage.addListener(handleMessage);
  
}) ();
