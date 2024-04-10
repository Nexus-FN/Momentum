import express from "express";
const app = express.Router();
import fs from "fs";
import crypto from "crypto";
import path from "path";
import S3 from 'aws-sdk/clients/s3.js';
const limit = (await import("express-limit")).limit;
import os from 'os';
import { verifyToken, verifyClient } from "../tokenManager/tokenVerify.js";
import functions from "../utilities/structs/functions.js";
import { AWSError } from 'aws-sdk/lib/error.js';
import log from '../utilities/structs/log.js';
import Safety from './../utilities/safety.js';
import { dirname } from 'dirname-filename-esm';

const __dirname = dirname(import.meta);

import NodeCache from "node-cache";
const cache = new NodeCache();

const operatingSystem = os.platform();

let seasons = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

let pathToClientSettings: string = "";
if (operatingSystem === "win32") {
    pathToClientSettings = path.join(__dirname, "../../ClientSettings");
    if (!fs.existsSync(pathToClientSettings)) {
        fs.mkdirSync(pathToClientSettings);
        log.debug("ClientSettings folder for Windows created successfully.");
    }
} else if (operatingSystem === "linux") {
    pathToClientSettings = path.join(__dirname, "../../ClientSettings");
    if (!fs.existsSync(pathToClientSettings)) {
        fs.mkdirSync(pathToClientSettings);
        fs.chmodSync(pathToClientSettings, 0o700);
        log.debug("ClientSettings folder for Linux created successfully.");
    }
}

let s3: S3;

if (Safety.env.USE_S3 == true) {
    log.debug("USE S3 TRUE");
    s3 = new S3({
        endpoint: Safety.env.S3_ENDPOINT,
        credentials: {
            accessKeyId: Safety.env.S3_ACCESS_KEY_ID || "",
            secretAccessKey: Safety.env.S3_SECRET_ACCESS_KEY || "",
        },
    });

    //check if connection is valid
    s3.listBuckets((err: AWSError, data: S3.ListBucketsOutput) => {
        if (err) {
            log.error("S3 connection failed");
            log.error(err.toString());
        } else {
            log.backend("S3 connection successful");
            log.debug("S3 buckets: " + JSON.stringify(data.Buckets));
        }
    });

} else {
    log.debug("USE S3 FALSE");
}

//Save settings stuff
app.use((req: any, res, next) => {
    if (req.originalUrl.toLowerCase().startsWith("/fortnite/api/cloudstorage/user/") && req.method === "PUT") {
        req.rawBody = "";
        req.setEncoding("latin1");

        req.on("data", (chunk) => req.rawBody += chunk);
        req.on("end", () => next());
    }
    else return next();
})

const getCloudFile = async (objectName: string) => {
    const params: S3.GetObjectRequest = {
        Bucket: Safety.env.S3_BUCKET_NAME || "BucketNotSet",
        Key: objectName,
    };
    try {
        const data: S3.GetObjectOutput = await s3.getObject(params).promise();
        return data.Body;
    } catch (err: any) {
        if (err.code === "NoSuchKey") {
            await s3.putObject({
                ...params,
                Body: "",
                ContentType: "text/plain",
            }).promise();
            return Buffer.from("");
        }
        throw err;
    }
};
const listCloudFiles = async (prefix: string) => {
    const objectsList: S3.Object[] = [];

    const listObjects = async (ContinuationToken?: string) => {
        const params: S3.ListObjectsV2Request = {
            Bucket: Safety.env.S3_BUCKET_NAME,
            Prefix: prefix,
            ContinuationToken,
        };
        const data = await s3.listObjects(params).promise();
        objectsList.push(...(data.Contents || []));
        if (data.IsTruncated) {
            await listObjects(data.NextMarker);
        }
    };

    await listObjects();

    return objectsList;
};

const createCloudStorageFolder = async (uid: string) => {
    const folderName = `CloudStorage/${uid}/`;
    const params: S3.PutObjectRequest = {
        Bucket: Safety.env.S3_BUCKET_NAME,
        Key: folderName,
        Body: "",
        ContentType: "application/x-directory",
    };
    await s3.putObject(params).promise();
};

