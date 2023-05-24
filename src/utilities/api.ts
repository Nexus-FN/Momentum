const Api = require("../model/api-gres.js");
import path from "path";
import kv from "./kv";
const dotenv = require("dotenv");
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

async function verifyApikey(req, res, next) {

    const apikey = req.headers["x-api-key"];
    if (!apikey) return res.status(401).json({ error: "No api key provided" });

    const cachedApi = await kv.get(apikey);
    if (cachedApi) {
        return next();
    }

    Api.findOne({where: { apikey: apikey }}, (err, api) => {
        if (err) return res.status(500).json({ error: "Internal server error" });
        if (!api) return res.status(401).json({ error: "Invalid api key" });

        kv.set(apikey, JSON.stringify(api));
        next();
    });
};

export { verifyApikey };
