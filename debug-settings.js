// Debug script to test settings API
const http = require("http");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/settings",
  method: "GET",
};

console.log("Testing settings API...");

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response:", data);
    try {
      const parsed = JSON.parse(data);
      console.log("Parsed response:", JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log("Failed to parse JSON:", e.message);
    }
  });
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