//.Ini Stuff
app.get("/fortnite/api/cloudstorage/system", async (req, res) => {
    if (Safety.env.USE_S3) {
        try {
            const uid = Safety.env.NAME;
            const folderName = `CloudStorage/${uid}`;

            const folderObjects = await listCloudFiles(`${folderName}/`);
            if (folderObjects.length === 0) {
                await createCloudStorageFolder(uid!);
            }

            const CloudFiles = folderObjects
                .filter(object => object.Key!.toLowerCase().endsWith(".ini"))
                .map(object => ({
                    uniqueFilename: object.Key!.split("/").pop(),
                    filename: object.Key!.split("/").pop(),
                    hash: crypto.createHash('sha1').update("w").digest('hex'),
                    hash256: crypto.createHash('sha256').update("w").digest('hex'),
                    length: object.Size,
                    contentType: "application/octet-stream",
                    uploaded: new Date(),
                    storageType: "S3",
                    storageIds: {},
                    doNotCache: true
                }));

            const localFiles = fs.readdirSync(path.join(__dirname, "../../", "CloudStorage"));
            for (const file of localFiles) {
                const key = `CloudStorage/${uid}/${file}`;
                const object = folderObjects.find(obj => obj.Key === key);
                if (!object) {
                    const fileData = fs.readFileSync(path.join(__dirname, "../../", "CloudStorage", file));
                    const params: S3.PutObjectRequest = {
                        Bucket: Safety.env.S3_BUCKET_NAME || "BucketNotSet",
                        Key: key,
                        Body: fileData,
                        ContentType: "application/octet-stream",
                    };
                    await s3.putObject(params).promise();
                    CloudFiles.push({
                        uniqueFilename: file,
                        filename: file,
                        hash: "",
                        hash256: "",
                        length: fileData.length,
                        contentType: "application/octet-stream",
                        uploaded: new Date(),
                        storageType: "S3",
                        storageIds: {},
                        doNotCache: true
                    });
                }
            }

            res.json(CloudFiles);
        } catch (err) {
            console.error(err);
            res.status(500).end();
        }
    } else {
        const dir = path.join(__dirname, "../../", "CloudStorage");

        let CloudFiles: Object[] = [];

        fs.readdirSync(dir).forEach(name => {
            log.debug(`Found file: ${name}`);
            if (name.toLowerCase().endsWith(".ini")) {
                log.debug(`Found .ini file: ${name}`);
                const ParsedFile = fs.readFileSync(path.join(dir, name)).toString();
                const ParsedStats = fs.statSync(path.join(dir, name));

                CloudFiles.push({
                    "uniqueFilename": name,
                    "filename": name,
                    "hash": crypto.createHash('sha1').update(ParsedFile).digest('hex'),
                    "hash256": crypto.createHash('sha256').update(ParsedFile).digest('hex'),
                    "length": ParsedFile.length,
                    "contentType": "application/octet-stream",
                    "uploaded": ParsedStats.mtime,
                    "storageType": "S3",
                    "storageIds": {},
                    "doNotCache": true
                });
            }
        });
        res.json(CloudFiles);
    }
});

app.get("/fortnite/api/cloudstorage/system/:file", async (req, res) => {
    if (req.params.file.includes("..")) return res.status(404).end();
        if (req.params.file.includes("~")) return res.status(404).end();
    if (Safety.env.USE_S3) {
        const fileName = req.params.file;
        const key = `CloudStorage/${Safety.env.NAME || ""}/${fileName}`;

        const s3Object = await getCloudFile(key);

        if (s3Object) {
            return res.status(200).send(s3Object).end();
        } else {
            res.status(200);
            res.end();
        }
    } else {
        const file = path.join(__dirname, "../../", "CloudStorage", req.params.file);

        log.debug(`File: ${file}`);

        if (fs.existsSync(file)) return res.status(200).send(fs.readFileSync(file));

        log.debug(`File: ${file} does not exist`);

        res.status(200).end();
    }

});

//Settings stuff

