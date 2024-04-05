import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from 'path';
import jwt, { JwtPayload } from 'jsonwebtoken';
import rateLimit from "express-rate-limit";
import { dirname } from 'dirname-filename-esm';
import destr from "destr";

import { client } from './bot/index.js';
import kv from './utilities/kv.js';
import Safety from './utilities/safety.js';
import functions from "./utilities/structs/functions.js";
import error from "./utilities/structs/error.js";
import log from './utilities/structs/log.js';
import { version } from "./utilities/cron/update.js";

import "./utilities/cron/update.js";
import { DateAddHours } from "./routes/auth.js";

const __dirname = dirname(import.meta);

global.kv = kv;
global.safety = Safety;
global.JWT_SECRET = functions.MakeID();
global.safetyEnv = Safety.env;
global.accessTokens = [];
global.refreshTokens = [];
global.clientTokens = [];
global.smartXMPP = false;
global.exchangeCodes = [];

const app = express();
const PORT = Safety.env.PORT;

await Safety.airbag();
const bottoken = "TOKENHERE";
await client.login(bottoken);

let redisTokens: any;
let tokens: any;

if (Safety.env.USE_REDIS) {
    redisTokens = await kv.get('tokens');
    try {
        tokens = destr(redisTokens);
    } catch (err) {
        await kv.set('tokens', fs.readFileSync(path.join(__dirname, "../tokens.json")).toString());
        log.error("Redis tokens error, resetting tokens.json");
    }
} else {
    tokens = destr(fs.readFileSync(path.join(__dirname, "../tokens.json")).toString());
}

for (let tokenType in tokens) {
    for (let tokenIndex in tokens[tokenType]) {
        let decodedToken: JwtPayload = jwt.decode(tokens[tokenType][tokenIndex].token.replace("eg1~", "")) as JwtPayload;

        if (DateAddHours(new Date(decodedToken.creation_date), decodedToken.hours_expire).getTime() <= new Date().getTime()) {
            tokens[tokenType].splice(Number(tokenIndex), 1);
        }
    }
}

if (Safety.env.USE_REDIS) {
    await kv.set('tokens', JSON.stringify(tokens, null, 2));
} else {
    fs.writeFileSync(path.join(__dirname, "../tokens.json"), JSON.stringify(tokens, null, 2) || "");
}

if (!tokens || !tokens.accessTokens) {
    console.log("No access tokens found, resetting tokens.json");
    await kv.set('tokens', fs.readFileSync(path.join(__dirname, "../tokens.json")).toString());
    tokens = destr(fs.readFileSync(path.join(__dirname, "../tokens.json")).toString());
}

global.accessTokens = tokens.accessTokens;
global.refreshTokens = tokens.refreshTokens;
global.clientTokens = tokens.clientTokens;

mongoose.set("strictQuery", true);

mongoose
    .connect(Safety.env.MONGO_URI)
    .then(() => {
        log.backend("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB: ", error);
    });

mongoose.connection.on("error", (err) => {
    log.error(
        "MongoDB failed to connect, please make sure you have MongoDB installed and running."
    );
    throw err;
});

app.get("/", (req, res) => {
    res.status(200).json({
        status: "ok",
        version: version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpuUsage: process.cpuUsage(),
        environment: process.env.NODE_ENV,
    });
});

app.use(rateLimit({ windowMs: 0.5 * 60 * 1000, max: 45 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const importRoutes = async (dir) => {
    for (const fileName of fs.readdirSync(path.join(__dirname, dir))) {
        if (fileName.includes(".map")) continue;
        try {
            app.use((await import(`file://${__dirname}/${dir}/${fileName}`)).default);
        } catch (error) {
            console.log(fileName, error)
        }
    }
};

await importRoutes("routes");
await importRoutes("api");

app.listen(PORT, () => {
    log.backend(`App started listening on port ${PORT}`);
    import("./xmpp/xmpp.js");
}).on("error", async (err) => {
    if (err.message == "EADDRINUSE") {
        log.error(`Port ${PORT} is already in use!\nClosing in 3 seconds...`);
        await functions.sleep(3000)
        process.exit(0);
    } else throw err;
});

const loggedUrls = new Set<string>();

app.use((req, res, next) => {
    const url = req.originalUrl;
    if (!loggedUrls.has(url)) {
        log.debug(`Missing endpoint: ${req.method} ${url} request port ${req.socket.localPort}`);
        error.createError(
            "errors.com.epicgames.common.not_found",
            "Sorry the resource you were trying to find could not be found",
            undefined, 1004, undefined, 404, res
        );
    }
    next();
});
