/**
 * name: 爱儿心选小程序签到
 * cron: 0 0 10 1/1 *
 */
import axios from "axios";
import { getEnvTokens } from "./utils";

const tokens = getEnvTokens("WX_ARXX_TOKEN");

async function sign(token: string) {
    let requestData = JSON.stringify({});

    try {
        const resp = await axios.post(
            "https://msmarket.msx.digitalyili.com/gateway/api/member/daily/sign",
            requestData,
            {
                maxBodyLength: Infinity,
                headers: {
                    Host: "msmarket.msx.digitalyili.com",
                    Connection: "keep-alive",
                    "Content-Length": "2",
                    "source-type": "",
                    "content-type": "application/json",
                    channel: "message",
                    scene: "1007",
                    "access-token": token,
                    "register-source": "",
                    "forward-appid": "",
                    "tenant-id": "167824815657359360",
                    "X-Tingyun": "c=M|KMWA5XnPuAM",
                    "atv-page": "",
                    shareid: "om8Dn5S2QEuu0bOHMpCj7_9HJHHo",
                    "Accept-Encoding": "gzip,compress,br,deflate",
                    "User-Agent":
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x1800323a) NetType/4G Language/zh_CN",
                    Referer:
                        "https://servicewechat.com/wx1fb666a33da7ac88/69/page-frame.html",
                },
            }
        );
        console.log(resp.data);
        QLAPI.notify(
            "爱儿心选小程序签执行成功",
            "执行结果：\n" + `${resp.data}\n` + `token: ${token}`
        );
    } catch (e) {
        console.log(`签到失败, token:${token}`);
        console.error(e);
    }
}

async function main() {
    await Promise.all(tokens.map((token) => sign(token)));
    console.log("爱儿心选小程序签到完成");
}

main();
