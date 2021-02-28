( function(){

	const PRICE_TICKER_API = "https://api.bitpanda.com/v1/ticker";
	const DBNAME = "future-money-data-cache";
	const DBVERSION = 2;
	const CRYPTOSTORE = "cryptocurrencyvalues";
	const SETTINGSTORE = "settingstore";

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
		    	db = this.result;
		      console.log("[INFO] opening DB onupgradeneeded");
		      // cryptostore
		      var store = evt.currentTarget.result.createObjectStore(
		        CRYPTOSTORE, { keyPath: 'id', autoIncrement: true });
		      store.createIndex('id', 'id', { unique: true  });
		    
		      // settingstore
		      var settstore = evt.currentTarget.result.createObjectStore(
		      	SETTINGSTORE, {keyPath: 'id', autoIncrement: true });
		      settstore.createIndex('id', 'id', {unique: true });
		      settstore.createIndex('symbol', 'symbol', { unique: true });
		      settstore.createIndex('enabled', 'enabled', { unique: true });
		      // create default entries
		      settstore.transaction.oncomplete = function(e){
		      	let objs = db.transaction(SETTINGSTORE, 'readwrite').objectStore(SETTINGSTORE);
		      	objs.add({ symbol: 'MIOTA', enabled: true });
		      	console.log("[INFO] added default settings into db.");
		      };
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


	async function updateSettings(newsettings){
		let store = getObjectStore(SETTINGSTORE, 'readwrite');
		let req = store.get(1);
		req.onerror = (err) => { handleError(err); }
		req.onsuccess = (evt) => {
			let data = evt.target.result;
			data.symbol = newsettings.symbol;
			data.enabled = newsettings.enabled;
			let updatereq = store.put(data);
			updatereq.onsuccess = (e) => {
				console.log("[INFO] successfully updated settings.");
			};
			updatereq.onerror = (err) => { handleError(err); }

		}
	}


	/**
	 * 	Add new data from the API to the indexedDB as cache
	 *	@param {object} obj, the data to be stored
	 */
	async function addCryptoValues(obj){
		console.log("[INFO] Adding new data: ", obj);
		let store = getObjectStore(CRYPTOSTORE, 'readwrite');
		let req;
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
			if (lastIndex > 1){	// check if at least two entries are present in the indexedDB
				let req = store.getAll( IDBKeyRange.lowerBound(lastIndex-1));
				req.onsuccess = async () => {
					let entry = req.result;	// this is an array of the latest two entries
					console.log("TEST: ", entry);
					let now = new Date().getTime();
					let hour = 1000 * 60 * 60;
					let entryDate = entry[1].date.getTime();
					// console.log("Now: ", now, " - entryDate: ", entryDate, " diff: ", Math.abs(now-entryDate));
					// console.log("Hour: ", hour);
					let isNewEnough = Math.abs(now - entryDate) < hour;
					if (isNewEnough){
						console.log("[INFO] Returning cached data.");
						sendbackCallback({"date": entry[1].date, "data": entry[1].data, "prevDate": entry[0].date, "prevData": entry[0].data,
										  "taburl": originalMessage.url, "originalrequest": originalMessage.request});
					} else {
						let date = new Date();
						let data = await getApiData();
						console.log("[INFO] Outdated cache, returning new api data");
						let dataObj = {"date":date, "data":data, "taburl":originalMessage.url, "originalrequest": originalMessage.request};
						addCryptoValues(dataObj);
						dataObj["prevDate"] = entry[0].date;
						dataObj["prevData"] = entry[0].data;
						sendbackCallback(dataObj);
					}
				};
				req.onerror = (err)=> {handleError(err);};
			} else {
				let date = new Date();
				let data = await getApiData();
				console.log("[INFO] No cached results, returning new api data");
				let dataObj = {"date":date, "data":data, "taburl":originalMessage.url, "originalrequest": originalMessage.request};
				addCryptoValues(dataObj);
				let st = getObjectStore(CRYPTOSTORE, 'readonly');
				let cReq = st.count();
				cReq.onsuccess = async ()=> {
					let idx = cReq.result;
					if (idx > 1){
						let r = st.get(idx-1);
						r.onsuccess = async () => {
							let tmp = r.result;
							dataObj["prevDate"] = tmp.date;
							dataObj["prevData"] = tmp.data;
							sendbackCallback(dataObj);							
						}
					} else {
						dataObj["prevDate"] = date;
						dataObj["prevData"] = data;
						sendbackCallback(dataObj);							
					}
				}

			}
		};
		countRequest.onerror = (err) => {handleError(err);};
	}


	/**
	 *	return the stored settings for the application
	 * 	@param {object} 	originalMessage
	 * 	@param {function}	sendbackCallback
	 */
	async function returnSettings(originalMessage, sendbackCallback){
		let store = getObjectStore(SETTINGSTORE, 'readonly');
		let req = store.get(1);
		req.onsuccess = (evt) => {
			sendbackCallback({taburl: originalMessage.url, originalrequest: originalMessage.request, settings: evt.target.result});
		};
		req.onerror = (err) => { handleError(err); };
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
		if (message.request === "GETCRYPTOVALUES"){
			// cache the response object and send it back to the requestor
			await returnCryptoValues(message, sendResponse);			
		} else if (message.request === "GETSETTINGS"){
			// just return the already stored settings
			await returnSettings(message, sendResponse);
		} else if (message.request === "UPDATESETTINGS"){
			// update the settings with the data from the contol panel
			await updateSettings(message.data);
		} else {
			console.error("[ERROR] Unable to handle request from: ", message.url);
		}
	}



	// Execute on startup
	openDB();


	// Listener
	browser.runtime.onMessage.addListener(handleMessage);
  
}) ();
