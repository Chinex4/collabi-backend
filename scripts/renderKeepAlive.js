"use strict";

const http = require("http");
const https = require("https");

const DEFAULT_INTERVAL_MINUTES = 14;
const DEFAULT_TIMEOUT_MS = 10_000;

const parseBoolean = (value) => {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const targetUrl = process.argv[2] || process.env.KEEP_ALIVE_URL;
const intervalMinutes = parseNumber(
  process.env.KEEP_ALIVE_INTERVAL_MINUTES,
  DEFAULT_INTERVAL_MINUTES
);
const timeoutMs = parseNumber(process.env.KEEP_ALIVE_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
const loopEnabled = parseBoolean(process.env.KEEP_ALIVE_LOOP);

if (!targetUrl) {
  console.error("Missing KEEP_ALIVE_URL. Set it in the environment or pass the URL as the first argument.");
  process.exit(1);
}

const ping = (url) =>
  new Promise((resolve, reject) => {
    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch (error) {
      reject(new Error(`Invalid KEEP_ALIVE_URL: ${error.message}`));
      return;
    }

    const transport = parsedUrl.protocol === "https:" ? https : http;

    const request = transport.request(
      parsedUrl,
      {
        method: "GET",
        timeout: timeoutMs,
        headers: {
          "user-agent": "collabi-render-keep-alive/1.0"
        }
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");

          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve({
              statusCode: response.statusCode,
              body
            });
            return;
          }

          reject(
            new Error(
              `Health check failed with status ${response.statusCode}: ${body || "empty response"}`
            )
          );
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.end();
  });

const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

const runOnce = async () => {
  const result = await ping(targetUrl);
  log(`Pinged ${targetUrl} successfully with status ${result.statusCode}.`);
};

const runLoop = async () => {
  const intervalMs = intervalMinutes * 60 * 1000;

  log(
    `Keep-alive loop started for ${targetUrl}. Interval: ${intervalMinutes} minute(s), timeout: ${timeoutMs}ms.`
  );

  while (true) {
    try {
      await runOnce();
    } catch (error) {
      log(`Ping failed: ${error.message}`);
    }

    await new Promise((resolve) => {
      setTimeout(resolve, intervalMs);
    });
  }
};

const main = async () => {
  if (loopEnabled) {
    await runLoop();
    return;
  }

  await runOnce();
};

main().catch((error) => {
  console.error(`[${new Date().toISOString()}] ${error.message}`);
  process.exit(1);
});