app.get("/fortnite/api/cloudstorage/user/*/:file", verifyToken, async (req, res) => {
    const userid = req.params[0];

    if (Safety.env.USE_S3 == true) {

        if (req.params.file.toLowerCase() !== "clientsettings.sav") {
            return res.status(404).json({
                "error": "file not found"
            });
        }

        const fileName = req.params.file;
        const key = `CloudStorage/${Safety.env.NAME}/${userid}/${fileName}`;

        const s3Object = await getCloudFile(key);

        //if s3 object is 0 bytes, return 404
        if (s3Object && s3Object.toString().length === 0) {
            log.debug("File is 0 bytes, returning 204");
            return res.status(204).end();
        }

        if (!s3Object) {
            res.status(200);
            res.end();
            return;
        }

        const buffer = Buffer.from(s3Object.toString(), "latin1");

        return res.status(200).send(buffer).end();
    } else {
        if (req.params.file.toLowerCase() != "clientsettings.sav") return res.status(200).end();

        const memory = functions.GetVersionInfo(req);
        if (!seasons.includes(memory.season)) return res.status(200).end();

        let file = path.join(pathToClientSettings, `ClientSettings-${userid}-${memory.season}.Sav`);

        if (fs.existsSync(file)) return res.status(200).send(fs.readFileSync(file));

        res.status(200).end();
    }

})

app.get("/fortnite/api/cloudstorage/user/:accountId", verifyToken, async (req: any, res) => {

    const memory = functions.GetVersionInfo(req);
    if (!seasons.includes(memory.season)) return res.json([])

    const userId = req.user.accountId;
    const filePath = path.join(pathToClientSettings, `ClientSettings-${userId}-${memory.season}.Sav`);

    const cachedFile = cache.get(filePath);
    if (cachedFile) {
        console.log("Returning cached file");
        return res.json([cachedFile]);
    }

    if (Safety.env.USE_S3) {
        const key = `CloudStorage/${Safety.env.NAME}/${userId}/ClientSettings.Sav`;
        const s3Object = await getCloudFile(key);

        if (s3Object) {
            const buffer = Buffer.from(s3Object.toString(), "latin1");
            const response = {
                uniqueFilename: "ClientSettings.Sav",
                filename: "ClientSettings.Sav",
                hash: crypto.createHash("sha1").update(buffer).digest("hex"),
                hash256: crypto.createHash("sha256").update(buffer).digest("hex"),
                length: buffer.length,
                contentType: "application/octet-stream",
                uploaded: new Date(),
                storageType: "S3",
                storageIds: {},
                accountId: userId,
                doNotCache: true,
            };
            cache.set(filePath, response);
            return res.json([response]);
        } else {
            return res.json([]);
        }
    } else {;

        if (fs.existsSync(filePath)) {
            const ParsedFile = fs.readFileSync(filePath, 'latin1');
            const ParsedStats = fs.statSync(filePath);

            return res.json([{
                "uniqueFilename": "ClientSettings.Sav",
                "filename": "ClientSettings.Sav",
                "hash": crypto.createHash('sha1').update(ParsedFile).digest('hex'),
                "hash256": crypto.createHash('sha256').update(ParsedFile).digest('hex'),
                "length": Buffer.byteLength(ParsedFile),
                "contentType": "application/octet-stream",
                "uploaded": ParsedStats.mtime,
                "storageType": "S3",
                "storageIds": {},
                "accountId": req.user.accountId,
                "doNotCache": false
            }]);
        }

        res.json([]);
    }
});

app.put("/fortnite/api/cloudstorage/user/*/:file", verifyToken, async (req: any, res) => {
    const userId = req.params[0];
    const filename = req.params.file.toLowerCase();

    if (filename !== "clientsettings.sav") {
        return res.status(404).json({ error: "file not found" });
    }

    if (Safety.env.USE_S3) {
        const key = `CloudStorage/${Safety.env.NAME || "NameNotSet"}/${userId}/ClientSettings.Sav`;
        const params: S3.PutObjectRequest = {
            Bucket: Safety.env.S3_BUCKET_NAME,
            Key: key,
            Body: req.rawBody,
            ContentType: "application/octet-stream",
        };
        s3.putObject(params, (err: AWSError, data: S3.PutObjectOutput) => {
            if (err) console.error(err);
        });
    } else {
        if (Buffer.byteLength(req.rawBody) >= 400000) return res.status(403).json({ "error": "File size must be less than 400kb." });

        if (req.params.file.toLowerCase() != "clientsettings.sav") return res.status(204).end();

        const memory = functions.GetVersionInfo(req);
        if (!seasons.includes(memory.season)) return res.status(204).end();

        const file = path.join(pathToClientSettings, `ClientSettings-${userId}-${memory.season}.Sav`);
        fs.writeFileSync(file, req.rawBody, 'latin1');
    }

    res.status(204).end();
});

export default app;


