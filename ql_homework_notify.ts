/**
 * name: Homework 推送
 * cron: 0 8,20 * * *
 */
import { getEnv, log, safeJsonParse } from "./utils";

// ==== types ====
export interface Member {
    id: string;
    name: string;
    birthday?: string;
    wechatToken?: string;
    color: string;
}
export interface Task {
    id: string;
    name: string;
    weekDays: number[];
    assignedMembers: string[];
    rotationMode: "weekly" | "each-time";
    currentMemberIndex: number;
    /** 上次轮换周期 */
    lastRotationDate?: string;
}
// ==== types ====

const config = safeJsonParse<{ api: string; publicAnonKey: string }>(
    getEnv("HOMEWORK_CONFIG")
);

const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.publicAnonKey}`,
};

async function getAllMembers(): Promise<Member[]> {
    try {
        const response = await fetch(`${config.api}/members`, { headers });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data || [];
    } catch (error) {
        console.error("Error fetching members:", error);
        throw error;
    }
}

async function getAllTasks(): Promise<Task[]> {
    try {
        const response = await fetch(`${config.api}/tasks`, { headers });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data || [];
    } catch (error) {
        console.error("Error fetching tasks:", error);
        throw error;
    }
}

async function pushMessage(sendKey: string, title: string, content: string) {
    const pushApi = `https://sctapi.ftqq.com/${sendKey}.send`;
    try {
        const response = await fetch(pushApi, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `title=${encodeURIComponent(title)}&desp=${encodeURIComponent(
                content
            )}`,
        });
        const result = await response.json();
        if (result.code !== 0) {
            console.error("Push notification failed:", result);
        } else {
            log("Push notification sent successfully");
        }
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
}

// 计算特定日期应该由哪个成员执行任务
function getCurrentMemberIndexForDate(task: Task, date: Date): number {
    if (task.assignedMembers.length === 0) return 0;
    if (task.assignedMembers.length === 1) return 0;

    const baseIndex = task.currentMemberIndex;

    // 使用今天作为默认的起始日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (task.rotationMode === "weekly") {
        // 每周切换模式 - 按日历周（周一到周日）
        const startDate = task.lastRotationDate
            ? new Date(task.lastRotationDate)
            : today;
        startDate.setHours(0, 0, 0, 0);

        // 计算两个日期各自所在的周数（以周一为一周的开始）
        const getWeekNumber = (d: Date) => {
            const tempDate = new Date(d);
            // 将日期调整到所在周的周一
            const day = tempDate.getDay();
            const diff = day === 0 ? -6 : 1 - day; // 如果是周日，往前推6天；否则推到周一
            tempDate.setDate(tempDate.getDate() + diff);
            tempDate.setHours(0, 0, 0, 0);
            // 计算从1970年1月1日开始的周数
            return Math.floor(tempDate.getTime() / (7 * 24 * 60 * 60 * 1000));
        };

        const startWeek = getWeekNumber(startDate);
        const currentWeek = getWeekNumber(date);
        const weeksDiff = currentWeek - startWeek;

        return (baseIndex + weeksDiff) % task.assignedMembers.length;
    } else {
        // 每次切换模式
        const startDate = task.lastRotationDate
            ? new Date(task.lastRotationDate)
            : today;
        startDate.setHours(0, 0, 0, 0);
        const currentDateCopy = new Date(date);
        currentDateCopy.setHours(0, 0, 0, 0);

        let executionCount = 0;
        for (
            let d = new Date(startDate);
            d <= currentDateCopy;
            d.setDate(d.getDate() + 1)
        ) {
            if (task.weekDays.includes(d.getDay())) {
                executionCount++;
            }
        }

        return (baseIndex + executionCount - 1) % task.assignedMembers.length;
    }
}

// 获取某个日期的所有任务和执行人
function getTasksForDate(tasks: Task[], members: Member[], date: Date) {
    const dayOfWeek = date.getDay();

    return tasks
        .filter((task) => task.weekDays.includes(dayOfWeek))
        .map((task) => {
            const currentMemberIndex = getCurrentMemberIndexForDate(task, date);
            const member = members.find(
                (m) => m.id === task.assignedMembers[currentMemberIndex]
            );
            return {
                task,
                member,
            };
        });
}

async function main() {
    const allMembers = await getAllMembers();
    const allTasks = await getAllTasks();
    // 获取今天的任务和执行人
    const today = new Date();
    const tasksForToday = getTasksForDate(allTasks, allMembers, today);
    const memberTaskMap: { [memberId: string]: Task[] } = {};
    log(tasksForToday);
    tasksForToday.forEach(({ task, member }) => {
        if (member) {
            if (!memberTaskMap[member.id]) {
                memberTaskMap[member.id] = [];
            }
            memberTaskMap[member.id].push(task);
        }
    });

    // 发送通知
    for (const memberId in memberTaskMap) {
        const member = allMembers.find((m) => m.id === memberId);
        if (member && member.wechatToken) {
            const tasks = memberTaskMap[memberId];
            let content = `今日家务：${tasks.map((t) => t.name).join("、")}`;
            await pushMessage(member.wechatToken, content, "");
        }
    }
}

main();
