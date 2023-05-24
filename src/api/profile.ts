export { };

const express = require("express");
const app = express.Router();
const { verifyApikey } = require("../utilities/api.js");
const Profile = require("../model/profiles-gres.js");

app.get("/api/profile/accountId/:value", verifyApikey, (req, res) => {

    const { value } = req.params;

    const query = {};
    query["accountId"] = value;

    Profile.findOne({where: query}, { password: 0, _id: 0 }, (err, profile) => {
        if (err) return res.status(500).json({ error: "Internal server error" });
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        res.status(200).json(profile);
    });

});


module.exports = app;
