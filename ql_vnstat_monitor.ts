/**
 * name: vnstat 监控
 * cron: 30,59 * * * *
 */
import axios from "axios";
import { getEnv, log, safeJsonParse } from "./utils";

/**
 * ============= types =============
 */
interface VnstatConfigItem {
    url: string;
    name: string;
    hostName: string;
    /**
     * 每小时的流量上限，单位 GB
     */
    hourUpStream: number;
}

interface TrafficValue<D> {
    date: D;
    id: number;
    rx: number;
    tx: number;
}

interface VnstatDate {
    day: number;
    month: number;
    year: number;
}

interface VnstatTime {
    hour: number;
    minute: number;
}

interface TrafficValueDay extends TrafficValue<VnstatDate> {}

interface TrafficValueMonth extends TrafficValue<Omit<VnstatDate, "year">> {}

interface TrafficValueYear extends TrafficValue<Pick<VnstatDate, "year">> {}

interface TrafficValueTime extends TrafficValue<VnstatDate> {
    time: VnstatTime;
}

interface VnstatInterface {
    alias: string;
    created: {
        date: VnstatDate;
    };
    name: string;
    traffic: {
        day: TrafficValueDay[];
        fiveminute: TrafficValueTime[];
        hour: TrafficValueTime[];
        month: TrafficValueMonth[];
        top: TrafficValueDay[];
        year: TrafficValueYear[];
        total: {
            rx: number;
            tx: number;
        };
    };
    updated: {
        date: VnstatDate;
        time: VnstatTime;
    };
}

interface VnstatJson {
    interfaces: VnstatInterface[];
}

/**
 * ============= utils =============
 */
async function getVnstatJsonData(url: string) {
    return (await axios.get(url)).data as VnstatJson;
}

function transBitToGb(bit: number): number {
    return bit / 1024 / 1024 / 1024;
}

/**
 * ============= main =============
 */
async function checkVnstat(vnstatConfig: VnstatConfigItem[]) {
    const results: {
        hostName: string;
        currentHourGb: number;
        currentDayGb: number;
        currentMonthGb: number;
    }[] = [];

    try {
        await Promise.all(
            vnstatConfig.map(async (config) => {
                const res = await getVnstatJsonData(config.url);
                const vnstatResult = res.interfaces.find(
                    (item) => item.name === config.name
                );
                if (!vnstatResult) {
                    return;
                }
                const currentHourData = vnstatResult.traffic.hour.pop();
                const currentDayData = vnstatResult.traffic.day.pop();
                const currentMonthData = vnstatResult.traffic.month.pop();
                if (!(currentHourData && currentDayData && currentMonthData)) {
                    return;
                }
                results.push({
                    hostName: config.hostName,
                    currentHourGb: parseFloat(
                        transBitToGb(
                            currentHourData.rx + currentHourData.tx
                        ).toFixed(2)
                    ),
                    currentDayGb: parseFloat(
                        transBitToGb(
                            currentDayData.rx + currentDayData.tx
                        ).toFixed(2)
                    ),
                    currentMonthGb: parseFloat(
                        transBitToGb(
                            currentMonthData.rx + currentMonthData.tx
                        ).toFixed(2)
                    ),
                });
            })
        );
    } catch {
        log("Vnstat 流量检查失败");
        return;
    }

    // 检查是否超出阈值
    const needAlertHost = results.filter((item) => {
        const config = vnstatConfig.find((c) => c.hostName === item.hostName);
        if (config) {
            return item.currentHourGb > config.hourUpStream;
        } else {
            return false;
        }
    });
    const needAlertHostNames = needAlertHost.map((item) => item.hostName);

    log(`监控信息：${JSON.stringify(results)}`);
    log(
        `需要告警的主机：${
            needAlertHostNames.length ? needAlertHostNames.join(", ") : "无"
        }`
    );

    // 如果有就发出通知
    if (needAlertHost.length) {
        const vnstatResultText = results
            .map(
                (item) =>
                    `服务器：${item.hostName}\n` +
                    `- 当前小时已用流量：${item.currentHourGb}GB${
                        needAlertHostNames.includes(item.hostName) && "⚠️"
                    }\n` +
                    `- 当天已用流量：${item.currentDayGb}GB\n` +
                    `- 当月已用流量：${item.currentMonthGb}GB\n`
            )
            .join("\n");

        const message = [
            "流量阈值预警",
            vnstatResultText,
            "请检查是否误将Clash设置为全局代理，或Steam下载正在使用代理节点",
        ].join("\n");

        log(message);

        QLAPI.notify("Vnstat 监控", message);
    }
}

function main() {
    const vnstatConfigFromEnv = getEnv("VNSTAT_CONFIG");
    const parsedVnstatConfig =
        safeJsonParse<VnstatConfigItem[]>(vnstatConfigFromEnv);
    if (
        !parsedVnstatConfig ||
        !(parsedVnstatConfig instanceof Array) ||
        parsedVnstatConfig.length === 0
    ) {
        log("尚未设置 vnstat 监控配置");
        return;
    }
    checkVnstat(parsedVnstatConfig);
}

main();
