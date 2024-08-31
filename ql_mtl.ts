/**
 * name: 摩天轮票务监控
 */
import { sendNotify } from "./utils/sendNotify";
import axios from "axios";
import day from "dayjs";
const SCRIPT_NAME = "摩天轮票务监控";

async function main() {
    try {
        const resp = await axios.get(
            "https://hk.moretickets.com/showapi/pub/v1_2/show/66bb3281b52e420001549160/sessionone",
            {
                params: {
                    locationCityOID: 1101,
                    sessionOID: "66bb3281b52e420001549161",
                    orderDecision: "RANDOM",
                    src: "m_web",
                    time: new Date().valueOf(),
                },
                headers: {
                    "sec-ch-ua":
                        '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
                    "platform-info": "src=m_web",
                    tsessionid: "",
                    src: "m_web",
                    "sec-ch-ua-mobile": "?0",
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                    Accept: "application/json, text/plain, */*",
                    Referer:
                        "https://hk.moretickets.com/pickSeat/66bb3281b52e420001549160/66bb3281b52e420001549161/visible?isApp=undefined&orderDecision=RANDOM",
                    "X-Requested-With": "XMLHttpRequest",
                    "sec-ch-ua-platform": '"macOS"',
                },
            }
        );
        console.log(resp.data);
        if (resp.data.statusCode === 200) {
            const seatplans = resp?.data?.result?.data?.[0]?.seatplans;
            if (!seatplans) {
                throw new Error("seatplans not found");
            }
            const availableSeats = seatplans.filter(
                (seatplan: any) => seatplan.available
            );
            const sendMsgs = availableSeats.map((plan: any) => {
                const originPrice = plan.originalPrice;
                const minPrice = plan.minPrice;
                const discount = plan.discount;
                const ticketsCount = (plan?.tickets as any[])?.length || 0;
                return (
                    `原价: ${originPrice}\n` +
                    `最低价: ${minPrice}\n` +
                    `折扣: ${discount}\n` +
                    `余票: ${ticketsCount}`
                );
            });
            sendNotify(SCRIPT_NAME, sendMsgs.join("\n\n"));
            console.log(sendMsgs.join("\n\n"));
            return;
        } else {
            throw new Error(`${resp.data}`);
        }
    } catch (e) {
        if (e instanceof Error) {
            sendNotify(SCRIPT_NAME, `请求失败, ${e.message}`);
        } else {
            sendNotify(SCRIPT_NAME, `请求失败: ${e}`);
        }
    }
}

main();
setInterval(() => {
    const now = day().hour();
    if (now >= 9) {
        main();
    }
}, 60 * 60 * 1000 /** 每小时执行 */);
