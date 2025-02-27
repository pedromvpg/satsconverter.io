

$( document ).ready(function() {

	Inputmask().mask(document.querySelectorAll("input"));

	var $currency_inputs = $(".value-input"),
		$btc_input = $(".bitcoin"),
		currency,
		btc_max_stock = 21000000



	var priceURL = "https://pvxg.net/bitcoin-price/";

	$.getJSON( priceURL, function( data ) {

		console.log(data)

		var RateToBTC = {
			sat: 100000000,
			btc: 1,
			usd: data.USD, // U.S. Dollar
			eur: data.EUR, // Euro
			gbp: data.GBP, // Sterling
			cny: data.CNY, // Renminbi
			jpy: data.JPY, // Japanese yen
			cad: data.CAD, // Canadian dol
			chf: data.CHF, // Swiss franc
			rub: data.RUB, // Russina rubl
			brl: data.BRL, // Brazilian real
			aed: data.AED, // UAE dirham
			try: data.TRY, // Turkish lira
			aud: data.AUD, // Australian dollar
			nok: data.NOK, // Norwegian krone
			mxn: data.MXN, // Mexican peso
			thb: data.THB, // Thai baht
			ils: data.ILS, // Israeli new shekel
			inr: data.INR, // Indian rupee
			zar: data.ZAR, // South Africa rand
			dkk: data.DKK, // Danish krone
			pln: data.PLN, // Polish złoty
			sek: data.SEK  // Swedish krona
		};

		calcConversion();


		var currencyCodes = [
        "usd", "eur", "gbp", "cny", "jpy", "cad",
        "rub", "chf", "brl", "aed", "try", "aud",
        "mxn", "ils", "zar", "thb", 'inr', 'sek'
    ];

    currencyCodes.forEach(function(code) {
        var satPerCurrency = 1 / (RateToBTC[code] / 1) * 100000000;
				var satsPerElement = $('<div>', {
		        html: "<span class='satsfiat'>"+satPerCurrency.toFixed(0)+"</span> sats per 1 " + code.toUpperCase()
		    });
		    $("#satsfiats").append(satsPerElement);
		});





		function calcConversion(source_val, source_currency){

			var	btc_input_value = parseFloat($btc_input.val().replace(/,/g, '')).toFixed(8);

			//set BTC max if user is editing BTC input
			if( btc_input_value > btc_max_stock ){
				btc_input_value = btc_max_stock
				$btc_input.val(btc_max_stock)
			}


			// Get convertion to BTC from the current currency

			if(source_currency == "sat"){
				$btc_input.val( parseFloat(source_val / RateToBTC[source_currency]).toFixed(8) );
			}
			else if(source_currency == "btc"){
				btc_input_value = btc_input_value;
			}
			else if(source_currency == "usd" || source_currency == "eur" || source_currency == "gbp" || source_currency == "cny" || source_currency == "jpy" || source_currency == "cad" || source_currency == "rub" || source_currency == "chf" || source_currency == "brl" || source_currency == "aed" ){
				console.log(RateToBTC[source_currency])
				$btc_input.val( parseFloat( parseFloat(source_val) / parseFloat(RateToBTC[source_currency]) ).toFixed(8) );
			}

			// Updates BTC value
			btc_input_value = parseFloat($btc_input.val().replace(/,/g, '')).toFixed(8);

			// Updates all inputs depending on its rate to BTC
			$(".value-input:not('.active, .bitcoin')").each(function(){
				currency = $(this).data("currency");
				$(this).val( RateToBTC[currency] * btc_input_value );

				(( RateToBTC['sat'] * btc_input_value ) == 1) ? $("#sats-label").text('⚪️ sat') : $("#sats-label").text('⚪️ sats');
			})

		};

		$currency_inputs.keyup(function(e) {

			var source_val = parseFloat($(this).val().replace(/,/g, '')).toFixed(8),
				source_currency = $(this).data("currency");

			$(this).addClass("active");
			calcConversion( source_val, source_currency );

		})

		$currency_inputs.blur(function() {
			$(this).removeClass("active");
		});

	})

})
