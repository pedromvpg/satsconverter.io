$( document ).ready(function() {

	// Initialize RateToBTC globally
	var RateToBTC = {
		sat: 100000000,
		btc: 1
	};

function writenNumber(european){
		// Check if written numbers checkbox is checked
		var writtenNumbersEnabled = $('#written-number-check').is(':checked');
		
	$(".writen-number").each(function() {
				var value = $(this).siblings(".value-input").val();
				
				// Handle empty or invalid values
				if (!value || value.trim() === '' || value === 'n/a') {
					$(this).text('');
					return;
				}
				
				// Use the existing unformatNumber function for consistency
				var source_val = unformatNumber(value);
				
				// Check if the parsed value is valid
				if (isNaN(source_val) || source_val === 0) {
					$(this).text('');
					return;
				}
				
				// Only populate text if written numbers are enabled
				if (writtenNumbersEnabled) {
			$(this).text(formatLargeNumber(source_val, european));
				} else {
					$(this).text('');
				}
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

	// Math Expression Parser
	function parseMathExpression(input) {
		console.log('=== parseMathExpression called ===');
		console.log('Input:', input);
		
		// Remove commas and extra spaces
		input = input.replace(/[, ]/g, '');
		console.log('Cleaned input:', input);
		
		// Check if input contains math operators
		if (/[\+\-\*\/]/.test(input)) {
			console.log('Math operators detected');
			try {
				// Validate the expression - only allow numbers and basic operators
				if (/^[\d\+\-\*\/\.\(\)]+$/.test(input)) {
					console.log('Expression format is valid');
					// Check that the expression ends with a number, not an operator
					if (!/[\+\-\*\/]$/.test(input)) {
						console.log('Expression ends with number, evaluating');
						// Check for division by zero
						if (input.includes('/0') && !input.includes('/0.')) {
							console.log('Division by zero detected, returning null');
							return null; // Division by zero
						}
						
						// Evaluate the expression
						var result = eval(input);
						console.log('Eval result:', result);
						
						// Check if result is valid number
						if (isFinite(result) && !isNaN(result)) {
							console.log('Valid result returned:', result);
							return result;
						} else {
							console.log('Invalid result (not finite or NaN):', result);
						}
					} else {
						console.log('Expression ends with operator, not evaluating');
					}
				} else {
					console.log('Expression format is invalid');
				}
			} catch (e) {
				console.log('Exception during evaluation:', e);
				// Invalid expression, return null
				return null;
			}
		} else {
			console.log('No math operators detected');
		}
		
		// No math expression or invalid, return original input
		var parsed = parseFloat(input.replace(/[, ]/g, ''));
		console.log('Fallback parsed value:', parsed);
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

	// Initialize custom date picker
	initializeDragAndDrop();
	initializeDatepicker();

	// Initialize Custom Date Picker (replacing problematic Flatpickr)
	function initializeDatepicker() {
		setupCustomDatepicker();
	}

	// Custom date picker implementation
	function setupCustomDatepicker() {
		var pickerButton = document.getElementById('date-picker-button');
		if (!pickerButton) {
			return;
		}
		
		// Set initial value from URL if present, otherwise use today
		var urlParams = new URLSearchParams(window.location.search);
		var timestamp = urlParams.get('timestamp');
		
		var initialDate = new Date();
		if (timestamp) {
			initialDate = new Date(parseInt(timestamp) * 1000);
		} else {
			fetchCurrentPrices(true);
		}
		
		// Update button text
				updateButtonText(initialDate);
		
		// Add click handler to the button
		pickerButton.addEventListener('click', function(e) {
			e.preventDefault();
			showCustomDatePicker(initialDate);
		});
		
		// Add click handler to the reset button
		var resetButton = document.getElementById('reset-button');
		if (resetButton) {
			resetButton.addEventListener('click', function(e) {
				e.preventDefault();
				resetToDefaults();
			});
		}
	}

	// Show custom date picker modal
	function showCustomDatePicker(currentDate) {
		// Create a modal container
		var modal = document.createElement('div');
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			z-index: 10000;
			display: flex;
			align-items: center;
			justify-content: center;
		`;
		
		// Create modal content
		var modalContent = document.createElement('div');
		modalContent.style.cssText = `
			background: #000;
			border: 1px solid #333;
			padding: 20px;
			color: #fff;
			font-family: 'Inter', sans-serif;
			min-width: 300px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
		`;
		modalContent.className = 'date-picker-modal';
		
		// Create header
		var header = document.createElement('div');
		header.style.cssText = `
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
			border-bottom: 1px solid #333;
			padding-bottom: 10px;
		`;
		
		var title = document.createElement('h3');
		title.textContent = 'Select Historical Date';
		title.style.cssText = `
			margin: 0;
			text-align: center;
			font-size: 10px;
			font-weight: 400;
			text-transform: uppercase;
			letter-spacing: 1px;
			color: #666;
		`;
		
		var closeBtn = document.createElement('button');
		closeBtn.textContent = '×';
		closeBtn.style.cssText = `
			background: none;
			border: none;
			color: #fff;
			font-size: 24px;
			cursor: pointer;
			padding: 0;
			width: 30px;
			height: 30px;
			display: flex;
			align-items: center;
			justify-content: center;
		`;
		
		header.appendChild(title);
		header.appendChild(closeBtn);
		
		// Create quick selection dropdown
		var quickDropdown = document.createElement('select');
		quickDropdown.style.cssText = `
			width: 100%;
			padding: 8px;
			background: #111;
			border: 1px solid #333;
			color: #fff;
			font-family: 'Inter', sans-serif;
			margin-bottom: 20px;
			box-sizing: border-box;
		`;
		
		// Add "Quick Selection" as first option
		var quickOption = document.createElement('option');
		quickOption.value = '';
		quickOption.textContent = 'Quick Selection';
		quickOption.disabled = true;
		quickOption.selected = true;
		quickDropdown.appendChild(quickOption);
		
		// Add common historical dates
		var today = new Date();
		var options = [
			{ text: 'Today', date: today },
			{ text: 'Yesterday', date: new Date(today.getTime() - 24*60*60*1000) },
			{ text: '1 week ago', date: new Date(today.getTime() - 7*24*60*60*1000) },
			{ text: '1 month ago', date: new Date(today.getTime() - 30*24*60*60*1000) },
			{ text: '3 months ago', date: new Date(today.getTime() - 90*24*60*60*1000) },
			{ text: '6 months ago', date: new Date(today.getTime() - 180*24*60*60*1000) },
			{ text: '1 year ago', date: new Date(today.getTime() - 365*24*60*60*1000) },
			{ text: '2 years ago', date: new Date(today.getTime() - 2*365*24*60*60*1000) },
			{ text: 'Bitcoin Halving (Apr 2024)', date: new Date('2024-04-20') },
			{ text: 'Previous Halving (May 2020)', date: new Date('2020-05-11') },
			{ text: 'COVID Crash (Mar 2020)', date: new Date('2020-03-13') },
			{ text: '2017 Peak (Dec 2017)', date: new Date('2017-12-17') },
			{ text: 'Mt. Gox Collapse (Feb 2014)', date: new Date('2014-02-25') }
		];
		
		// Add options to quick dropdown
		options.forEach(function(option, index) {
			var optionElement = document.createElement('option');
			optionElement.value = index;
			optionElement.textContent = option.text;
			quickDropdown.appendChild(optionElement);
		});
		
		// Create custom date section
		var customLabel = document.createElement('label');
		customLabel.textContent = 'Custom Date:';
		customLabel.style.cssText = `
			display: block;
			margin-bottom: 8px;
			color: #ccc;
			font-size: 14px;
		`;
		
		// Create dropdowns container
		var dropdownsContainer = document.createElement('div');
		dropdownsContainer.style.cssText = `
			display: flex;
			gap: 8px;
			margin-bottom: 15px;
		`;
		
		// Day dropdown
		var dayDropdown = document.createElement('select');
		dayDropdown.style.cssText = `
			flex: 1;
			padding: 8px;
			background: #111;
			border: 1px solid #333;
			color: #fff;
			font-family: 'Inter', sans-serif;
			box-sizing: border-box;
		`;
		
		// Month dropdown
		var monthDropdown = document.createElement('select');
		monthDropdown.style.cssText = `
			flex: 1;
			padding: 8px;
			background: #111;
			border: 1px solid #333;
			color: #fff;
			font-family: 'Inter', sans-serif;
			box-sizing: border-box;
		`;
		
		// Year dropdown
		var yearDropdown = document.createElement('select');
		yearDropdown.style.cssText = `
			flex: 1;
			padding: 8px;
			background: #111;
			border: 1px solid #333;
			color: #fff;
			font-family: 'Inter', sans-serif;
			box-sizing: border-box;
		`;
		
		// Populate day dropdown (1-31)
		for (var i = 1; i <= 31; i++) {
			var option = document.createElement('option');
			option.value = i;
			option.textContent = i;
			dayDropdown.appendChild(option);
		}
		
		// Populate month dropdown
		var months = [
			'January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'
		];
		months.forEach(function(month, index) {
			var option = document.createElement('option');
			option.value = index + 1;
			option.textContent = month;
			monthDropdown.appendChild(option);
		});
		
		// Populate year dropdown (2010 to current year)
		var currentYear = new Date().getFullYear();
		for (var i = currentYear; i >= 2010; i--) {
			var option = document.createElement('option');
			option.value = i;
			option.textContent = i;
			yearDropdown.appendChild(option);
		}
		
		// Set current date as default
		dayDropdown.value = today.getDate();
		monthDropdown.value = today.getMonth() + 1;
		yearDropdown.value = today.getFullYear();
		
		// Set button
		var setButton = document.createElement('button');
		setButton.textContent = 'Set Custom Date';
		setButton.style.cssText = `
			width: 100%;
			padding: 10px;
			background: #fff;
			border: none;
			color: #000;
			font-family: 'Inter', sans-serif;
			cursor: pointer;
			font-size: 14px;
		`;
		
		// Assemble the modal
		dropdownsContainer.appendChild(dayDropdown);
		dropdownsContainer.appendChild(monthDropdown);
		dropdownsContainer.appendChild(yearDropdown);
		
		modalContent.appendChild(header);
		modalContent.appendChild(quickDropdown);
		modalContent.appendChild(customLabel);
		modalContent.appendChild(dropdownsContainer);
		modalContent.appendChild(setButton);
		modal.appendChild(modalContent);
		
		// Add to page
		document.body.appendChild(modal);
		
		// Event handlers
		function closeModal() {
			document.body.removeChild(modal);
		}
		
		closeBtn.addEventListener('click', closeModal);
		
		// Quick dropdown change handler
		quickDropdown.addEventListener('change', function(e) {
			var selectedIndex = parseInt(e.target.value);
			var selectedOption = options[selectedIndex];
			
			// Special handling for "Today" - remove timestamp and use current prices
			if (selectedOption.text === 'Today') {
				
				// Store the current anchor currency and amount before changing date
				var anchorCurrency = null;
				var anchorAmount = null;
				
				// Check if there's an active input (user is currently editing)
				var activeInput = $(".value-input.active");
				if (activeInput.length > 0) {
					anchorCurrency = activeInput.data("currency");
					anchorAmount = unformatNumber(activeInput.val());
				} else {
					// Check URL parameters for the anchor currency
					var urlParams = new URLSearchParams(window.location.search);
					var currencyCodes = [
						"usd", "eur", "gbp", "cny", "jpy", "cad",
						"rub", "chf", "brl", "aed", "try", "aud",
						"mxn", "ils", "zar", "thb", 'inr', 'sek',
						'sar', "ars"
					];
					
					// Check for sats first (legacy support)
					if (urlParams.get('sats')) {
						anchorCurrency = 'sat';
						anchorAmount = parseFloat(urlParams.get('sats'));
					} else {
						// Check other currencies
						for (var i = 0; i < currencyCodes.length; i++) {
							var code = currencyCodes[i];
							if (urlParams.get(code)) {
								anchorCurrency = code;
								anchorAmount = parseFloat(urlParams.get(code));
								break;
							}
						}
					}
					
					// If no URL parameter found, use the first non-zero input
					if (!anchorCurrency) {
						$(".value-input").each(function() {
							var value = unformatNumber($(this).val());
							if (value > 0 && !anchorCurrency) {
								anchorCurrency = $(this).data("currency");
								anchorAmount = value;
							}
						});
					}
				}
				
				// Default to 1 USD if no anchor found
				if (!anchorCurrency) {
					anchorCurrency = 'usd';
					anchorAmount = 1;
				}
				
				// Update URL to remove only the timestamp parameter
				var url = new URL(window.location.href);
				url.searchParams.delete('timestamp');
				window.history.pushState({}, '', url);
				
				// Update button text to show today
				updateButtonText(selectedOption.date);
				
				// Immediately remove n-a-value classes and show loading state
				$('.field.fiat').removeClass('n-a-value').addClass('loading');
				
				// Fetch current prices (which have more currencies)
				// Store the anchor info to restore after API call completes
				var anchorInfo = {
					currency: anchorCurrency,
					amount: anchorAmount
				};
				
				// Override the fetchCurrentPrices function temporarily to add our callback
				var originalFetchCurrentPrices = fetchCurrentPrices;
				fetchCurrentPrices = function(skipUrlParams) {
					var priceURL = "https://pvxg.net/bitcoin-price/index.php";
					
					$.getJSON(priceURL, function(data) {	
						
						// Remove n-a-value classes from all fiat fields when switching to current prices
						$('.field.fiat').removeClass('n-a-value loading');
						
						RateToBTC = {
							sat: 100000000,
							btc: 1,
							usd: data.USD,
							eur: data.EUR,
							gbp: data.GBP,
							cny: data.CNY,
							jpy: data.JPY,
							cad: data.CAD,
							chf: data.CHF,
							rub: data.RUB,
							brl: data.BRL,
							aed: data.AED,
							try: data.TRY,
							aud: data.AUD,
							mxn: data.MXN,
							thb: data.THB,
							ils: data.ILS,
							inr: data.INR,
							zar: data.ZAR,
							sek: data.SEK,
							sar: data.SAR,
							ars: data.ARS
						};
						
						// Update sats per currency display
						updateSatsPerCurrency();
						
						// Force clear any n/a values that should now be available
						forceClearNAValues();
						
						// Load URL parameters after prices are available (only if not in historical mode and not skipped)
						var urlParams = new URLSearchParams(window.location.search);
						if (!urlParams.get('timestamp') && !skipUrlParams) {
							loadUrlParameters();
						} else {
						}
						
						// If this was called from "Today" selection, restore the anchor currency
						if (skipUrlParams && anchorInfo) {
							restoreAnchorCurrency(anchorInfo.currency, anchorInfo.amount);
							
							// Restore the original function
							fetchCurrentPrices = originalFetchCurrentPrices;
						}
					}).fail(function(xhr, status, error) {
						// Restore the original function even on failure
						fetchCurrentPrices = originalFetchCurrentPrices;
					});
				};
				
				fetchCurrentPrices(true);
				
				closeModal();
				return;
			}
			
			// For other dates, use historical prices with anchor preservation
			handleDateChange(selectedOption.date);
			closeModal();
		});
		
		// Set button click handler
		setButton.addEventListener('click', function() {
			var day = parseInt(dayDropdown.value);
			var month = parseInt(monthDropdown.value) - 1; // Month is 0-indexed
			var year = parseInt(yearDropdown.value);
			
			var customDate = new Date(year, month, day);
			handleDateChange(customDate);
			closeModal();
		});
		
		// Close on overlay click
		modal.addEventListener('click', function(e) {
			if (e.target === modal) {
				closeModal();
			}
		});
		
		// Close on Escape key
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape') {
				closeModal();
			}
		});
	}
	
	function updateButtonText(date) {
		var pickerButton = document.getElementById('date-picker-button');
		if (pickerButton) {
			var formattedDate = formatDateForDisplay(date);
			pickerButton.querySelector('.picker-value').textContent = formattedDate;
		}
	}
	
	function handleDateChange(selectedDate) {
		if (!selectedDate) {
			return;
		}
		
		try {
			// Store the current anchor currency and amount before changing date
			var anchorCurrency = null;
			var anchorAmount = null;
			
			// Check if there's an active input (user is currently editing)
			var activeInput = $(".value-input.active");
			if (activeInput.length > 0) {
				anchorCurrency = activeInput.data("currency");
				anchorAmount = unformatNumber(activeInput.val());
			} else {
				// Check URL parameters for the anchor currency
				var urlParams = new URLSearchParams(window.location.search);
				var currencyCodes = [
					"usd", "eur", "gbp", "cny", "jpy", "cad",
					"rub", "chf", "brl", "aed", "try", "aud",
					"mxn", "ils", "zar", "thb", 'inr', 'sek',
					'sar', "ars"
				];
				
				// Check for sats first (legacy support)
				if (urlParams.get('sats')) {
					anchorCurrency = 'sat';
					anchorAmount = parseFloat(urlParams.get('sats'));
				} else {
					// Check other currencies
					for (var i = 0; i < currencyCodes.length; i++) {
						var code = currencyCodes[i];
						if (urlParams.get(code)) {
							anchorCurrency = code;
							anchorAmount = parseFloat(urlParams.get(code));
							break;
						}
					}
				}
				
				// If no URL parameter found, use the first non-zero input
				if (!anchorCurrency) {
					$(".value-input").each(function() {
						var value = unformatNumber($(this).val());
						if (value > 0 && !anchorCurrency) {
							anchorCurrency = $(this).data("currency");
							anchorAmount = value;
						}
					});
				}
			}
			
			// Default to 1 USD if no anchor found
			if (!anchorCurrency) {
				anchorCurrency = 'usd';
				anchorAmount = 1;
			}
			
			var timestamp = Math.floor(selectedDate.getTime() / 1000);
			
			// Update the button text to show the selected date
			updateButtonText(selectedDate);
			
			// Update URL with timestamp
			var url = new URL(window.location.href);
			url.searchParams.set('timestamp', timestamp);
			window.history.pushState({}, '', url);
			
			// Fetch historical prices with anchor preservation
			fetchHistoricalPricesWithAnchor(timestamp, anchorCurrency, anchorAmount);
		} catch (error) {
			console.error('Error in handleDateChange:', error);
		}
	}

	// Function to format date for display (e.g., "24 Jun 2025")
	function formatDateForDisplay(date) {
		const options = {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		};
		return date.toLocaleDateString('en-US', options);
	}

	// Function to fetch historical prices with anchor preservation
	function fetchHistoricalPricesWithAnchor(timestamp, anchorCurrency, anchorAmount) {
		var historicalURL = "https://mempool.space/api/v1/historical-price?currency=EUR&timestamp=" + timestamp;
		
		$.getJSON(historicalURL, function(data) {
			if (data && data.prices && data.prices.length > 0) {
				var historicalData = data.prices[0];
				var exchangeRates = data.exchangeRates;
				
				// Update RateToBTC with historical data
				updateRatesWithHistoricalData(historicalData, exchangeRates);
				
				// Update sats per currency display
				updateSatsPerCurrency();
				
				// Restore the anchor currency and amount
				restoreAnchorCurrency(anchorCurrency, anchorAmount);
				
				// Adjust fiat input sizes after anchor restoration
				adjustFiatInputSizes();
			} else {
				console.error('Invalid historical data structure:', data);
				// Fallback to current prices
				fetchCurrentPrices();
			}
		}).fail(function(xhr, status, error) {
			// Fallback to current prices
			fetchCurrentPrices();
		});
	}
	
	// Function to restore the anchor currency and amount
	function restoreAnchorCurrency(anchorCurrency, anchorAmount) {
		// Set the anchor currency value
		var anchorInput = $('#input_' + anchorCurrency);
		if (anchorInput.length > 0) {
			// Format the amount properly
			var formattedAmount = formatNumber(anchorAmount, anchorCurrency);
			
			// Update the input value
			isProgrammaticUpdate = true;
			anchorInput.val(formattedAmount);
			isProgrammaticUpdate = false;
			
			// Recalculate all conversions based on this anchor
			calcConversion(anchorAmount, anchorCurrency, false);
		
		// Update written numbers
		writenNumber(european);
		
			// Update URL parameters to reflect the anchor
			updateUrlParameters(anchorCurrency, anchorAmount);
			
			// Adjust fiat input sizes after anchor restoration
			adjustFiatInputSizes();
		} else {
		}
	}

	// Function to fetch current prices
	function fetchCurrentPrices(skipUrlParams = false) {
		var priceURL = "https://pvxg.net/bitcoin-price/index.php";
		
		$.getJSON(priceURL, function(data) {
			// Remove n-a-value classes from all fiat fields when switching to current prices
			$('.field.fiat').removeClass('n-a-value loading');
			
			RateToBTC = {
				sat: 100000000,
				btc: 1,
				usd: data.USD,
				eur: data.EUR,
				gbp: data.GBP,
				cny: data.CNY,
				jpy: data.JPY,
				cad: data.CAD,
				chf: data.CHF,
				rub: data.RUB,
				brl: data.BRL,
				aed: data.AED,
				try: data.TRY,
				aud: data.AUD,
				mxn: data.MXN,
				thb: data.THB,
				ils: data.ILS,
				inr: data.INR,
				zar: data.ZAR,
				sek: data.SEK,
				sar: data.SAR,
				ars: data.ARS
			};
			
			// Update sats per currency display
			updateSatsPerCurrency();
			
			// Force clear any n/a values that should now be available
			forceClearNAValues();
			
			// Load URL parameters after prices are available (only if not in historical mode and not skipped)
			var urlParams = new URLSearchParams(window.location.search);
			if (!urlParams.get('timestamp') && !skipUrlParams) {
			loadUrlParameters();
			} else {
			}
			
		}).fail(function(xhr, status, error) {
		});
	}

	const url = new URL(window.location.href);
  if (url.searchParams.get('written') === 'true') {
      $('#written-number-check').prop('checked', true);
			$(".writen-number").animate({opacity: 1}, 100);
			$(".writen-number").animate({fontSize: '8px'}, 100);
			// Note: writenNumber will be called after values are loaded
  }

  $('#written-number-check').on('change', function() {
      const checkbox = $(this);
      const currentUrl = window.location.href;
      const url = new URL(currentUrl);
      if (checkbox.is(':checked')) {
          url.searchParams.set('written', 'true');
					$(".writen-number").animate({opacity: 1}, 100);
					$(".writen-number").animate({fontSize: '8px'}, 100);
					// Populate the written numbers
					writenNumber(european);
      } else {
          url.searchParams.delete('written');
					$(".writen-number").animate({opacity: 0}, 100);
					$(".writen-number").animate({fontSize: '0px'}, 100);
					// Clear the written numbers
					$(".writen-number").text('');
      }
      window.history.pushState({}, '', url);
  });



	var european = false;
	if (url.searchParams.get('european') === 'true') {
			$('#european-check').prop('checked', true);
			european = true;
			// Don't call writenNumber here - wait until values are loaded
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
	
	function formatNumber(value, currency, preserveDecimal = false) {
		console.log('=== formatNumber called ===');
		console.log('Value:', value);
		console.log('Currency:', currency);
		console.log('Preserve decimal:', preserveDecimal);
		
		// First, clean the value by removing commas to get the actual number
		var cleanValue = unformatNumber(value);
		console.log('Clean value:', cleanValue);
		
		if (currency === "sat") {
			// Satoshis: whole numbers with commas
			var result = Math.round(cleanValue || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
			console.log('SAT result:', result);
			return result;
		} else if (currency === "btc") {
			console.log('Formatting BTC value');
			// Bitcoin: up to 8 decimal places, but trim trailing zeros
			var btcValue = (cleanValue || 0).toFixed(8);
			console.log('BTC after toFixed(8):', btcValue);
			// Remove trailing zeros
			btcValue = btcValue.replace(/0+$/, ''); // Remove trailing zeros
			console.log('BTC after removing trailing zeros:', btcValue);
			
			// Only remove trailing decimal point if not preserving decimal
			if (!preserveDecimal) {
				btcValue = btcValue.replace(/\.$/, ''); // Remove trailing decimal point
				console.log('BTC after removing trailing decimal:', btcValue);
			}
			
			// Add comma separators to the whole number part
			if (btcValue.includes('.')) {
				var parts = btcValue.split('.');
				parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
				btcValue = parts.join('.');
			} else {
				btcValue = btcValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
			}
			console.log('BTC final result:', btcValue);
			return btcValue;
		} else {
			console.log('Formatting fiat value');
			// Fiat: 2 decimal places with commas, but trim trailing zeros
			var fiatValue = (cleanValue || 0).toFixed(2);
			console.log('Fiat after toFixed(2):', fiatValue);
			// Remove trailing zeros
			fiatValue = fiatValue.replace(/0+$/, ''); // Remove trailing zeros
			console.log('Fiat after removing trailing zeros:', fiatValue);
			
			// Only remove trailing decimal point if not preserving decimal
			if (!preserveDecimal) {
				fiatValue = fiatValue.replace(/\.$/, ''); // Remove trailing decimal point
				console.log('Fiat after removing trailing decimal:', fiatValue);
			}
			
			// Add comma separators
			var result = fiatValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
			console.log('Fiat final result:', result);
			return result;
		}
	}

	function unformatNumber(value) {
		// Convert to string and remove commas, then convert to number
		return parseFloat(String(value).replace(/,/g, '')) || 0;
	}

	// Function to trim leading and trailing zeros
	function trimZeros(value) {
		if (!value || value === '') return value;
		
		var str = String(value);
		
		// Handle negative numbers
		var isNegative = str.startsWith('-');
		if (isNegative) {
			str = str.substring(1);
		}
		
		// Remove leading zeros (but keep one zero if it's a whole number)
		str = str.replace(/^0+/, '');
		if (str === '' || str.startsWith('.')) {
			str = '0' + str;
		}
		
		// Remove trailing zeros after decimal point, but preserve the decimal point
		if (str.includes('.')) {
			str = str.replace(/0+$/, ''); // Remove trailing zeros
			// Don't remove the decimal point - this allows users to type fractions
		}
		
		// Restore negative sign
		if (isNegative && str !== '0') {
			str = '-' + str;
		}
		
		return str;
	}

	// Function to check and adjust fiat input font sizes based on content length
	function adjustFiatInputSizes() {
		$(".fiat .value-input").each(function() {
			var $input = $(this);
			var value = $input.val();
			
			// Remove existing size adjustment classes
			$input.removeClass('font-size-reduced font-size-reduced-more');
			
			// Check if value length exceeds thresholds
			if (value && value.length > 20) {
				$input.addClass('font-size-reduced font-size-reduced-more');
			} else if (value && value.length > 14) {
				$input.addClass('font-size-reduced');
			}
		});
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

	// Check fiat input sizes after initial formatting
	adjustFiatInputSizes();

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
			
			// Don't trim zeros during typing - only validate format
			// This allows users to type "0." and continue typing
			
			// Update value if it changed (only for format validation)
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
			console.log('Enter key pressed for currency:', currency, 'value:', value);
			
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
				// Trim zeros before formatting
				var trimmedValue = trimZeros(value);
				if (trimmedValue !== value) {
					$input.val(trimmedValue);
				}
				
				// Format the number
				isProgrammaticUpdate = true;
				var formattedResult = formatNumber(trimmedValue, currency);
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

		if (isProgrammaticUpdate) {
			console.log('Blur event skipped due to programmatic update');
			return; // Skip if this is a programmatic update
		}
		
		var $input = $(this);
		var value = $input.val();
		var currency = $input.data("currency");
		console.log('Blur event processing for currency:', currency, 'value:', value);
		
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
			// Trim zeros before formatting
			var trimmedValue = trimZeros(value);
			if (trimmedValue !== value) {
				$input.val(trimmedValue);
			}
			
			// Format the number
			isProgrammaticUpdate = true;
			var formattedResult = formatNumber(trimmedValue, currency);
			$input.val(formattedResult);
			isProgrammaticUpdate = false;
		}
	});

	var $currency_inputs = $(".value-input"),
		$btc_input = $(".bitcoin"),
		currency,
		btc_max_stock = 21000000



	var priceURL = "https://pvxg.net/bitcoin-price/index.php";

	// Check if we have a timestamp in URL for historical data
	var urlParams = new URLSearchParams(window.location.search);
	var timestamp = urlParams.get('timestamp');
	
	if (timestamp) {
		// Fetch historical prices with anchor preservation
		// For initial load, we'll use the URL parameters as anchor
		var anchorCurrency = null;
		var anchorAmount = null;
		
		// Check for sats parameter first (legacy support)
		if (urlParams.get('sats')) {
			anchorCurrency = 'sat';
			anchorAmount = parseFloat(urlParams.get('sats'));
		} else {
			// Check other currency parameters
			var currencyCodes = [
				"usd", "eur", "gbp", "cny", "jpy", "cad",
				"rub", "chf", "brl", "aed", "try", "aud",
				"mxn", "ils", "zar", "thb", 'inr', 'sek',
				'sar', "ars"
			];
			
			for (var i = 0; i < currencyCodes.length; i++) {
				var code = currencyCodes[i];
				if (urlParams.get(code)) {
					anchorCurrency = code;
					anchorAmount = parseFloat(urlParams.get(code));
					break;
				}
			}
		}
		
		// Default to 1 USD if no anchor found
		if (!anchorCurrency) {
			anchorCurrency = 'usd';
			anchorAmount = 1;
		}
		
		fetchHistoricalPricesWithAnchor(timestamp, anchorCurrency, anchorAmount);
	} else {
		// Fetch current prices
		fetchCurrentPrices(false);
	}

	// Set up interval for current price updates (only when not in historical mode)
	setInterval(function() {
		if (!urlParams.get('timestamp')) {
			fetchCurrentPrices(false);
		}
	}, (1000*60*5));

	// Handle URL parameters for initial loading - moved to after price fetching
	function loadUrlParameters() {
		
		// Check for sats parameter first (legacy support)
		if (urlParams.get('sats')) {
			var loadedCurrency = 'sat';
			var loadedValue = urlParams.get('sats');
			
			$('#input_' + loadedCurrency).val(loadedValue);
			calcConversion(parseFloat(loadedValue), loadedCurrency, false);
			writenNumber(european);
			return; // Exit early if sats parameter found
		}
		
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
				var loadedCurrency = code;
				var loadedValue = urlParams.get(code);
				
				$('#input_' + loadedCurrency).val(loadedValue);
				calcConversion(parseFloat(loadedValue), loadedCurrency, false);
				writenNumber(european);
				return; // Exit early if currency parameter found
			}
		}
		
		// Set default value of 0 sats when no parameters are found
		$('#input_sat').val('0');
		calcConversion(0, 'sat', false);
		writenNumber(european);
	}

	// Initialize sats per currency display
	function updateSatsPerCurrency() {
		$("#satsfiats").empty();
		var currencyCodes = [
        "usd", "eur", "gbp", "cny", "jpy", "cad",
        "rub", "chf", "brl", "aed", "try", "aud",
        "mxn", "ils", "zar", "thb", 'inr', 'sek',
				'sar', /*'vef',*/ "ars"
    ];

    currencyCodes.forEach(function(code) {
			if (RateToBTC[code] && RateToBTC[code] !== 'n/a') {
        var satPerCurrency = 1 / (RateToBTC[code] / 1) * 100000000;
				var satsPerElement = $('<div>', {
		        html: "<span class='satsfiat'>"+satPerCurrency.toFixed(0)+"</span> sats per 1 " + code.toUpperCase()
		    });
		    $("#satsfiats").append(satsPerElement);
			}
		});
	}

	// Helper function to update URL parameters
	function updateUrlParameters(source_currency, source_val) {
		var url = new URL(window.location.href);
		var currentOrder = url.searchParams.get('order');
		
		// Clear all existing currency parameters but preserve order
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

		function calcConversion(source_val, source_currency, firstLoad, preserveDecimal = false){
		console.log('=== calcConversion called ===');
		console.log('Source value:', source_val);
		console.log('Source currency:', source_currency);
		console.log('First load:', firstLoad);
		console.log('Preserve decimal:', preserveDecimal);
		
			var	btc_input_value = parseFloat($btc_input.val().replace(/,/g, '')).toFixed(8);
		console.log('Initial BTC input value:', btc_input_value);

			//set BTC max if user is editing BTC input
			if( btc_input_value > btc_max_stock ){
				btc_input_value = btc_max_stock
			isProgrammaticUpdate = true;
				$btc_input.val(btc_max_stock)
			isProgrammaticUpdate = false;
			}


			// Get convertion to BTC from the current currency

			if(source_currency == "sat"){
			console.log('Converting from SAT');
			isProgrammaticUpdate = true;
			var newBtcValue = parseFloat(source_val / RateToBTC[source_currency]).toFixed(8);
			console.log('New BTC value (sat):', newBtcValue);
			$btc_input.val(formatNumber(newBtcValue, 'btc', preserveDecimal));
			isProgrammaticUpdate = false;
			}
			else if(source_currency == "btc"){
			console.log('Converting from BTC');
			console.log('Source value received:', source_val);

				// Update the BTC input with the calculated value from math expression
				btc_input_value = parseFloat(source_val).toFixed(8);
				console.log('Updated btc_input_value:', btc_input_value);
				
				// Format and update the BTC input field
				isProgrammaticUpdate = true;
				var formattedBtcValue = formatNumber(btc_input_value, 'btc', preserveDecimal);
				console.log('Formatted BTC value:', formattedBtcValue);
				$btc_input.val(formattedBtcValue);
				
				// Reset the flag after a short delay to ensure all events complete
				setTimeout(function() {
					isProgrammaticUpdate = false;
					console.log('BTC input updated, isProgrammaticUpdate set to false');
				}, 50);
			}
			else{
			console.log('Converting from fiat:', source_currency);
			isProgrammaticUpdate = true;
			var newBtcValue = parseFloat( parseFloat(source_val) / parseFloat(RateToBTC[source_currency]) ).toFixed(8);
			console.log('New BTC value (fiat):', newBtcValue);
			$btc_input.val(formatNumber(newBtcValue, 'btc', preserveDecimal));
			isProgrammaticUpdate = false;
			}

			// Ensure we have a valid BTC value for calculations
			if (isNaN(btc_input_value) || parseFloat(btc_input_value) <= 0) {
				// Convert source value to BTC as fallback
				if (source_currency === "sat") {
					btc_input_value = parseFloat(source_val / RateToBTC[source_currency]).toFixed(8);
				} else if (source_currency === "btc") {
					btc_input_value = parseFloat(source_val).toFixed(8);
				} else {
					btc_input_value = parseFloat(parseFloat(source_val) / parseFloat(RateToBTC[source_currency])).toFixed(8);
				}	
				
				// Update the BTC input with the calculated value
				isProgrammaticUpdate = true;
				$btc_input.val(formatNumber(btc_input_value, 'btc', preserveDecimal));
				isProgrammaticUpdate = false;
			}

			// Updates BTC value
			btc_input_value = parseFloat($btc_input.val().replace(/,/g, '')).toFixed(8);

			// Updates all inputs depending on its rate to BTC
			$(".value-input:not('.active')").each(function(){
				currency = $(this).data("currency");
			
			// Check if currency is available (not 'n/a')
			if (RateToBTC[currency] === 'n/a') {
				$(this).val('n/a');
				$(this).closest('.field.fiat').addClass('n-a-value');
				return;
			}
			
			// Remove n-a-value class if it was previously set
			$(this).closest('.field.fiat').removeClass('n-a-value');
			
			// Always calculate the value if RateToBTC is available
			var calculatedValue = RateToBTC[currency] * btc_input_value;
			
			isProgrammaticUpdate = true;
			// Format the value properly based on currency type using the formatNumber function
			var formattedValue = formatNumber(calculatedValue, currency);
				$(this).val(formattedValue);
			isProgrammaticUpdate = false;
			
				(( RateToBTC['sat'] * btc_input_value ) == 1) ? $("#sats-label").text('⚪️ sat') : $("#sats-label").text('⚪️ sats');
			})

		// Adjust fiat input sizes after all values are updated
		adjustFiatInputSizes();

		// Update URL parameters with the source currency and value
		updateUrlParameters(source_currency, source_val);
		};



		$currency_inputs.keyup(function(e) {
		// Skip if this is a programmatic update or if it's the Enter key
		if (isProgrammaticUpdate || e.keyCode === 13) {
			return;
		}
		
		var inputValue = $(this).val();
		var source_currency = $(this).data("currency");
		
		console.log('=== KEYUP EVENT ===');
		console.log('Input value:', inputValue);
		console.log('Source currency:', source_currency);
		console.log('Is programmatic update:', isProgrammaticUpdate);
		console.log('Input element:', this);

		// Check if user is actively typing a decimal (preserve decimal point)
		var preserveDecimal = inputValue.endsWith('.');
		
		// Check if this is a math expression
		if (/[\+\-\*\/\(\)]/.test(inputValue.replace(/[, ]/g, ''))) {
			console.log('Math expression detected');
			
			// Parse math expression
			var calculatedValue = parseMathExpression(inputValue);
			console.log('Parsed math result:', calculatedValue);
			
			if (calculatedValue !== null) {
				console.log('Math expression is valid, calculating conversion');
				// Use calculated value for conversion
				var source_val = parseFloat(calculatedValue).toFixed(8);
				console.log('Source value for conversion:', source_val);
				
				$(this).addClass("active");
				calcConversion( source_val, source_currency, false, preserveDecimal );
				writenNumber(european);
				
				// URL parameters are now updated in calcConversion
			} else {
				console.log('Math expression is invalid or incomplete');
				// Don't trigger conversion for incomplete math expressions
				// Just add active class for visual feedback
				$(this).addClass("active");
			}
		} else {
			console.log('Regular number input detected');
			// Parse regular number input
			var source_val = unformatNumber(inputValue);
			source_val = parseFloat(source_val).toFixed(8);
			console.log('Unformatted source value:', source_val);

			$(this).addClass("active");
			calcConversion( source_val, source_currency, false, preserveDecimal );

			writenNumber(european);

			// URL parameters are now updated in calcConversion
		}
		console.log('=== KEYUP EVENT END ===');

		});






		writenNumber(european);
		$currency_inputs.blur(function() {
			$(this).removeClass("active");
		});

	// Manual test function for debugging
	window.testDatePicker = function(dateString) {
		var testDate = new Date(dateString);
		if (!isNaN(testDate.getTime())) {
			handleDateChange(testDate);
		} else {
		}
	};
	
	window.testHistoricalPrices = function(timestamp) {
		// For testing, use USD as default anchor
		fetchHistoricalPricesWithAnchor(timestamp, 'usd', 1);
	};
	
	window.showCurrentRates = function() {
	};
	
	window.showCustomDatePicker = function() {
		var currentDate = new Date();
		var urlParams = new URLSearchParams(window.location.search);
		var timestamp = urlParams.get('timestamp');
		if (timestamp) {
			currentDate = new Date(parseInt(timestamp) * 1000);
		}
		showCustomDatePicker(currentDate);
	};
	
	function forceRecalculateAllFields() {
		
		// Get the currently active input or default to sats
		var activeInput = $(".value-input.active");
		var source_currency = "sat";
		var source_val = 0; // Default to 0 sat
		
		if (activeInput.length > 0) {
			source_currency = activeInput.data("currency");
			source_val = unformatNumber(activeInput.val());
		} else {
			// If no active input, use the sats input value
			var satsInput = $('#input_sat');
			if (satsInput.length > 0) {
				source_val = unformatNumber(satsInput.val());
			}
		}
		
		// Recalculate conversions
		calcConversion(source_val, source_currency, false);
		
		// Update written numbers
		writenNumber(european);
		
	}

	// Function to update rates with historical data
	function updateRatesWithHistoricalData(historicalData, exchangeRates) {
		
		// Clear existing rates
		RateToBTC = {
			sat: 100000000,
			btc: 1
		};
		
		// Get USD rate as base (it's always available in historical data)
		var usdRate = historicalData.USD;
		if (!usdRate || usdRate <= 0) {
			return;
		}
		
		// Set USD rate directly
		RateToBTC.usd = usdRate;
		
		// Calculate other rates using exchange rates
		if (exchangeRates.USDEUR) {
			RateToBTC.eur = usdRate * exchangeRates.USDEUR;	
		}
		
		if (exchangeRates.USDGBP) {
			RateToBTC.gbp = usdRate * exchangeRates.USDGBP;
		}
		
		if (exchangeRates.USDCAD) {
			RateToBTC.cad = usdRate * exchangeRates.USDCAD;
		}
		
		if (exchangeRates.USDCHF) {
			RateToBTC.chf = usdRate * exchangeRates.USDCHF;
		}
		
		if (exchangeRates.USDAUD) {
			RateToBTC.aud = usdRate * exchangeRates.USDAUD;
		}
		
		if (exchangeRates.USDJPY) {
			RateToBTC.jpy = usdRate * exchangeRates.USDJPY;
		}
		
		// Set unsupported currencies to 'n/a' (these are not available in the historical API)
		var unsupportedCurrencies = ['cny', 'rub', 'brl', 'aed', 'try', 'mxn', 'ils', 'zar', 'thb', 'inr', 'sek', 'sar', 'ars'];
		unsupportedCurrencies.forEach(function(currency) {
			RateToBTC[currency] = 'n/a';
			// Add CSS class to visually indicate n/a status
			$('#input_' + currency).closest('.field.fiat').addClass('n-a-value');
		});
	}

	// Function to force clear all n/a values and recalculate with current prices
	function forceClearNAValues() {
		
		var clearedCount = 0;
		// Clear all n/a values from inputs
		$(".value-input").each(function() {
			var $input = $(this);
			var currency = $input.data("currency");
			var currentValue = $input.val();
			
			if (currentValue === 'n/a' && RateToBTC[currency] && RateToBTC[currency] !== 'n/a') {
				// Don't set to '0', just clear the n/a value and remove the class
				// The calcConversion function will calculate the proper value
				$input.val('');
				$input.closest('.field.fiat').removeClass('n-a-value');
				clearedCount++;
			}
		});
		
	}

	// Function to reset the page to defaults
	function resetToDefaults() {
		
		// Clear all URL parameters
		var url = new URL(window.location.href);
		url.search = '';
		window.history.replaceState({}, '', url);
		
		// Reset checkboxes to unchecked
		$('#written-number-check').prop('checked', false);
		$('#european-check').prop('checked', false);
		
		// Clear written numbers
		$(".writen-number").text('').animate({opacity: 0}, 100).animate({fontSize: '0px'}, 100);
		
		// Reset to default values
		$('#input_sat').val('0');
		$('#input_btc').val('0.00000001');
		
		// Clear all fiat inputs
		$(".value-input[data-currency]").each(function() {
			var currency = $(this).data("currency");
			if (currency !== 'sat' && currency !== 'btc') {
				$(this).val('');
			}
		});
		
		// Remove any n-a-value classes
		$('.field.fiat').removeClass('n-a-value loading');
		
		// Reset currency order to default
		resetCurrencyOrder();
		
		// Reset to current prices (today)
		updateButtonText(new Date());
		
		// Fetch current prices and set default values (skip URL parameters)
		fetchCurrentPrices(true);
		
		// Set default value of 0 sats
		setTimeout(function() {
			calcConversion(0, 'sat', false);
			writenNumber(false);
		}, 100);
		
	}

	// Function to reset currency order to default
	function resetCurrencyOrder() {
		// Default order of currencies (as they appear in the HTML)
		var defaultOrder = [
			'usd', 'eur', 'gbp', 'cny', 'jpy', 'cad', 'rub', 'chf', 'brl', 'aed', 
			'try', 'aud', 'mxn', 'ils', 'zar', 'thb', 'inr', 'sek', 'sar', 'ars'
		];
		
		var container = $('#fiat-container');
		
		// Reorder elements to match default order
		defaultOrder.forEach(function(currency) {
			var element = $('#input_' + currency).closest('.field.fiat');
			if (element.length) {
				container.append(element);
			}
		});
		
	}

})
