/* This script starts the FastAPI and Next.js servers, setting up user configuration if necessary. It reads environment variables to configure API keys and other settings, ensuring that the user configuration file is created if it doesn't exist. The script also handles the starting of both servers and keeps the Node.js process alive until one of the servers exits. */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn, execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { platform } from "os";
import { createServer } from "net";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastapiDir = join(__dirname, "servers/fastapi");
const nextjsDir = join(__dirname, "servers/nextjs");
const isWindows = platform() === "win32";

const args = process.argv.slice(2);
const hasDevArg = args.includes("--dev") || args.includes("-d") || args.includes("dev");
const isDev = hasDevArg;
const canChangeKeys = process.env.CAN_CHANGE_KEYS !== "false";

const fastapiPort = 8000;
const nextjsPort = 3000;
const appmcpPort = 8001;

const appDataDirectory = process.env.APP_DATA_DIRECTORY || join(__dirname, "app_data");
const userConfigPath = join(appDataDirectory, "userConfig.json");
const userDataDir = dirname(userConfigPath);

// Create user_data directory if it doesn't exist
if (!existsSync(userDataDir)) {
  mkdirSync(userDataDir, { recursive: true });
}

// Setup node_modules for development
const setupNodeModules = () => {
  return new Promise((resolve, reject) => {
    console.log("Setting up node_modules for Next.js...");
    const npmProcess = spawn("npm", ["install"], {
      cwd: nextjsDir,
      stdio: "inherit",
      env: process.env,
    });

    npmProcess.on("error", (err) => {
      console.error("npm install failed:", err);
      reject(err);
    });

    npmProcess.on("exit", (code) => {
      if (code === 0) {
        console.log("npm install completed successfully");
        resolve();
      } else {
        console.error(`npm install failed with exit code: ${code}`);
        reject(new Error(`npm install failed with exit code: ${code}`));
      }
    });
  });
};

process.env.USER_CONFIG_PATH = userConfigPath;
process.env.APP_DATA_DIRECTORY = appDataDirectory;

// Set TEMP_DIRECTORY if not already set
if (!process.env.TEMP_DIRECTORY) {
  process.env.TEMP_DIRECTORY = "/tmp/decklan";
}

//? UserConfig is only setup if API Keys can be changed
const setupUserConfigFromEnv = () => {
  let existingConfig = {};

  if (existsSync(userConfigPath)) {
    existingConfig = JSON.parse(readFileSync(userConfigPath, "utf8"));
  }

  // Only allow OpenAI and Google providers per Jay's Week 4 Tuesday instruction
  if (!["openai", "google"].includes(existingConfig.LLM)) {
    existingConfig.LLM = undefined;
  }

  const userConfig = {
    LLM: process.env.LLM || existingConfig.LLM,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || existingConfig.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || existingConfig.OPENAI_MODEL,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || existingConfig.GOOGLE_API_KEY,
    GOOGLE_MODEL: process.env.GOOGLE_MODEL || existingConfig.GOOGLE_MODEL,
    // OLLAMA_URL: process.env.OLLAMA_URL || existingConfig.OLLAMA_URL,  // Commented out per Jay's Week 4 Tuesday instruction
    // OLLAMA_MODEL: process.env.OLLAMA_MODEL || existingConfig.OLLAMA_MODEL,  // Commented out per Jay's Week 4 Tuesday instruction
    // ANTHROPIC_API_KEY:  // Commented out per Jay's Week 4 Tuesday instruction
    //   process.env.ANTHROPIC_API_KEY || existingConfig.ANTHROPIC_API_KEY,
    // ANTHROPIC_MODEL:  // Commented out per Jay's Week 4 Tuesday instruction
    //   process.env.ANTHROPIC_MODEL || existingConfig.ANTHROPIC_MODEL,
    // CUSTOM_LLM_URL: process.env.CUSTOM_LLM_URL || existingConfig.CUSTOM_LLM_URL,  // Commented out per Jay's Week 4 Tuesday instruction
    // CUSTOM_LLM_API_KEY:  // Commented out per Jay's Week 4 Tuesday instruction
    //   process.env.CUSTOM_LLM_API_KEY || existingConfig.CUSTOM_LLM_API_KEY,
    // CUSTOM_MODEL: process.env.CUSTOM_MODEL || existingConfig.CUSTOM_MODEL,  // Commented out per Jay's Week 4 Tuesday instruction
    PEXELS_API_KEY: process.env.PEXELS_API_KEY || existingConfig.PEXELS_API_KEY,
    PIXABAY_API_KEY:
      process.env.PIXABAY_API_KEY || existingConfig.PIXABAY_API_KEY,
    IMAGE_PROVIDER: process.env.IMAGE_PROVIDER || existingConfig.IMAGE_PROVIDER,
    // TOOL_CALLS: process.env.TOOL_CALLS || existingConfig.TOOL_CALLS,  // Commented out per Jay's Week 4 Tuesday instruction - only used by Custom provider
    // DISABLE_THINKING:  // Commented out per Jay's Week 4 Tuesday instruction - only used by Custom provider
    //   process.env.DISABLE_THINKING || existingConfig.DISABLE_THINKING,
    // EXTENDED_REASONING:  // Commented out per Jay's Week 4 Tuesday instruction - only used by Anthropic
    //   process.env.EXTENDED_REASONING || existingConfig.EXTENDED_REASONING,
    WEB_GROUNDING: process.env.WEB_GROUNDING || existingConfig.WEB_GROUNDING,
    // USE_CUSTOM_URL: process.env.USE_CUSTOM_URL || existingConfig.USE_CUSTOM_URL,  // Commented out per Jay's Week 4 Tuesday instruction - only used by Ollama
  };

  writeFileSync(userConfigPath, JSON.stringify(userConfig));
};

