/**
 * name: 薇诺娜小程序签到
 * cron: 0 0 10 1/1 *
 */
import axios from "axios";
import { getEnvTokens, log } from "./utils";
import { sendNotify } from "./utils/sendNotify";

const SCRIPT_NAME = "薇诺娜小程序签到";

/**
 * [appUserToken, cookie]
 */
const tokens = getEnvTokens("WX_WNN_TOKEN");

async function sign(token: string) {
    const [userToken, cookie] = JSON.parse(token);
    try {
        const formData = new URLSearchParams();
        formData.append("appUserToken", userToken);

        const resp = await axios.post(
            "https://api.qiumeiapp.com/zg-activity/zg-daily/zgSigninNew",
            formData,
            {
                maxBodyLength: Infinity,
                headers: {
                    Host: "api.qiumeiapp.com",
                    "content-type": "application/x-www-form-urlencoded",
                    "User-Agent":
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x1800323b) NetType/WIFI Language/zh_CN",
                    Referer:
                        "https://servicewechat.com/wx250394ab3f680bfa/585/page-frame.html",
                    Cookie: cookie,
                },
            }
        );
        sendNotify(
            SCRIPT_NAME,
            "执行结果：\n" +
                `${JSON.stringify(resp.data)}\n` +
                `token: ${token}`
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
