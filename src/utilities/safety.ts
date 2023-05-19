import path from "path";
import log from "../structs/log";

const dotenv = require("dotenv");
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

interface iEnv {
    MONGO_URI: string | undefined;
    USE_S3: Boolean | undefined;
    S3_BUCKET_NAME: string | undefined;
    S3_ENDPOINT: string | undefined;
    S3_ACCESS_KEY_ID: string | undefined;
    S3_SECRET_ACCESS_KEY: string | undefined;
    BOT_TOKEN: string | undefined;
    CLIENT_ID: string | undefined;
    GUILD_ID: string | undefined;
    GLOBALCHAT_ENABLED: Boolean | undefined;
    NAME: string | undefined;
    USE_REDIS: Boolean | undefined;
    REDIS_TOKEN: string | undefined;
    REDIS_URL: string | undefined;
}

export class safety {
    private convertToBool(value: string | undefined | boolean, key: string): Boolean {
        if (value == "true") {
            return true;
        } else if (value == "false") {
            return false;
        } else {
            throw new Error(
                `The enviroment variable ${key} is not true or false, please declare it correctly in the .env file. Value: ${value}`
            );
        }
    }

    public isDocker(): Boolean {
        if (process.env.DOCKER == "true") {
            return true;
        }
        return false;
    }

    public env: iEnv = {
        MONGO_URI: process.env.MONGO_URI,
        USE_S3: this.convertToBool(process.env.USE_S3, "USE_S3"),
        S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
        S3_ENDPOINT: process.env.S3_ENDPOINT,
        S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
        S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
        BOT_TOKEN: process.env.BOT_TOKEN,
        CLIENT_ID: process.env.CLIENT_ID,
        GUILD_ID: process.env.GUILD_ID,
        GLOBALCHAT_ENABLED: this.convertToBool(process.env.GLOBALCHATENABLED, "GLOBALCHATENABLED"),
        NAME: process.env.NAME,
        USE_REDIS: this.convertToBool(process.env.USE_REDIS, "USE_REDIS"),
        REDIS_TOKEN: process.env.REDIS_TOKEN,
        REDIS_URL: process.env.REDIS_URL,
    };

    public checkENV(): boolean {
        let errorOccured: boolean = false;
        let missingVariables: string[] = [];

        if (this.isDocker()) {
            log.warn("Docker detected, disabling S3.");
            this.env.USE_S3 = false;
        }
        for (const [key, value] of Object.entries(this.env)) {
            if (value == undefined) {
                missingVariables.push(key);
                errorOccured = true;
            }
            if (key == "NAME") {
                if (value.length > 16) {
                    throw new TypeError(
                        `The environment variable ${key} is too long, please declare it in the .env file.`
                    );
                } else {
                    this.env[key] = value.replace(/ /g, "_");
                }
            }
        }

        if (errorOccured) {
            console.log(missingVariables.length);
            //Super unnecessary, but I like it.
            throw new TypeError(
                `The environment ${missingVariables.length > 1 ? "variables" : "variable"
                } ${missingVariables
                    .slice(0, -1)
                    .join(", ")}${missingVariables.length > 1 ? "," : ""
                }${missingVariables.length > 1 ? " and" : ""
                } ${missingVariables.slice(-1)} ${missingVariables.length > 1 ? "are" : "is"
                } missing, please declare ${missingVariables.length > 1 ? "them" : "it"
                } in the .env file.`
            );
        }

        //Not recommended to use, but you have the option to.
        global.env = this.env;
        return true;
    }
}

export default new safety;