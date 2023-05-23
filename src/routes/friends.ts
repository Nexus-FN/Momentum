export { };

const express = require("express");
const app = express.Router();

const functions = require("../structs/functions.js");

const Friends = require("../model/friends-gres.js");
const friendManager = require("../structs/friend.js");

const { verifyToken, verifyClient } = require("../tokenManager/tokenVerify.js");

app.get("/friends/api/v1/*/settings", (req, res) => {
    res.json({});
});

app.get("/friends/api/v1/*/blocklist", (req, res) => {
    res.json([]);
});

app.get("/friends/api/public/list/fortnite/*/recentPlayers", (req, res) => {
    res.json([]);
});

app.get("/friends/api/public/friends/:accountId", verifyToken, async (req, res) => {
    let response:Object[] = [];

    const friends = await Friends.findOne({ where:{ accountId: req.user.accountId }}).lean();

    friends.list.accepted.forEach(acceptedFriend => {
        response.push({
            "accountId": acceptedFriend.accountId,
            "status": "ACCEPTED",
            "direction": "OUTBOUND",
            "created": acceptedFriend.created,
            "favorite": false
        });
    });

    friends.list.incoming.forEach(incomingFriend => {
        response.push({
            "accountId": incomingFriend.accountId,
            "status": "PENDING",
            "direction": "INBOUND",
            "created": incomingFriend.created,
            "favorite": false
        });
    });

    friends.list.outgoing.forEach(outgoingFriend => {
        response.push({
            "accountId": outgoingFriend.accountId,
            "status": "PENDING",
            "direction": "OUTBOUND",
            "created": outgoingFriend.created,
            "favorite": false
        });
    });

    res.json(response);
});

app.post("/friends/api/*/friends*/:receiverId", verifyToken, async (req, res) => {
    let sender = await Friends.findOne({ where: { accountId: req.user.accountId }});
    let receiver = await Friends.findOne({where: { accountId: req.params.receiverId }});
    if (!sender || !receiver) return res.status(403).end();

    if (sender.list.incoming.find(i => i.accountId == receiver.accountId)) {
        if (!await friendManager.acceptFriendReq(sender.accountId, receiver.accountId)) return res.status(403).end();

        functions.getPresenceFromUser(sender.accountId, receiver.accountId, false);
        functions.getPresenceFromUser(receiver.accountId, sender.accountId, false);
    } else if (!sender.list.outgoing.find(i => i.accountId == receiver.accountId)) {
        if (!await friendManager.sendFriendReq(sender.accountId, receiver.accountId)) return res.status(403).end();
    }

    res.status(204).end();
});

app.delete("/friends/api/*/friends*/:receiverId", verifyToken, async (req, res) => {
    let sender = await Friends.findOne({ where: { accountId: req.user.accountId }});
    let receiver = await Friends.findOne({ where: { accountId: req.params.receiverId }});
    if (!sender || !receiver) return res.status(403).end();

    if (!await friendManager.deleteFriend(sender.accountId, receiver.accountId)) return res.status(403).end();

    functions.getPresenceFromUser(sender.accountId, receiver.accountId, true);
    functions.getPresenceFromUser(receiver.accountId, sender.accountId, true);

    res.status(204).end();
});

app.post("/friends/api/*/blocklist*/:receiverId", verifyToken, async (req, res) => {
    let sender = await Friends.findOne({ where: { accountId: req.user.accountId }});
    let receiver = await Friends.findOne({ where: { accountId: req.params.receiverId }});
    if (!sender || !receiver) return res.status(403).end();

    if (!await friendManager.blockFriend(sender.accountId, receiver.accountId)) return res.status(403).end();

    functions.getPresenceFromUser(sender.accountId, receiver.accountId, true);
    functions.getPresenceFromUser(receiver.accountId, sender.accountId, true);

    res.status(204).end();
});

app.delete("/friends/api/*/blocklist*/:receiverId", verifyToken, async (req, res) => {
    let sender = await Friends.findOne({ where: { accountId: req.user.accountId }});
    let receiver = await Friends.findOne({ where: { accountId: req.params.receiverId }});
    if (!sender || !receiver) return res.status(403).end();

    if (!await friendManager.deleteFriend(sender.accountId, receiver.accountId)) return res.status(403).end();

    res.status(204).end();
});

app.get("/friends/api/v1/:accountId/summary", verifyToken, async (req, res) => {
    let response:any = {
        "friends": [],
        "incoming": [],
        "outgoing": [],
        "suggested": [],
        "blocklist": [],
        "settings": {
            "acceptInvites": "public"
        }
    }

    const friends = await Friends.findOne({ where: { accountId: req.user.accountId }}).lean();

    friends.list.accepted.forEach(acceptedFriend => {
        response.friends.push({
            "accountId": acceptedFriend.accountId,
            "groups": [],
            "mutual": 0,
            "alias": "",
            "note": "",
            "favorite": false,
            "created": acceptedFriend.created
        });
    });

    friends.list.incoming.forEach(incomingFriend => {
        response.incoming.push({
            "accountId": incomingFriend.accountId,
            "mutual": 0,
            "favorite": false,
            "created": incomingFriend.created
        });
    });

    friends.list.outgoing.forEach(outgoingFriend => {
        response.outgoing.push({
            "accountId": outgoingFriend.accountId,
            "favorite": false
        });
    });

    friends.list.blocked.forEach(blockedFriend => {
        response.blocklist.push({
            "accountId": blockedFriend.accountId
        });
    });

    res.json(response);
});

app.get("/friends/api/public/blocklist/*", verifyToken, async (req, res) => {
    let friends = await Friends.findOne({ where: { accountId: req.user.accountId }}).lean();

    res.json({
        "blockedUsers": friends.list.blocked.map(i => i.accountId)
    });
});

module.exports = app;