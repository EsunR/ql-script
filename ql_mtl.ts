/**
 * name: 摩天轮票务监控
 * cron: 0 0 10 1/1 *
 */
import axios from "axios";
import { sendNotify } from "./utils/sendNotify";
import { log } from "./utils";
const SCRIPT_NAME = "摩天轮票务监控";

const CACHE_MAP = new Map();
let NO_TICKET_MSG_HAS_SEND = false;

async function sendTicketMsg() {
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
        log("信息查询已完成");
        if (resp.data.statusCode === 200) {
            const seatplans = resp?.data?.result?.data?.[0]?.seatplans as any[];
            if (!seatplans) {
                throw new Error("seatplans not found");
            }
            const availableSeats = seatplans.filter(
                (seatplan: any) => seatplan.available
            );
            if (!availableSeats.length) {
                if (!NO_TICKET_MSG_HAS_SEND) {
                    sendNotify(SCRIPT_NAME, "没有票啦!");
                }
                NO_TICKET_MSG_HAS_SEND = true;
                log("没有票务信息，可能没票了");
            } else {
                if (NO_TICKET_MSG_HAS_SEND) {
                    sendNotify(SCRIPT_NAME, "有票啦!");
                    log("已查询到票务");
                    console.log(JSON.stringify(availableSeats, null, 2));
                }
                NO_TICKET_MSG_HAS_SEND = false;
            }
            availableSeats.forEach((plan: any) => {
                const originPrice = plan.originalPrice;
                const minPrice = plan.minPrice;
                const discount = plan.discount;
                const ticketsCount = (plan?.tickets as any[])?.length || 0;
                const ticketInfo =
                    `原价: ${originPrice}\n` +
                    `最低价: ${minPrice}\n` +
                    `折扣: ${discount}\n` +
                    `余票: ${ticketsCount}`;
                if (
                    !CACHE_MAP.has(originPrice) ||
                    CACHE_MAP.get(originPrice) !== ticketInfo
                ) {
                    CACHE_MAP.set(originPrice, ticketInfo);
                    sendNotify(SCRIPT_NAME + "票务信息变动", ticketInfo);
                }
            });
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

function main() {
    sendTicketMsg();
    setInterval(() => {
        sendTicketMsg();
    }, 5 * 60 * 1000);
}

main();
