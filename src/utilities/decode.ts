const jwt = require("jsonwebtoken");
const { DateAddHours } = require("../structs/functions.js")
const User = require("../model/user-gres.js");

class decode {

    public async decodeAuth(req: Request) {

        const token = req.headers["authorization"].replace("bearer eg1~", "");

        const decodedToken = jwt.decode(token);

        if (!global.accessTokens.find(i => i.token == `eg1~${token}`)) throw new Error("Invalid token.");
        
        const user = await User.findOne({where: { accountId: decodedToken.sub }});

        return user;
    }

}

export default new decode();