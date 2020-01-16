![alt text](https://github.com/basti42/FutureMoney/blob/master/icons/futuremoney48px.png "FutureMoney") <h2>FutureMoney</h2>

>tl;dr;  
>Browser Extension that displays the crypto currency value next to euro prices on amazon.

### About
The future of money could very well be cryptocurrencies. To get a better feel for them, this addon displays the converted cryptocurrency value next to the euro prices on several European amazon-domains. You can choose your favorite cryptocurrency from more than 30 available on this extension.

The goal is to raise awareness of cryptocurrencies. Displaying them next to items and their respective fiat currency values makes their value more palpable. Especially for people just getting into cryptocurrencies.  

This extension does only display cryptocurrency values, it does not provide any way to buy, sell or trade in these cryptocurrencies.

If you like this extension please feel free to [rate it](https://addons.mozilla.org/en-US/firefox/addon/futuremoney/?src=search) &#9733; &#9733; &#9733; &#9733; &#9733; ! 

### Features
* A calculator is provided via the control panel for some manual conversion in the selected cryptosurrency, if you so desire  
* If a €-price is found on a European amazon-domain, it will automatically be converted to the selected cryptocurrency value and be displayed next to the €-price.

### Credits
The data for conversion is obtained from [BitPandas Price Ticker](https://api.bitpanda.com/v1/ticker). To avoid spamming this endpoint, a request is cached on the client via IndexedDB. A new request to the API is made only once per hour.  
The control panel was build using [Bootstrap](https://getbootstrap.com/).  

### FAQ
