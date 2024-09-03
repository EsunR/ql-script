/**
 * name: 护照业务办理信息查询
 * cron: 0 9 * * *
 */
import axios from "axios";
import { sendNotify } from "./utils/sendNotify";
import { log } from "./utils";
const SCRIPT_NAME = "护照业务办理信息查询";

async function sendTicketMsg() {
    try {
        const resp = await axios.get(
            "https://zwfw.gaj.beijing.gov.cn/crjfjj/api/getSjdSl",
            {
                params: {
                    sld: "110108084300",
                    rq: "2024-09-04",
                    t: new Date().valueOf(),
                },
            }
        );
        log("信息查询已完成", JSON.stringify(resp.data));
        if (resp.data instanceof Array) {
            const list = resp.data as {
                sj: string;
                sjd: "上午" | "下午";
                sys: string;
            }[];
            if (list.find((item) => item.sjd === "上午" && +item.sys > 0)) {
                sendNotify(SCRIPT_NAME, "上午有号!!!!!!");
            } else {
                log("没有查询到可预约的信息");
            }
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
    }, 1000 * 60 * 5);
}

main();
