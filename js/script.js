

function writenNumber(european){
	$(".writen-number").each(function() {
			var value = $(this).parent().siblings(".value-input").val();
			source_val = parseFloat(value.replace(/,/g, '')).toFixed(8),
			// Assuming you want to change the text of a sibling element
			$(this).text(formatLargeNumber(source_val, european));
	});
}


function formatLargeNumber(num, isEuropean = false) {
    num = Number(num);
    if (isNaN(num)) {
        return 'Input must be a valid number';
    }

    // https://en.wikipedia.org/wiki/Long_and_short_scales
    const thresholds = isEuropean
        ? [
            { value: 1e21, word: 'trilliard' },
						{ value: 1e18, word: 'trillion' },       // European trillion
            { value: 1e15, word: 'billiard' },
            { value: 1e12, word: 'billion' },        // European billion
            { value: 1e9, word: 'milliard' },
            { value: 1e6, word: 'million' },
            { value: 1e3, word: 'thousand' }
        ]
        : [
            { value: 1e18, word: 'sextillion' },
						{ value: 1e18, word: 'quintillion' },
            { value: 1e15, word: 'quadrillion' },
            { value: 1e12, word: 'trillion' },       // Standard trillion
            { value: 1e9, word: 'billion' },         // Standard billion
            { value: 1e6, word: 'million' },
            { value: 1e3, word: 'thousand' }
        ];

    const isNegative = num < 0;
    num = Math.abs(num);

    for (const { value, word } of thresholds) {
        if (num >= value) {
            const rounded = Math.round(num / value);
            const symbol = (num !== rounded * value) ? '~' : ''; // Show '~' if num is not equal to rounded * value
            return `${isNegative ? '-' : ''}${symbol}${rounded} ${word}${rounded > 1 ? 's' : ''}`;
        }
    }
    return `${isNegative ? '-' : ''}${num}`;
}










$( document ).ready(function() {






	const url = new URL(window.location.href);
  if (url.searchParams.get('written') === 'true') {
      $('#written-number-check').prop('checked', true);
			$(".writen-number").animate({opacity: 1}, 100);
			$(".writen-number").animate({fontSize: '8px'}, 100);
  }

  $('#written-number-check').on('change', function() {
      const checkbox = $(this);
      const currentUrl = window.location.href;
      const url = new URL(currentUrl);
      if (checkbox.is(':checked')) {
          url.searchParams.set('written', 'true');
					$(".writen-number").animate({opacity: 1}, 100);
					$(".writen-number").animate({fontSize: '8px'}, 100);
      } else {
          url.searchParams.delete('written');
					$(".writen-number").animate({opacity: 0}, 100);
					$(".writen-number").animate({fontSize: '0px'}, 100);
      }
      window.history.pushState({}, '', url);
  });



	var european = false;
	if (url.searchParams.get('european') === 'true') {
			$('#european-check').prop('checked', true);
			european = true;
			writenNumber(european);
	}

	$('#european-check').on('change', function() {
			const checkbox = $(this);
			const currentUrl = window.location.href;
			const url = new URL(currentUrl);
			if (checkbox.is(':checked')) {
					url.searchParams.set('european', 'true');
					european = true;
					writenNumber(european);
			} else {
					url.searchParams.delete('european');
					european = false;
					writenNumber(european);
			}
			window.history.pushState({}, '', url);
	});



	Inputmask({}).mask(document.querySelectorAll("input"));




	var $currency_inputs = $(".value-input"),
		$btc_input = $(".bitcoin"),
		currency,
		btc_max_stock = 21000000



	var priceURL = "https://pvxg.net/bitcoin-price/index.php";

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
			sek: data.SEK, // Swedish krona
			sar: data.SAR, // Saudi riyal
			vef: data.VEF, // Venezuelan bolívar
			ars: data.ARS, // Argentine peso
		};


		calcConversion(0, "sat", true);
		setInterval( function() { calcConversion(0, "sat", true); }, (1000*60*5) );


		var currencyCodes = [
        "usd", "eur", "gbp", "cny", "jpy", "cad",
        "rub", "chf", "brl", "aed", "try", "aud",
        "mxn", "ils", "zar", "thb", 'inr', 'sek',
				'sar', /*'vef',*/ "ars"
    ];

    currencyCodes.forEach(function(code) {
        var satPerCurrency = 1 / (RateToBTC[code] / 1) * 100000000;
				var satsPerElement = $('<div>', {
		        html: "<span class='satsfiat'>"+satPerCurrency.toFixed(0)+"</span> sats per 1 " + code.toUpperCase()
		    });
		    $("#satsfiats").append(satsPerElement);
		});





		function calcConversion(source_val, source_currency, firstLoad){
			console.log("---")
			var	btc_input_value = parseFloat($btc_input.val().replace(/,/g, '')).toFixed(8);

			//set BTC max if user is editing BTC input
			if( btc_input_value > btc_max_stock ){
				btc_input_value = btc_max_stock
				$btc_input.val(btc_max_stock)
			}


			// Get convertion to BTC from the current currency

			if(source_currency == "sat"){

				if(firstLoad == true){
					var loadVal = 1;
					if (url.searchParams.get('sats') !== false) {
							$('#input_sat').val( url.searchParams.get('sats') );
							loadVal = url.searchParams.get('sats');
							$btc_input.val( parseFloat(loadVal / RateToBTC[source_currency]).toFixed(8) );
					}else{
						$btc_input.val( parseFloat(source_val / RateToBTC[source_currency]).toFixed(8) );
					}

				}else{
					$btc_input.val( parseFloat(source_val / RateToBTC[source_currency]).toFixed(8) );
				}

			}
			else if(source_currency == "btc"){
				btc_input_value = btc_input_value;
			}
			//else if(source_currency == "usd" || source_currency == "eur" || source_currency == "gbp" || source_currency == "cny" || source_currency == "jpy" || source_currency == "cad" || source_currency == "rub" || source_currency == "chf" || source_currency == "brl" || source_currency == "aed" ){
			else{
				console.log(RateToBTC[source_currency]);
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
			calcConversion( source_val, source_currency, false );

			writenNumber(european);

			url.searchParams.set('sats', parseFloat($(this).val().toString().replace(/,/g, '')).toFixed(0));
			window.history.pushState({}, '', url);

		});






		writenNumber(european);
		$currency_inputs.blur(function() {
			$(this).removeClass("active");
		});

	})



})
