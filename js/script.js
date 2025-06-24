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

	// Math Expression Parser
	function parseMathExpression(input) {
		// Remove commas and extra spaces
		input = input.replace(/[, ]/g, '');
		
		// Check if input contains math operators
		if (/[\+\-\*\/]/.test(input)) {
			try {
				// Validate the expression - only allow numbers and basic operators
				if (/^[\d\+\-\*\/\.\(\)]+$/.test(input)) {
					// Check for division by zero
					if (input.includes('/0') && !input.includes('/0.')) {
						return null; // Division by zero
					}
					
					// Evaluate the expression
					var result = eval(input);
					
					// Check if result is valid number
					if (isFinite(result) && !isNaN(result)) {
						return result;
					}
				}
			} catch (e) {
				// Invalid expression, return null
				return null;
			}
		}
		
		// No math expression or invalid, return original input
		var parsed = parseFloat(input.replace(/[, ]/g, ''));
		return isNaN(parsed) ? 0 : parsed;
	}

	// Drag and Drop Currency Reordering
	function initializeDragAndDrop() {
		// Get saved order from URL params only
		var savedOrder = getSavedOrder();
		
		// Apply saved order to DOM
		if (savedOrder && savedOrder.length > 0) {
			applyOrder(savedOrder);
		}
		
		// Initialize SortableJS
		var fiatContainer = document.getElementById('fiat-container');
		if (fiatContainer) {
			Sortable.create(fiatContainer, {
				animation: 150,
				ghostClass: 'sortable-ghost',
				chosenClass: 'sortable-chosen',
				dragClass: 'sortable-drag',
				onEnd: function(evt) {
					saveOrder();
				}
			});
		}
	}
	
	function getSavedOrder() {
		// Try URL parameters only
		var urlParams = new URLSearchParams(window.location.search);
		var orderParam = urlParams.get('order');
		
		if (orderParam) {
			return orderParam.split(',').filter(function(currency) {
				return document.getElementById('input_' + currency);
			});
		}
		
		// Return default order (current DOM order)
		return getCurrentOrder();
	}
	
	function getCurrentOrder() {
		var order = [];
		$('#fiat-container .field.fiat').each(function() {
			var currency = $(this).find('.value-input').data('currency');
			if (currency) {
				order.push(currency);
			}
		});
		return order;
	}
	
	function applyOrder(order) {
		var container = $('#fiat-container');
		order.forEach(function(currency) {
			var element = $('#input_' + currency).closest('.field.fiat');
			if (element.length) {
				container.append(element);
			}
		});
	}
	
	function saveOrder() {
		var order = getCurrentOrder();
		var orderString = order.join(',');
		
		// Update URL parameter only
		var url = new URL(window.location.href);
		url.searchParams.set('order', orderString);
		window.history.pushState({}, '', url);
	}

	// Initialize drag and drop
	initializeDragAndDrop();

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



	// Custom formatting system to replace Inputmask
	var isProgrammaticUpdate = false; // Flag to prevent input handler interference
	
	function formatNumber(value, currency) {
		if (currency === "sat") {
			// Satoshis: whole numbers with commas
			return Math.round(parseFloat(value) || 0).toLocaleString();
		} else if (currency === "btc") {
			// Bitcoin: 8 decimal places
			return (parseFloat(value) || 0).toFixed(8);
		} else {
			// Fiat: 2 decimal places with commas
			return (parseFloat(value) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		}
	}

	function unformatNumber(value) {
		// Remove commas and convert to number
		return parseFloat(value.replace(/,/g, '')) || 0;
	}

	// Apply initial formatting to all inputs
	$(".value-input").each(function() {
		var $input = $(this);
		var currency = $input.data("currency");
		var currentValue = $input.val();
		
		if (currentValue && currentValue !== '0.00000001') {
			isProgrammaticUpdate = true;
			$input.val(formatNumber(currentValue, currency));
			isProgrammaticUpdate = false;
		}
	});

	// Handle input without real-time formatting
	$(".value-input").on('input', function(e) {
		if (isProgrammaticUpdate) return; // Skip if this is a programmatic update
		
		var $input = $(this);
		var value = $input.val();
		var currency = $input.data("currency");
		
		// Check if this is a math expression
		if (/[\+\-\*\/\(\)]/.test(value)) {
			// Math mode - don't format, just add visual feedback
			$input.addClass('math-mode');
			$input.removeClass('math-calculating');
		} else {
			// Normal mode - remove math mode but don't format yet
			$input.removeClass('math-mode');
			
			// Validate input - only allow numbers, decimals, and commas
			var cleanValue = value.replace(/[^\d.,]/g, '');
			
			// Handle multiple decimal points - keep only the first one
			var parts = cleanValue.split('.');
			if (parts.length > 2) {
				cleanValue = parts[0] + '.' + parts.slice(1).join('');
			}
			
			// Handle multiple commas - remove all but keep structure
			cleanValue = cleanValue.replace(/,/g, '');
			
			// Update value if it changed
			if (cleanValue !== value) {
				var cursorPos = $input[0].selectionStart;
				var valueBeforeCursor = value.substring(0, cursorPos);
				var commasBeforeCursor = (valueBeforeCursor.match(/,/g) || []).length;
				var cleanValueBeforeCursor = cleanValue.substring(0, cursorPos - commasBeforeCursor);
				
				$input.val(cleanValue);
				
				// Restore cursor position
				setTimeout(function() {
					var newCursorPos = Math.min(cleanValueBeforeCursor.length, cleanValue.length);
					$input[0].setSelectionRange(newCursorPos, newCursorPos);
				}, 0);
			}
		}
		
		// Check if user is trying to type math operators as text
		if (value.includes('plus') || value.includes('minus') || value.includes('times') || value.includes('divide')) {
			var newValue = value
				.replace(/plus/g, '+')
				.replace(/minus/g, '-')
				.replace(/times/g, '*')
				.replace(/divide/g, '/');
			
			if (newValue !== value) {
				$input.val(newValue);
				$input.addClass('math-mode');
			}
		}
	});

	// Handle paste events for math operators
	$(".value-input").on('paste', function(e) {
		var $input = $(this);
		var pastedText = (e.originalEvent || e).clipboardData.getData('text/plain');
		
		if (/[\+\-\*\/\(\)]/.test(pastedText)) {
			e.preventDefault();
			var currentValue = $input.val();
			var cursorPos = $input[0].selectionStart;
			
			// Add the pasted text at cursor position
			var newValue = currentValue.slice(0, cursorPos) + pastedText + currentValue.slice(cursorPos);
			$input.val(newValue);
			$input.addClass('math-mode');
			
			// Set cursor position after the pasted text
			setTimeout(function() {
				$input[0].setSelectionRange(cursorPos + pastedText.length, cursorPos + pastedText.length);
				$input.focus();
			}, 0);
		}
	});

	// Handle Enter key to compute and blur
	$(".value-input").on('keydown', function(e) {
		if (e.keyCode === 13) { // Enter key
			e.preventDefault();
			var $input = $(this);
			var value = $input.val();
			var currency = $input.data("currency");
			
			// Check if this is a math expression
			if (/[\+\-\*\/\(\)]/.test(value)) {
				var calculatedValue = parseMathExpression(value);
				
				if (calculatedValue !== null) {
					// Format the calculated result
					isProgrammaticUpdate = true;
					var formattedResult = formatNumber(calculatedValue, currency);
					$input.val(formattedResult);
					$input.removeClass('math-mode');
				}
			} else {
				// Format the number
				isProgrammaticUpdate = true;
				var formattedResult = formatNumber(value, currency);
				$input.val(formattedResult);
			}
			
			// Blur the field
			$input.blur();
			
			// Reset the flag after a short delay to allow blur event to complete
			setTimeout(function() {
				isProgrammaticUpdate = false;
			}, 10);
		}
	});

	// Handle blur event to format numbers
	$(".value-input").on('blur', function(e) {
		if (isProgrammaticUpdate) return; // Skip if this is a programmatic update
		
		var $input = $(this);
		var value = $input.val();
		var currency = $input.data("currency");
		
		// Check if this is a math expression
		if (/[\+\-\*\/\(\)]/.test(value)) {
			var calculatedValue = parseMathExpression(value);
			
			if (calculatedValue !== null) {
				// Format the calculated result
				isProgrammaticUpdate = true;
				var formattedResult = formatNumber(calculatedValue, currency);
				$input.val(formattedResult);
				$input.removeClass('math-mode');
				isProgrammaticUpdate = false;
			}
		} else if (value && value.trim() !== '') {
			// Format the number
			isProgrammaticUpdate = true;
			var formattedResult = formatNumber(value, currency);
			$input.val(formattedResult);
			isProgrammaticUpdate = false;
		}
	});

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


		// Handle URL parameters for initial loading
		var urlParams = url.searchParams;
		var loadedCurrency = null;
		var loadedValue = null;
		
		// Check for sats parameter first (legacy support)
		if (urlParams.get('sats')) {
			loadedCurrency = 'sat';
			loadedValue = urlParams.get('sats');
		} else {
			// Check for other currency parameters
			var currencyCodes = [
				"usd", "eur", "gbp", "cny", "jpy", "cad",
				"rub", "chf", "brl", "aed", "try", "aud",
				"mxn", "ils", "zar", "thb", 'inr', 'sek',
				'sar', /*'vef',*/ "ars"
			];
			
			for (var i = 0; i < currencyCodes.length; i++) {
				var code = currencyCodes[i];
				if (urlParams.get(code)) {
					loadedCurrency = code;
					loadedValue = urlParams.get(code);
					break;
				}
			}
		}
		
		// If we found a currency parameter, load it
		if (loadedCurrency && loadedValue) {
			$('#input_' + loadedCurrency).val(loadedValue);
			calcConversion(parseFloat(loadedValue), loadedCurrency, false);
		}





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
			var	btc_input_value = parseFloat($btc_input.val().replace(/,/g, '')).toFixed(8);

			//set BTC max if user is editing BTC input
			if( btc_input_value > btc_max_stock ){
				btc_input_value = btc_max_stock
				isProgrammaticUpdate = true;
				$btc_input.val(btc_max_stock)
				isProgrammaticUpdate = false;
			}


			// Get convertion to BTC from the current currency

			if(source_currency == "sat"){
				isProgrammaticUpdate = true;
				var newBtcValue = parseFloat(source_val / RateToBTC[source_currency]).toFixed(8);
				$btc_input.val(newBtcValue);
				isProgrammaticUpdate = false;
			}
			else if(source_currency == "btc"){
				btc_input_value = btc_input_value;
			}
			else{
				isProgrammaticUpdate = true;
				var newBtcValue = parseFloat( parseFloat(source_val) / parseFloat(RateToBTC[source_currency]) ).toFixed(8);
				$btc_input.val(newBtcValue);
				isProgrammaticUpdate = false;
			}

			// Updates BTC value
			btc_input_value = parseFloat($btc_input.val().replace(/,/g, '')).toFixed(8);

			// Updates all inputs depending on its rate to BTC
			$(".value-input:not('.active, .bitcoin')").each(function(){
				currency = $(this).data("currency");
				var calculatedValue = RateToBTC[currency] * btc_input_value;
				
				isProgrammaticUpdate = true;
				// Format the value properly based on currency type
				if (currency === "sat") {
					var formattedValue = Math.round(calculatedValue).toLocaleString();
					$(this).val(formattedValue);
				} else if (currency === "btc") {
					var formattedValue = calculatedValue.toFixed(8);
					$(this).val(formattedValue);
				} else {
					var formattedValue = calculatedValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
					$(this).val(formattedValue);
				}
				isProgrammaticUpdate = false;
				
				(( RateToBTC['sat'] * btc_input_value ) == 1) ? $("#sats-label").text('⚪️ sat') : $("#sats-label").text('⚪️ sats');
			})

		};



		$currency_inputs.keyup(function(e) {
			var inputValue = $(this).val();
			var source_currency = $(this).data("currency");
			
			// Check if this is a math expression
			if (/[\+\-\*\/\(\)]/.test(inputValue.replace(/[, ]/g, ''))) {
				// Parse math expression
				var calculatedValue = parseMathExpression(inputValue);
				
				if (calculatedValue !== null) {
					// Use calculated value for conversion
					var source_val = parseFloat(calculatedValue).toFixed(8);
					
					$(this).addClass("active");
					calcConversion( source_val, source_currency, false );
					writenNumber(european);
					
					// Update URL with calculated value
					var currentOrder = url.searchParams.get('order');
					url.searchParams.delete('sats');
					url.searchParams.delete('btc');
					var currencyCodes = [
						"usd", "eur", "gbp", "cny", "jpy", "cad",
						"rub", "chf", "brl", "aed", "try", "aud",
						"mxn", "ils", "zar", "thb", 'inr', 'sek',
						'sar', /*'vef',*/ "ars"
					];
					currencyCodes.forEach(function(code) {
						url.searchParams.delete(code);
					});
					
					if (currentOrder) {
						url.searchParams.set('order', currentOrder);
					}

					if (source_currency === 'sat') {
						url.searchParams.set('sats', parseFloat(calculatedValue).toFixed(0));
					} else if (source_currency === 'btc') {
						url.searchParams.set('btc', parseFloat(calculatedValue).toFixed(8));
					} else {
						url.searchParams.set(source_currency, parseFloat(calculatedValue).toFixed(2));
					}
					window.history.pushState({}, '', url);
				}
			} else {
				// Parse regular number input
				var source_val = unformatNumber(inputValue);
				source_val = parseFloat(source_val).toFixed(8);

				$(this).addClass("active");
				calcConversion( source_val, source_currency, false );

				writenNumber(european);

				// Clear all existing currency parameters but preserve order
				var currentOrder = url.searchParams.get('order');
				url.searchParams.delete('sats');
				url.searchParams.delete('btc');
				var currencyCodes = [
					"usd", "eur", "gbp", "cny", "jpy", "cad",
					"rub", "chf", "brl", "aed", "try", "aud",
					"mxn", "ils", "zar", "thb", 'inr', 'sek',
					'sar', /*'vef',*/ "ars"
				];
				currencyCodes.forEach(function(code) {
					url.searchParams.delete(code);
				});
				
				// Restore order parameter if it existed
				if (currentOrder) {
					url.searchParams.set('order', currentOrder);
				}

				// Update URL with the correct currency parameter
				if (source_currency === 'sat') {
					url.searchParams.set('sats', parseFloat(source_val).toFixed(0));
				} else if (source_currency === 'btc') {
					url.searchParams.set('btc', parseFloat(source_val).toFixed(8));
				} else {
					url.searchParams.set(source_currency, parseFloat(source_val).toFixed(2));
				}
				window.history.pushState({}, '', url);
			}

		});






		writenNumber(european);
		$currency_inputs.blur(function() {
			$(this).removeClass("active");
		});

	})



})
