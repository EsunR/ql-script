/**
 * 从环境变量中获取 token 列表
 */
export function getEnvTokens(tokenName: string) {
    let tokens: string[] = [];
    let i = 1;
    while (true) {
        let token = process.env[`${tokenName}_${i}`];
        if (!token) {
            break;
        }
        tokens.push(token);
        i++;
    }
    return tokens;
}