const runCommand = (command, args, options, label) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${label || command} exited with code ${code}`));
      }
    });
  });
};

const findSystemPython = () => {
  const candidates = ["python3", "python"];
  for (const candidate of candidates) {
    try {
      execSync(`${candidate} --version`, { stdio: "ignore" });
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(
    "Python 3.x is required to run the FastAPI server. Install it or add it to your PATH."
  );
};

const setupFastApiEnv = async () => {
  const venvPython = join(
    fastapiDir,
    ".venv",
    isWindows ? "Scripts" : "bin",
    isWindows ? "python.exe" : "python"
  );

  if (!existsSync(venvPython)) {
    console.log("Creating FastAPI virtual environment...");
    const systemPython = findSystemPython();
    await runCommand(
      systemPython,
      ["-m", "venv", ".venv"],
      { cwd: fastapiDir, stdio: "inherit", env: process.env },
      "python -m venv"
    );
  }

  console.log("Installing FastAPI dependencies (pip install -e .)...");
  await runCommand(
    venvPython,
    ["-m", "pip", "install", "-e", "."],
    { cwd: fastapiDir, stdio: "inherit", env: process.env },
    "pip install -e ."
  );
};

const ensurePortAvailable = (port, serviceName) => {
  return new Promise((resolve, reject) => {
    const tester = createServer();

    tester.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        const error = new Error(
          `${serviceName} port ${port} is already in use. Stop the other process using that port or change the port configuration.`
        );
        error.port = port;
        reject(error);
      } else {
        reject(err);
      }
    });

    tester.once("listening", () => {
      tester.close(resolve);
    });

    tester.listen(port, "0.0.0.0");
  });
};

const startServers = async () => {
  try {
    await ensurePortAvailable(fastapiPort, "FastAPI");
    await ensurePortAvailable(nextjsPort, "Next.js");
  } catch (error) {
    console.error(error.message);
    if (error.port) {
      console.error(
        `Tip: run "lsof -nP -iTCP:${error.port} | grep LISTEN" to find the process holding that port.`
      );
    }
    process.exit(1);
  }

  const venvPython = join(
    fastapiDir,
    ".venv",
    isWindows ? "Scripts" : "bin",
    isWindows ? "python.exe" : "python"
  );

  let pythonCmd = venvPython;
  if (!existsSync(venvPython)) {
    pythonCmd = findSystemPython();
  }
  
  const fastApiProcess = spawn(
    pythonCmd,
    [
      "server.py",
      "--port",
      fastapiPort.toString(),
      "--reload",
      isDev ? "true" : "false",
    ],
    {
      cwd: fastapiDir,
      stdio: "inherit",
      env: process.env,
    }
  );

  fastApiProcess.on("error", (err) => {
    console.error("FastAPI process failed to start:", err);
    if (err.code === "EADDRINUSE" || err.message?.includes("Address already in use")) {
      console.error(`Port ${fastapiPort} is already in use. Please stop the existing process or use a different port.`);
    }
  });

  const appmcpProcess = spawn(
    pythonCmd,
    ["mcp_server.py", "--port", appmcpPort.toString()],
    {
      cwd: fastapiDir,
      stdio: "ignore",
      env: process.env,
    }
  );

  appmcpProcess.on("error", (err) => {
    console.error("App MCP process failed to start:", err);
  });

  const nextjsProcess = spawn(
    "npm",
    ["run", isDev ? "dev" : "start", "--", "-p", nextjsPort.toString()],
    {
      cwd: nextjsDir,
      stdio: "inherit",
      env: process.env,
    }
  );

  nextjsProcess.on("error", (err) => {
    console.error("Next.js process failed to start:", err);
    if (err.code === "EADDRINUSE" || err.message?.includes("Address already in use")) {
      console.error(`Port ${nextjsPort} is already in use. Please stop the existing process or use a different port.`);
    }
  });

  // Ollama server startup - Commented out per Jay's Week 4 Tuesday instruction
  // // Try to start ollama, but don't fail if it's already running
  // let ollamaProcess = null;
  // try {
  //   ollamaProcess = spawn("ollama", ["serve"], {
  //     cwd: "/",
  //     stdio: "ignore",
  //     env: process.env,
  //   });
  //
  //   ollamaProcess.on("error", (err) => {
  //     // Ollama might already be running, which is fine
  //     if (err.code !== "ENOENT") {
  //       console.warn("Ollama process failed to start (may already be running):", err.message);
  //     }
  //     ollamaProcess = null;
  //   });
  // } catch (err) {
  //   console.warn("Could not start Ollama (may already be running)");
  //   ollamaProcess = null;
  // }

  // Keep the Node process alive until both servers exit
  const exitPromises = [
    new Promise((resolve) => fastApiProcess.on("exit", resolve)),
    new Promise((resolve) => nextjsProcess.on("exit", resolve)),
  ];

  // if (ollamaProcess) {  // Commented out per Jay's Week 4 Tuesday instruction
  //   exitPromises.push(new Promise((resolve) => ollamaProcess.on("exit", resolve)));
  // }

  const exitCode = await Promise.race(exitPromises);

  console.log(`One of the processes exited. Exit code: ${exitCode}`);
  process.exit(exitCode);
};

// Start nginx service (skip on macOS or in dev mode)
const startNginx = () => {
  // Skip nginx on macOS (service command doesn't exist) or in dev mode
  if (platform() === "darwin" || isDev) {
    console.log("Skipping nginx (not needed in dev mode or on macOS)");
    return;
  }

  const nginxProcess = spawn("service", ["nginx", "start"], {
    stdio: "inherit",
    env: process.env,
  });

  nginxProcess.on("error", (err) => {
    console.warn("Nginx process failed to start (this is optional):", err.message);
  });

  nginxProcess.on("exit", (code) => {
    if (code === 0) {
      console.log("Nginx started successfully");
    } else {
      console.warn(`Nginx failed to start with exit code: ${code} (this is optional)`);
    }
  });
};

const main = async () => {
  if (isDev) {
    await setupNodeModules();
  }

  if (canChangeKeys) {
    setupUserConfigFromEnv();
  }

  await setupFastApiEnv();
  startServers();
  startNginx();
};

main();
