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

	// Initialize custom date picker
	initializeDragAndDrop();
	initializeDatepicker();

	// Initialize Custom Date Picker (replacing problematic Flatpickr)
	function initializeDatepicker() {
		console.log('Initializing custom date picker...');
		setupCustomDatepicker();
	}

	// Custom date picker implementation
	function setupCustomDatepicker() {
		console.log('Setting up custom date picker...');
		
		var pickerButton = document.getElementById('date-picker-button');
		console.log('Looking for date-picker-button element...');
		console.log('Found button:', pickerButton);
		
		if (!pickerButton) {
			console.error('Date picker button not found');
			return;
		}
		
		// Set initial value from URL if present, otherwise use today
		var urlParams = new URLSearchParams(window.location.search);
		var timestamp = urlParams.get('timestamp');
		
		var initialDate = new Date();
		if (timestamp) {
			console.log('Found timestamp in URL:', timestamp);
			initialDate = new Date(parseInt(timestamp) * 1000);
			console.log('Setting initial date from URL:', initialDate);
		} else {
			console.log('Setting today as default date:', initialDate);
			fetchCurrentPrices(true);
		}
		
		// Update button text
		updateButtonText(initialDate);
		
		// Add click handler to the button
		console.log('Adding click event listener to button...');
		pickerButton.addEventListener('click', function(e) {
			e.preventDefault();
			console.log('=== Picker button clicked (custom) ===');
			console.log('Button element:', pickerButton);
			console.log('Initial date:', initialDate);
			showCustomDatePicker(initialDate);
		});
		console.log('Click event listener added successfully');
		
		// Add click handler to the reset button
		var resetButton = document.getElementById('reset-button');
		if (resetButton) {
			console.log('Adding click event listener to reset button...');
			resetButton.addEventListener('click', function(e) {
				e.preventDefault();
				console.log('=== Reset button clicked ===');
				resetToDefaults();
			});
			console.log('Reset button click event listener added successfully');
		}
		
		console.log('Custom date picker setup complete');
	}

	// Show custom date picker modal
	function showCustomDatePicker(currentDate) {
		console.log('Showing dropdown date picker');
		
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
			console.log('=== Quick dropdown date selected ===');
			console.log('Selected:', selectedOption.text, selectedOption.date);
			
			// Special handling for "Today" - remove timestamp and use current prices
			if (selectedOption.text === 'Today') {
				console.log('=== TODAY SELECTED ===');
				console.log('Initial RateToBTC:', RateToBTC);
				console.log('Current URL params:', window.location.search);
				
				// Store the current anchor currency and amount before changing date
				var anchorCurrency = null;
				var anchorAmount = null;
				
				// Check if there's an active input (user is currently editing)
				var activeInput = $(".value-input.active");
				if (activeInput.length > 0) {
					anchorCurrency = activeInput.data("currency");
					anchorAmount = unformatNumber(activeInput.val());
					console.log('Using active input as anchor:', anchorCurrency, anchorAmount);
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
						console.log('Using sats from URL as anchor:', anchorAmount);
					} else {
						// Check other currencies
						for (var i = 0; i < currencyCodes.length; i++) {
							var code = currencyCodes[i];
							if (urlParams.get(code)) {
								anchorCurrency = code;
								anchorAmount = parseFloat(urlParams.get(code));
								console.log('Using', code, 'from URL as anchor:', anchorAmount);
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
								console.log('Using first non-zero input as anchor:', anchorCurrency, anchorAmount);
							}
						});
					}
				}
				
				// Default to 1 USD if no anchor found
				if (!anchorCurrency) {
					anchorCurrency = 'usd';
					anchorAmount = 1;
					console.log('No anchor found, defaulting to 1 USD');
				}
				
				console.log('Final anchor for Today:', anchorCurrency, anchorAmount);
				
				// Update URL to remove only the timestamp parameter
				var url = new URL(window.location.href);
				url.searchParams.delete('timestamp');
				window.history.pushState({}, '', url);
				console.log('URL updated (timestamp removed):', url.toString());
				
				// Update button text to show today
				updateButtonText(selectedOption.date);
				
				// Immediately remove n-a-value classes and show loading state
				$('.field.fiat').removeClass('n-a-value').addClass('loading');
				console.log('Added loading state to currency fields');
				
				// Fetch current prices (which have more currencies)
				console.log('Calling fetchCurrentPrices(true)...');
				
				// Store the anchor info to restore after API call completes
				var anchorInfo = {
					currency: anchorCurrency,
					amount: anchorAmount
				};
				
				// Override the fetchCurrentPrices function temporarily to add our callback
				var originalFetchCurrentPrices = fetchCurrentPrices;
				fetchCurrentPrices = function(skipUrlParams) {
					console.log('=== Modified fetchCurrentPrices called ===');
					var priceURL = "https://pvxg.net/bitcoin-price/index.php";
					console.log('Fetching from URL:', priceURL);
					
					$.getJSON(priceURL, function(data) {
						console.log('=== fetchCurrentPrices API response received ===');
						console.log('API response data:', data);
						
						// Remove n-a-value classes from all fiat fields when switching to current prices
						$('.field.fiat').removeClass('n-a-value loading');
						console.log('Removed n-a-value and loading classes');
						
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
						
						console.log('RateToBTC updated with current prices:', RateToBTC);
						console.log('RateToBTC.usd value:', RateToBTC.usd);
						
						// Update sats per currency display
						updateSatsPerCurrency();
						
						// Force clear any n/a values that should now be available
						forceClearNAValues();
						
						// Load URL parameters after prices are available (only if not in historical mode and not skipped)
						var urlParams = new URLSearchParams(window.location.search);
						if (!urlParams.get('timestamp') && !skipUrlParams) {
							console.log('Loading URL parameters (normal flow)');
							loadUrlParameters();
						} else {
							console.log('Skipping URL parameters load (skipUrlParams:', skipUrlParams, 'timestamp:', urlParams.get('timestamp'), ')');
						}
						
						console.log('=== fetchCurrentPrices completed ===');
						
						// If this was called from "Today" selection, restore the anchor currency
						if (skipUrlParams && anchorInfo) {
							console.log('=== Restoring anchor after API completion ===');
							console.log('RateToBTC after API completion:', RateToBTC);
							restoreAnchorCurrency(anchorInfo.currency, anchorInfo.amount);
							
							// Restore the original function
							fetchCurrentPrices = originalFetchCurrentPrices;
						}
					}).fail(function(xhr, status, error) {
						console.error('=== fetchCurrentPrices FAILED ===');
						console.error('Status:', status);
						console.error('Error:', error);
						console.error('XHR:', xhr);
						
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
			console.log('=== Custom date selected ===');
			console.log('Selected:', customDate);
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
		console.log('=== handleDateChange called ===');
		console.log('Selected date parameter:', selectedDate);
		console.log('Selected date type:', typeof selectedDate);
		console.log('Selected date instanceof Date:', selectedDate instanceof Date);
		
		if (!selectedDate) {
			console.error('handleDateChange: selectedDate is null or undefined');
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
				console.log('Using active input as anchor:', anchorCurrency, anchorAmount);
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
					console.log('Using sats from URL as anchor:', anchorAmount);
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
							console.log('Using first non-zero input as anchor:', anchorCurrency, anchorAmount);
						}
					});
				}
			}
			
			// Default to 1 USD if no anchor found
			if (!anchorCurrency) {
				anchorCurrency = 'usd';
				anchorAmount = 1;
				console.log('No anchor found, defaulting to 1 USD');
			}
			
			console.log('Final anchor:', anchorCurrency, anchorAmount);
			
			var timestamp = Math.floor(selectedDate.getTime() / 1000);
			console.log('Converted to timestamp:', timestamp);
			console.log('Original date time:', selectedDate.getTime());
			console.log('Math.floor result:', Math.floor(selectedDate.getTime() / 1000));
			
			// Update the button text to show the selected date
			console.log('Updating button text...');
			updateButtonText(selectedDate);
			
			// Update URL with timestamp
			console.log('Updating URL with timestamp...');
			var url = new URL(window.location.href);
			url.searchParams.set('timestamp', timestamp);
			window.history.pushState({}, '', url);
			
			console.log('URL updated with timestamp:', url.toString());
			
			// Fetch historical prices with anchor preservation
			console.log('Fetching historical prices with anchor preservation...');
			fetchHistoricalPricesWithAnchor(timestamp, anchorCurrency, anchorAmount);
		} catch (error) {
			console.error('=== Error in handleDateChange ===');
			console.error('Error details:', error);
			console.error('Error stack:', error.stack);
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
		console.log('=== fetchHistoricalPricesWithAnchor called ===');
		console.log('Timestamp:', timestamp);
		console.log('Anchor currency:', anchorCurrency);
		console.log('Anchor amount:', anchorAmount);
		console.log('Current RateToBTC before fetch:', RateToBTC);
		
		var historicalURL = "https://mempool.space/api/v1/historical-price?currency=EUR&timestamp=" + timestamp;
		console.log('Historical URL:', historicalURL);
		
		$.getJSON(historicalURL, function(data) {
			console.log('=== Historical API response received ===');
			console.log('Full response:', data);
			
			if (data && data.prices && data.prices.length > 0) {
				var historicalData = data.prices[0];
				var exchangeRates = data.exchangeRates;
				console.log('Historical data:', historicalData);
				console.log('Exchange rates:', exchangeRates);
				
				// Update RateToBTC with historical data
				updateRatesWithHistoricalData(historicalData, exchangeRates);
				console.log('RateToBTC after historical update:', RateToBTC);
				
				// Update sats per currency display
				updateSatsPerCurrency();
				console.log('Sats per currency updated');
				
				// Restore the anchor currency and amount
				console.log('Restoring anchor:', anchorCurrency, anchorAmount);
				restoreAnchorCurrency(anchorCurrency, anchorAmount);
				
				// Adjust fiat input sizes after anchor restoration
				adjustFiatInputSizes();
			} else {
				console.error('Invalid historical data structure:', data);
				// Fallback to current prices
				console.log('Falling back to current prices...');
				fetchCurrentPrices();
			}
		}).fail(function(xhr, status, error) {
			console.error('=== Failed to fetch historical prices ===');
			console.error('Status:', status);
			console.error('Error:', error);
			console.error('XHR:', xhr);
			console.error('Response text:', xhr.responseText);
			
			// Fallback to current prices
			console.log('Falling back to current prices...');
			fetchCurrentPrices();
		});
	}
	
	// Function to restore the anchor currency and amount
	function restoreAnchorCurrency(anchorCurrency, anchorAmount) {
		console.log('=== restoreAnchorCurrency called ===');
		console.log('Restoring:', anchorCurrency, anchorAmount);
		console.log('Current RateToBTC:', RateToBTC);
		
		// Set the anchor currency value
		var anchorInput = $('#input_' + anchorCurrency);
		if (anchorInput.length > 0) {
			// Format the amount properly
			var formattedAmount = formatNumber(anchorAmount, anchorCurrency);
			console.log('Setting', anchorCurrency, 'to:', formattedAmount);
			
			// Update the input value
			isProgrammaticUpdate = true;
			anchorInput.val(formattedAmount);
			isProgrammaticUpdate = false;
			
			// Recalculate all conversions based on this anchor
			calcConversion(anchorAmount, anchorCurrency, false);
			console.log('Recalculated conversions based on anchor');
			
			// Update written numbers
			writenNumber(european);
			console.log('Updated written numbers');
			
			// Update URL parameters to reflect the anchor
			updateUrlParameters(anchorCurrency, anchorAmount);
			console.log('Updated URL parameters');
			
			// Adjust fiat input sizes after anchor restoration
			adjustFiatInputSizes();
		} else {
			console.error('Anchor input not found:', anchorCurrency);
		}
	}

	// Function to fetch current prices
	function fetchCurrentPrices(skipUrlParams = false) {
		console.log('=== fetchCurrentPrices called ===');
		console.log('skipUrlParams:', skipUrlParams);
		var priceURL = "https://pvxg.net/bitcoin-price/index.php";
		console.log('Fetching from URL:', priceURL);
		
		$.getJSON(priceURL, function(data) {
			console.log('=== fetchCurrentPrices API response received ===');
			console.log('API response data:', data);
			
			// Remove n-a-value classes from all fiat fields when switching to current prices
			$('.field.fiat').removeClass('n-a-value loading');
			console.log('Removed n-a-value and loading classes');
			
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
			
			console.log('RateToBTC updated with current prices:', RateToBTC);
			console.log('RateToBTC.usd value:', RateToBTC.usd);
			
			// Update sats per currency display
			updateSatsPerCurrency();
			
			// Force clear any n/a values that should now be available
			forceClearNAValues();
			
			// Load URL parameters after prices are available (only if not in historical mode and not skipped)
			var urlParams = new URLSearchParams(window.location.search);
			if (!urlParams.get('timestamp') && !skipUrlParams) {
				console.log('Loading URL parameters (normal flow)');
				loadUrlParameters();
			} else {
				console.log('Skipping URL parameters load (skipUrlParams:', skipUrlParams, 'timestamp:', urlParams.get('timestamp'), ')');
			}
			
			console.log('=== fetchCurrentPrices completed ===');
		}).fail(function(xhr, status, error) {
			console.error('=== fetchCurrentPrices FAILED ===');
			console.error('Status:', status);
			console.error('Error:', error);
			console.error('XHR:', xhr);
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
	
	function formatNumber(value, currency) {
		// First, clean the value by removing commas to get the actual number
		var cleanValue = unformatNumber(value);
		
		if (currency === "sat") {
			// Satoshis: whole numbers with commas
			return Math.round(cleanValue || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		} else if (currency === "btc") {
			// Bitcoin: up to 8 decimal places, but trim trailing zeros
			var btcValue = (cleanValue || 0).toFixed(8);
			// Remove trailing zeros and decimal point if all zeros
			btcValue = btcValue.replace(/0+$/, ''); // Remove trailing zeros
			btcValue = btcValue.replace(/\.$/, ''); // Remove trailing decimal point
			return btcValue;
		} else {
			// Fiat: 2 decimal places with commas
			return (cleanValue || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
		
		// Remove trailing zeros after decimal point
		if (str.includes('.')) {
			str = str.replace(/0+$/, ''); // Remove trailing zeros
			str = str.replace(/\.$/, ''); // Remove trailing decimal point
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
			
			// Trim leading and trailing zeros
			cleanValue = trimZeros(cleanValue);
			
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
		console.log('=== Loading URL parameters ===');
		
		// Check for sats parameter first (legacy support)
		if (urlParams.get('sats')) {
			var loadedCurrency = 'sat';
			var loadedValue = urlParams.get('sats');
			console.log('Found sats parameter:', loadedValue);
			
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
				console.log('Found', code, 'parameter:', loadedValue);
				
				$('#input_' + loadedCurrency).val(loadedValue);
				calcConversion(parseFloat(loadedValue), loadedCurrency, false);
				writenNumber(european);
				return; // Exit early if currency parameter found
			}
		}
		
		console.log('No currency parameters found in URL');
		
		// Set default value of 0 sats when no parameters are found
		console.log('Setting default value: 0 sats');
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

		function calcConversion(source_val, source_currency, firstLoad){
		console.log('=== calcConversion called ===');
		console.log('Source value:', source_val);
		console.log('Source currency:', source_currency);
		console.log('First load:', firstLoad);
		console.log('Current RateToBTC:', RateToBTC);
		
			var	btc_input_value = parseFloat($btc_input.val().replace(/,/g, '')).toFixed(8);
		console.log('Initial BTC input value:', btc_input_value);

			//set BTC max if user is editing BTC input
			if( btc_input_value > btc_max_stock ){
				btc_input_value = btc_max_stock
			isProgrammaticUpdate = true;
				$btc_input.val(btc_max_stock)
			isProgrammaticUpdate = false;
			console.log('BTC value capped at max:', btc_max_stock);
			}


			// Get convertion to BTC from the current currency

			if(source_currency == "sat"){
			isProgrammaticUpdate = true;
			var newBtcValue = parseFloat(source_val / RateToBTC[source_currency]).toFixed(8);
			$btc_input.val(newBtcValue);
			isProgrammaticUpdate = false;
			console.log('Converted sats to BTC:', source_val, '/', RateToBTC[source_currency], '=', newBtcValue);
			}
			else if(source_currency == "btc"){
				btc_input_value = btc_input_value;
			console.log('Source is BTC, keeping value:', btc_input_value);
			}
			else{
			isProgrammaticUpdate = true;
			var newBtcValue = parseFloat( parseFloat(source_val) / parseFloat(RateToBTC[source_currency]) ).toFixed(8);
			$btc_input.val(newBtcValue);
			isProgrammaticUpdate = false;
			console.log('Converted', source_currency, 'to BTC:', source_val, '/', RateToBTC[source_currency], '=', newBtcValue);
			}

			// Ensure we have a valid BTC value for calculations
			if (isNaN(btc_input_value) || parseFloat(btc_input_value) <= 0) {
				console.log('BTC input value is invalid, using source value converted to BTC');
				// Convert source value to BTC as fallback
				if (source_currency === "sat") {
					btc_input_value = parseFloat(source_val / RateToBTC[source_currency]).toFixed(8);
				} else if (source_currency === "btc") {
					btc_input_value = parseFloat(source_val).toFixed(8);
				} else {
					btc_input_value = parseFloat(parseFloat(source_val) / parseFloat(RateToBTC[source_currency])).toFixed(8);
				}
				console.log('Fallback BTC value:', btc_input_value);
				
				// Update the BTC input with the calculated value
				isProgrammaticUpdate = true;
				$btc_input.val(btc_input_value);
				isProgrammaticUpdate = false;
			}

			// Updates BTC value
			btc_input_value = parseFloat($btc_input.val().replace(/,/g, '')).toFixed(8);
		console.log('Updated BTC input value:', btc_input_value);
		console.log('BTC input value is valid:', !isNaN(btc_input_value) && btc_input_value > 0);
		
		// Updates all inputs depending on its rate to BTC
		console.log('Updating all currency fields...');
			$(".value-input:not('.active, .bitcoin')").each(function(){
				currency = $(this).data("currency");
			console.log('Processing currency:', currency);
			
			// Check if currency is available (not 'n/a')
			if (RateToBTC[currency] === 'n/a') {
				$(this).val('n/a');
				$(this).closest('.field.fiat').addClass('n-a-value');
				console.log('Set', currency, 'to n/a (not available)');
				return;
			}
			
			// Remove n-a-value class if it was previously set
			$(this).closest('.field.fiat').removeClass('n-a-value');
			
			// Always calculate the value if RateToBTC is available
			var calculatedValue = RateToBTC[currency] * btc_input_value;
			console.log('Calculated', currency, 'value:', RateToBTC[currency], '*', btc_input_value, '=', calculatedValue);
			
			isProgrammaticUpdate = true;
			// Format the value properly based on currency type using the formatNumber function
			var formattedValue = formatNumber(calculatedValue, currency);
			$(this).val(formattedValue);
			console.log('Formatted', currency, ':', calculatedValue, '->', formattedValue);
			isProgrammaticUpdate = false;
			
				(( RateToBTC['sat'] * btc_input_value ) == 1) ? $("#sats-label").text('⚪️ sat') : $("#sats-label").text('⚪️ sats');
			})

		// Adjust fiat input sizes after all values are updated
		adjustFiatInputSizes();

		console.log('=== calcConversion complete ===');
		
		// Update URL parameters with the source currency and value
		updateUrlParameters(source_currency, source_val);
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
				
				// URL parameters are now updated in calcConversion
			}
		} else {
			// Parse regular number input
			var source_val = unformatNumber(inputValue);
			source_val = parseFloat(source_val).toFixed(8);

			$(this).addClass("active");
			calcConversion( source_val, source_currency, false );

			writenNumber(european);

			// URL parameters are now updated in calcConversion
		}

		});






		writenNumber(european);
		$currency_inputs.blur(function() {
			$(this).removeClass("active");
		});

	// Manual test function for debugging
	window.testDatePicker = function(dateString) {
		console.log('=== Manual test of custom date picker ===');
		console.log('Testing with date string:', dateString);
		var testDate = new Date(dateString);
		if (!isNaN(testDate.getTime())) {
			console.log('Valid date created:', testDate);
			handleDateChange(testDate);
		} else {
			console.error('Invalid date string:', dateString);
		}
	};
	
	window.testHistoricalPrices = function(timestamp) {
		console.log('=== Manual test of historical prices ===');
		console.log('Testing with timestamp:', timestamp);
		// For testing, use USD as default anchor
		fetchHistoricalPricesWithAnchor(timestamp, 'usd', 1);
	};
	
	window.showCurrentRates = function() {
		console.log('=== Current RateToBTC ===');
		console.log(RateToBTC);
	};
	
	window.showCustomDatePicker = function() {
		console.log('=== Manually showing simplified date picker ===');
		var currentDate = new Date();
		var urlParams = new URLSearchParams(window.location.search);
		var timestamp = urlParams.get('timestamp');
		if (timestamp) {
			currentDate = new Date(parseInt(timestamp) * 1000);
		}
		showCustomDatePicker(currentDate);
	};
	
	window.debugDatepicker = function() {
		console.log('=== Simplified Date Picker Debug Info ===');
		console.log('Date picker button element:', document.getElementById('date-picker-button'));
		console.log('Current URL timestamp:', new URLSearchParams(window.location.search).get('timestamp'));
		console.log('Current RateToBTC:', RateToBTC);
	};
	
	console.log('=== Script loaded successfully ===');
	console.log('Available test functions:');
	console.log('- testDatePicker("2023-12-15") - Test with a specific date');
	console.log('- testHistoricalPrices(1702684800) - Test with a specific timestamp');
	console.log('- showCurrentRates() - Show current exchange rates');
	console.log('- showCustomDatePicker() - Manually show the simplified date picker');
	console.log('- debugDatepicker() - Show debug info about the simplified date picker');

	function forceRecalculateAllFields() {
		console.log('=== forceRecalculateAllFields called ===');
		
		// Get the currently active input or default to sats
		var activeInput = $(".value-input.active");
		var source_currency = "sat";
		var source_val = 0; // Default to 0 sat
		
		if (activeInput.length > 0) {
			source_currency = activeInput.data("currency");
			source_val = unformatNumber(activeInput.val());
			console.log('Using active input:', source_currency, 'value:', source_val);
		} else {
			// If no active input, use the sats input value
			var satsInput = $('#input_sat');
			if (satsInput.length > 0) {
				source_val = unformatNumber(satsInput.val());
				console.log('Using sats input value:', source_val);
			}
		}
		
		console.log('Recalculating with:', source_currency, source_val);
		
		// Recalculate conversions
		calcConversion(source_val, source_currency, false);
		
		// Update written numbers
		writenNumber(european);
		
		console.log('=== forceRecalculateAllFields complete ===');
	}

	// Function to update rates with historical data
	function updateRatesWithHistoricalData(historicalData, exchangeRates) {
		console.log('=== updateRatesWithHistoricalData called ===');
		console.log('Historical data:', historicalData);
		console.log('Exchange rates:', exchangeRates);
		console.log('RateToBTC before update:', RateToBTC);
		
		// Clear existing rates
		RateToBTC = {
			sat: 100000000,
			btc: 1
		};
		
		// Get USD rate as base (it's always available in historical data)
		var usdRate = historicalData.USD;
		if (!usdRate || usdRate <= 0) {
			console.error('USD rate not available in historical data');
			return;
		}
		
		// Set USD rate directly
		RateToBTC.usd = usdRate;
		console.log('Set USD rate:', usdRate);
		
		// Calculate other rates using exchange rates
		if (exchangeRates.USDEUR) {
			RateToBTC.eur = usdRate * exchangeRates.USDEUR;
			console.log('Set EUR rate:', RateToBTC.eur, '(USD *', exchangeRates.USDEUR, ')');
		}
		
		if (exchangeRates.USDGBP) {
			RateToBTC.gbp = usdRate * exchangeRates.USDGBP;
			console.log('Set GBP rate:', RateToBTC.gbp, '(USD *', exchangeRates.USDGBP, ')');
		}
		
		if (exchangeRates.USDCAD) {
			RateToBTC.cad = usdRate * exchangeRates.USDCAD;
			console.log('Set CAD rate:', RateToBTC.cad, '(USD *', exchangeRates.USDCAD, ')');
		}
		
		if (exchangeRates.USDCHF) {
			RateToBTC.chf = usdRate * exchangeRates.USDCHF;
			console.log('Set CHF rate:', RateToBTC.chf, '(USD *', exchangeRates.USDCHF, ')');
		}
		
		if (exchangeRates.USDAUD) {
			RateToBTC.aud = usdRate * exchangeRates.USDAUD;
			console.log('Set AUD rate:', RateToBTC.aud, '(USD *', exchangeRates.USDAUD, ')');
		}
		
		if (exchangeRates.USDJPY) {
			RateToBTC.jpy = usdRate * exchangeRates.USDJPY;
			console.log('Set JPY rate:', RateToBTC.jpy, '(USD *', exchangeRates.USDJPY, ')');
		}
		
		// Set unsupported currencies to 'n/a' (these are not available in the historical API)
		var unsupportedCurrencies = ['cny', 'rub', 'brl', 'aed', 'try', 'mxn', 'ils', 'zar', 'thb', 'inr', 'sek', 'sar', 'ars'];
		unsupportedCurrencies.forEach(function(currency) {
			RateToBTC[currency] = 'n/a';
			// Add CSS class to visually indicate n/a status
			$('#input_' + currency).closest('.field.fiat').addClass('n-a-value');
			console.log('Set', currency, 'to n/a (unsupported in historical API)');
		});
		
		console.log('RateToBTC after update:', RateToBTC);
		console.log('=== updateRatesWithHistoricalData complete ===');
	}

	// Function to force clear all n/a values and recalculate with current prices
	function forceClearNAValues() {
		console.log('=== forceClearNAValues called ===');
		console.log('Current RateToBTC:', RateToBTC);
		
		var clearedCount = 0;
		// Clear all n/a values from inputs
		$(".value-input").each(function() {
			var $input = $(this);
			var currency = $input.data("currency");
			var currentValue = $input.val();
			
			console.log('Checking', currency, 'input:', currentValue, 'RateToBTC[currency]:', RateToBTC[currency]);
			
			if (currentValue === 'n/a' && RateToBTC[currency] && RateToBTC[currency] !== 'n/a') {
				console.log('Clearing n/a value for', currency);
				// Don't set to '0', just clear the n/a value and remove the class
				// The calcConversion function will calculate the proper value
				$input.val('');
				$input.closest('.field.fiat').removeClass('n-a-value');
				clearedCount++;
			}
		});
		
		console.log('Cleared', clearedCount, 'n/a values');
	}

	// Function to reset the page to defaults
	function resetToDefaults() {
		console.log('=== resetToDefaults called ===');
		
		// Clear all URL parameters
		var url = new URL(window.location.href);
		url.search = '';
		window.history.replaceState({}, '', url);
		console.log('URL cleared:', url.toString());
		
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
		
		console.log('=== resetToDefaults complete ===');
	}

	// Function to reset currency order to default
	function resetCurrencyOrder() {
		console.log('=== resetCurrencyOrder called ===');
		
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
		
		console.log('Currency order reset to default');
	}

})
