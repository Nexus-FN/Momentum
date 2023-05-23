import path from "path";
import log from "./log";

export { };

const fs = require("fs");

async function createProfiles(accountId: string) {

    log.debug(`Creating profiles for account ${accountId}`);

    let profiles:Object = {};

    fs.readdirSync(path.join(__dirname, "../../Config/DefaultProfiles/")).forEach(fileName => {
        const profile = require(path.join(__dirname, `../../Config/DefaultProfiles/${fileName}`));

        profile.accountId = accountId;
        profile.created = new Date().toISOString();
        profile.updated = new Date().toISOString();

        profiles[profile.profileId] = profile;
        log.debug(`Created profile ${profile.profileId} for account ${accountId}`);
    });

    return JSON.parse(JSON.stringify(profiles));
}

async function validateProfile(profileId, profiles) {
    try {
        let profile = profiles.profiles[profileId];

        if (!profile || !profileId) throw new Error("Invalid profile/profileId");
    } catch {
        return false;
    }

    return true;
}

module.exports = {
    createProfiles,
    validateProfile
}