/**
 * 从环境变量中获取 token 列表
 */
export function getEnvTokens(tokenName: string) {
    let tokens: string[] = [];
    let i = 1;
    while (true) {
        // @ts-ignore
        let token = process.env[`${tokenName}_${i}`];
        if (!token) {
            break;
        }
        tokens.push(token);
        i++;
    }
    return tokens;
}

export function log(...msg: any[]) {
    console.log(new Date().toLocaleString(), ...msg);
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T>(jsonString: string): T | null {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON parse error:", e);
        return null;
    }
}

/**
 * 获取系统的环境变量
 */
export function getEnv(env: string) {
    // @ts-ignore
    const value = process.env[env];
    if (!value) {
        return null;
    }
    return value as string;
}
