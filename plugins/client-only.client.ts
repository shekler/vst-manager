export default defineNuxtPlugin(() => {
  // This plugin only runs on the client side
  // You can add any client-specific initialization here

  // Example: Initialize any client-only features
  if (process.client) {
    // Add any client-specific setup here
    console.log("Client-only plugin initialized");
  }
});
