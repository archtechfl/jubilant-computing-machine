var widgets = {};

document.addEventListener("DOMContentLoaded", function(event) { 
	console.log("Starting currency converter");
	var widgetsInDoc = document.getElementsByClassName("widget");
	for (var widgetCount = 0; widgetCount < widgetsInDoc.length; widgetCount++) {
		var id = widgetsInDoc[widgetCount].id;
		widgets[id] = new CurrencyConverter(id);
		widgets[id].start();
	}
});

function CurrencyConverter(id) {
	this.id = id;
	this.original_currency_input = "original-currency-" + this.id;
	this.original_currency_selector = "original-currency-select-" + this.id;
	this.converted_currency_selector = "converted-currency-select-" + this.id;
	this.converted_currency_field = "converted-currency-" + this.id;
	this.error_selector = "error-" + this.id;
	this.formatting_error = "error-" + this.id + "-A";
};

CurrencyConverter.prototype.start = function() {
	this.listenForValueChange();
	this.onChangeConvertedRate();
	this.onChangeOriginalRate();
};

CurrencyConverter.prototype.listenForValueChange = function() {
	var self = this;
	document.getElementById(this.original_currency_input).oninput = function(event) {
		var value = event.currentTarget.value;
		var validation = self.validateValue(value);
		var convertedCurrencyCode = document.getElementById(self.converted_currency_selector).value;
		var originalCurrencyCode = document.getElementById(self.original_currency_selector).value;
		if (validation !== false) {
			if (originalCurrencyCode !== convertedCurrencyCode){
				self.getConvertedRate(Number(validation));
			} else {
				self.removeAllErrors();
				document.getElementById(self.converted_currency_field).value = document.getElementById(self.original_currency_input).value;
			}
		} else {
			document.getElementById(self.converted_currency_field).value = 0;
		}
	};
};

CurrencyConverter.prototype.validateValue = function(amount) {
	// Only allowable characters are digits (0-9) and "." (decimal)
	var self = this;
	var amountToValidate = amount;
	// Check for more than one decimal
	var moreThanOneDecimal = amount.match(/\./g);
	var validMatches = [];
	if (moreThanOneDecimal !== null){
		// Decimal present
		if (moreThanOneDecimal.length === 1){
			// Validate based on decimal
			// Add trailing zero if not present
			var amountLength = amount.length;
			if (amount[amountLength - 1] === ".") {
				amount = amount + "0";
			}
			validMatches = amount.match(/\d*.{1}\d+/);
		}
	} else {
		// Validate based on no decimal
		validMatches = amount.match(/\d+/);
	}
	if (validMatches) {
		if (validMatches.length > 0) {
			if (amount.length === validMatches[0].length) {
				return validMatches[0];
			}
		}
	}
	// If data in input but no valid matches, throw formatting error
	if (amount.length > 0) {
		// If there is data in the input field but no match, throw error
		var formatError = document.getElementById(self.formatting_error);
		formatError.classList.remove("hide");
	}
	return false;
}

CurrencyConverter.prototype.getConvertedRate = function(amount) {
	var request = new XMLHttpRequest();
	var originalAmount = amount;
	var originalCurrencyCode = document.getElementById(this.original_currency_selector).value;
	var self = this;

	request.onload = function() {
		if (this.status === 200) {
			self.removeAllErrors();
			var response = JSON.parse(this.response);
			var convertCurrency = document.getElementById(self.converted_currency_selector).value;
			var convertCurrencyRate = response["rates"][convertCurrency];
			if (convertCurrencyRate === undefined) {
				var error = document.getElementById(self.error_selector);
				error.classList.remove("hide");
			} else {
				var convertedAmount = originalAmount * convertCurrencyRate;
				document.getElementById(self.converted_currency_field).value = convertedAmount;
			}
		} else {
			var error = document.getElementById(self.error_selector);
			error.classList.remove("hide");
		}
	};

	request.open("GET", "https://api.fixer.io/latest?base=" + originalCurrencyCode, true);
	request.send();
};

CurrencyConverter.prototype.onChangeConvertedRate = function() {
	var self = this;
	document.getElementById(self.converted_currency_selector).onchange = function(event) {
		var value = event.currentTarget.value;
		var originalCurrencyCode = document.getElementById(self.original_currency_selector).value;
		var originalCurrencyValue = document.getElementById(self.original_currency_input).value;
		if (originalCurrencyCode !== value) {
			var validation = self.validateValue(originalCurrencyValue);
			if (validation !== false) {
				self.getConvertedRate(Number(originalCurrencyValue));
			}
		} else {
			document.getElementById(self.converted_currency_field).value = originalCurrencyValue;
			self.removeAllErrors();
		}
	}
}

CurrencyConverter.prototype.onChangeOriginalRate = function() {
	var self = this;
	document.getElementById(self.original_currency_selector).onchange = function(event) {
		var value = event.currentTarget.value;
		var convertedCurrencyCode = document.getElementById(self.converted_currency_selector).value;
		var originalCurrencyValue = document.getElementById(self.original_currency_input).value;
		if (convertedCurrencyCode !== value) {
			var validation = self.validateValue(originalCurrencyValue);
			if (validation !== false) {
				self.getConvertedRate(Number(originalCurrencyValue));
			}
		} else {
			document.getElementById(self.converted_currency_field).value = originalCurrencyValue;
			self.removeAllErrors();
		}
	}
}

CurrencyConverter.prototype.removeAllErrors = function() {
	var self = this;
	var error = document.getElementById(self.error_selector);
	var formatError = document.getElementById(self.formatting_error);
	error.classList.add("hide");
	formatError.classList.add("hide");
};