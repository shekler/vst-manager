const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

function isProduction() {
  return app.isPackaged;
}

let mainWindow;
let frontProcess;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, "public/icon.png"),
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*; font-src 'self' data:;"],
      },
    });
  });

  // Load the app
  if (isProduction()) {
    // In production, start the Nuxt server and load from it
    const serverPath = path.join(process.resourcesPath, "server");
    const indexPath = path.join(serverPath, "index.mjs");

    console.log("Starting production server from:", indexPath);

    // Start the Nuxt server
    frontProcess = spawn("node", [indexPath], {
      cwd: serverPath,
      detached: true,
      stdio: "pipe",
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: "3000",
      },
    });

    // Handle server output
    frontProcess.stdout.on("data", (data) => {
      console.log("Server stdout:", data.toString());
    });

    frontProcess.stderr.on("data", (data) => {
      console.log("Server stderr:", data.toString());
    });

    // Wait for the server to start, then load the app
    const waitForServer = () => {
      const http = require("http");
      const req = http.request(
        {
          hostname: "localhost",
          port: 3000,
          path: "/",
          method: "GET",
          timeout: 1000,
        },
        (res) => {
          console.log("Server is ready, loading app...");
          mainWindow.loadURL("http://localhost:3000");
        },
      );

      req.on("error", () => {
        console.log("Server not ready yet, retrying in 1 second...");
        setTimeout(waitForServer, 1000);
      });

      req.on("timeout", () => {
        console.log("Server timeout, retrying in 1 second...");
        req.destroy();
        setTimeout(waitForServer, 1000);
      });

      req.end();
    };

    // Start checking for server readiness after 2 seconds
    setTimeout(waitForServer, 2000);
  } else {
    // In development, spawn the Nuxt dev server if not already running
    const nuxtPath = path.join(__dirname, "../node_modules/.bin/nuxt");
    const projectPath = path.join(__dirname, "../");

    frontProcess = spawn(nuxtPath, ["dev"], {
      cwd: projectPath,
      detached: true,
      stdio: "inherit",
    });

    // Wait a bit for the server to start, then load the app
    setTimeout(() => {
      console.log("Loading development app from localhost:3000");
      mainWindow.loadURL("http://localhost:3000");
    }, 2000);
  }

  // Handle window closed event properly
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
  // Kill the spawned process if it exists
  if (frontProcess) {
    frontProcess.kill();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle app quit to clean up spawned processes
app.on("before-quit", () => {
  if (frontProcess) {
    frontProcess.kill();
  }
});
