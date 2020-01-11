(function(){

  /* - - - - - - - - - - Database backend - - - - - - - - - - */
  const DBNAME = "FutureMoneyDB";
  const BTCSTORE = "BitCoinValues";
  const ETHSTORE = "EthereumValues";
  const DBVERSION = 1;
  var db;

  async function initialize(){
    await openDB().then(msg => console.log(msg)).catch(err => console.error(err));
  }


  /**
   *  Opens an a connection to the indexeddb
   *  and stores the connection into the global variable "db"
   */
  function openDB(){
    console.debug("[DEBUG] Opening IndexedDB ... ");
    return new Promise((resolve, reject) => {
      let request = window.indexedDB.open(DBNAME, DBVERSION);
      request.onsuccess = function(event){
        db = this.result;
        let msg = "[DEBUG] Successfully opened IndexedDB";
        console.debug(msg);
        resolve(msg);
      };
      request.onerror = function(error){
        let msg = "[ERROR] while opening IndexedDB: " + error.target.errorCode;
        console.error(msg);
        reject(msg);
      };
      request.onupgradeneeded = function(event){
        console.debug("[DEBUG] initializing or upgrading indexedDB");
        // create bitcoin store
        let btcstore = event.currentTarget.result.createObjectStore(
          BTCSTORE, { keyPath: 'id', autoIncrement: true });
        // index for this objectstore is the id
        btcstore.createIndex('id', 'id', { unique: true });

        // create ethereum store
        let ethstore = event.currentTarget.result.createObjectStore(
          ETHSTORE, { keyPath: 'id', autoIncrement: true });
        // index for this objectstore is the id
        ethstore.createIndex('id', 'id', { unique: true });
        resolve("initialized and upgraded database");
      };
    });
  }

  /**
   *  Returns the objectstore by name
   *  and with the requested permission
   */
  function getObjectStore(store_name, mode) {
    var tx = db.transaction(store_name, mode);
    return tx.objectStore(store_name);
  }

  /**
   *  Adding data to the objectStore and providing
   *  a callback to do something with the data afterwards
   */
  function addApiData(objStoreName, data, callback=undefined){
    console.log("[INFO] adding new data to the indexedDB.");
    let store = getObjectStore(objStoreName, "readwrite");
    let request = store.add(data);
    request.onsuccess = function(event){
      console.log("[INFO] Successfully added: ", data);
      if (callback !== undefined){
        callback(data);
      }
    };
    request.onerror = function(error){
      console.error("[ERROR] adding data to indexedDB");
    };
  }


  /* - - - - - - - - - - Request Infos from the API - - - - - - - - - - */

  // https://developers.coinbase.com/api/v2#get-spot-price is the API Endpoint
  // for the CoinBase prices API. No permission is required.
  const api_baseurl = "https://api.coinbase.com/v2/prices/";
  const bitpandapriceticker = "https://api.bitpanda.com/v1/ticker";
  // TODO maybe use the price ticker instead of the prices api from coinbase

  /**
   *  fetch the current BTC price with respect to the
   *  provided reference and return the api data object
   */
  async function getBtcPrice(reference="EUR"){
    let request = await fetch(api_baseurl + "BTC-" + reference +"/spot");
    let d = new Date();  // add a timestamp without requesting the api again
    let data = await request.json();
    data.data.date = d;
    return data.data;
  }


  /* - - - - - - - - - - Update Control Panel UI - - - - - - - - - - */
  function displayCurrentPrices(data){
      document.querySelector("#message").innerText = "1 € = " + data.amount + " BTC";
  }



  /* - - - - - - - - - - Start Execution - - - - - - - - - - */

  window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  if (!window.indexedDB) {
    console.error("Your browser doesn't support a stable version of IndexedDB, which this application relies upon.");
    console.error("Consider upgrading your browser or use a browser which supports IndexedDB, like FireFox");
  }

  console.log("DB before it is initialized: ", db);
  // TODO make sure this is done before anything else is called !!!!
  initialize();
  console.log("DB after initialization: ", db);

  getBtcPrice()
    .then((data) => {
      console.log(data);
      addApiData(BTCSTORE, data, displayCurrentPrices);
    })
    .catch((error) => console.error("[ERROR] something went wrong"));

    setTimeout( () => console.log(getObjectStore(BTCSTORE, "readonly")), 3000);

}) ();
