export {}

const express = require("express");
const app = express.Router();

const { verifyToken, verifyClient } = require("../tokenManager/tokenVerify.js");
const User = require("../model/user-gres.js");
const {Client, Intents} = require("discord.js");
const Discord = require("discord.js");

app.post("/fortnite/api/game/v2/toxicity/account/:reporter/report/:reportedPlayer", verifyToken, async (req, res) => {

    const reporter = req.params.reporter;
    const reportedPlayer = req.params.reportedPlayer;
    
    let reporterData = await User.findOne({ where:{ accountId: reporter}}).lean();
    let reportedPlayerData = await User.findOne({ where:{ accountId: reportedPlayer }}).lean();
    
    const reason = req.body.reason || 'No reason provided';
    const details = req.body.details || 'No details provided';
    const markedasknown = req.body.bUserMarkedAsKnown ? 'Yes' : 'No';

    try {
        const updateUser = await User.findOne({where: { accountId: reportedPlayer }});
        if (!updateUser) {
            return res.status(404).json({ error: "User not found" });
        }
        updateUser.update({ reports: updateUser.reports + 1 });
        
    } catch (err) {
        console.log(err);
    }

    res.status(200).send({ "success": true });

});

module.exports = app;
