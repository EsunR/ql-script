/**
 * name: QQ 星小程序签到
 * cron: 0 0 10 1/1 *
 */
import axios from "axios";
import { getEnvTokens, log } from "./utils";
import { sendNotify } from "./utils/sendNotify";

const SCRIPT_NAME = "QQ 签到";

/**
 * token example:
 * RequestPack=%7B%22DeviceCode%22%3A%22wx650bdff059f63f5b%%2C%22AuthKey%22%3A%22c1554160-d063-40a7-bd63-fc34acacecd6%22%2C%22Method%22%3A%22MemberService.CampaignJoin%22%2C%22Params%22%3A%22%7B%5C%22JoinInfo%5C%22%3A%5C%22%7B%5C%5C%5C%22Activity%5C%5C%5C%22%3A%5C%5C%5C%2213D88C0D-A850-4278-A718-35CD397EF922%5C%5C%5C%22%2C%5C%5C%5C%22JoinType%5C%5C%5C%22%3A31%2C%5C%5C%5C%22UserId%5C%5C%5C%22%3A%5C%5C%5C%220d089c71-e4c5-42c6-9e77-05b2d02bf805%5C%5C%5C%22%7D%5C%22%7D%22%7D
 */
const tokens = getEnvTokens("WX_QQX_TOKEN");

async function sign(token: string) {
    try {
        const resp = await axios.post(
            "https://mall.yili.com/MAMAIF/MCSWSIAPI.asmx/Call",
            token,
            {
                maxBodyLength: Infinity,
                headers: {
                    Host: "mall.yili.com",
                    "content-type": "application/x-www-form-urlencoded",
                    "User-Agent":
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x1800323b) NetType/WIFI Language/zh_CN",
                    Referer:
                        "https://servicewechat.com/wx650bdff059f63f5b/101/page-frame.html",
                },
            }
        );
        sendNotify(
            SCRIPT_NAME,
            "执行结果：\n" + `${resp.data}\n` + `token: ${token}`
        );
    } catch (e) {
        console.error(e);
        sendNotify(SCRIPT_NAME, `签到失败, token:${token}`);
    }
}

async function main() {
    await Promise.all(tokens.map((token) => sign(token)));
    log(SCRIPT_NAME, "执行完成");
}

main();
