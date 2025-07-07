const vstScanner = require("vst-scanner");
const path = require("path");

// Test function to verify vst-scanner is working
function testVstScanner() {
	console.log("Testing vst-scanner library...");

	// Test with a non-existent file to see error handling
	try {
		const result = vstScanner.scan("non-existent-file.vst3");
		console.log("Result for non-existent file:", result);
	} catch (error) {
		console.log("Error handling for non-existent file:", error.message);
	}

	// Test the library's available methods
	console.log("Available vst-scanner methods:", Object.keys(vstScanner));

	// Test the read method
	try {
		const result = vstScanner.read("non-existent-file.vst3");
		console.log("Read result for non-existent file:", result);
	} catch (error) {
		console.log("Error handling for read method:", error.message);
	}
}

testVstScanner();
