import { VercelRequest, VercelResponse } from "@vercel/node";
import got from "got";

type Response = {
    tsdbLatest: {
        [key: string]: {
            [key: string]: {
                time: number;
                value: number;
            };
        };
    };
};

const validResponse = (d: any): d is Response => {
    if (!d) return false;
    return true;
};

const index = async (request: VercelRequest, response: VercelResponse) => {

    const twitchFlag = !!Object.keys(request.query).find(
        (key) => key === "twitch"
    );
    const hostId = "399ZzPd48Tw";
    const names = ["custom.temperature", "custom.humidity"];
    const searchParams = new URLSearchParams(
        names.map((v) => ["name", v]).concat([["hostId", hostId]])
    );

    const json = await got(`https://api.mackerelio.com/api/v0/tsdb/latest`, {
        headers: {
            "X-Api-Key": process.env.MACKEREL_TOKEN,
        },
        searchParams,
    }).json();

    if (!validResponse(json)) {
        response.status(500).send("something went wrong.");
        return;
    }

    const data = json.tsdbLatest[hostId];

    if (twitchFlag) {
        const tempRaw = data["custom.temperature"].value;
        const temp = Math.round(tempRaw * 10) / 10 || "??";
        response.send(`${temp}`);
        return;
    }

    response.status(200).json(data);
};

export default index;
