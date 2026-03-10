import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
    dbUrl: string;
    currentUserName: string;
}

type ConfigJson = {
    db_url: string;
    current_user_name: string;
}

const gatorConfigPath = path.join(process.cwd(), ".gatorconfig.json");

function jsonToConfig(json: ConfigJson): Config {
    return {
        dbUrl: json.db_url,
        currentUserName: json.current_user_name
    };
}

function configToJson(config: Config): ConfigJson {
    return {
        db_url: config.dbUrl,
        current_user_name: config.currentUserName
    };
}

export function setUser(username: string) {
    const config = readConfig();
    config.currentUserName = username;
    writeConfig(config);
}

export function readConfig(): Config {
    let rawConfig = fs.readFileSync(gatorConfigPath, "utf8");

    const jsonConfig: ConfigJson = JSON.parse(rawConfig);

    validateConfig(jsonConfig);

    return jsonToConfig(jsonConfig);
}

function writeConfig(config: Config) {
    const jsonConfig = configToJson(config);
    let stringedConfig = JSON.stringify(jsonConfig, null, 2);
    fs.writeFileSync(gatorConfigPath, stringedConfig);
}

function validateConfig(jsonConfig: ConfigJson): void {
    if (!jsonConfig.db_url) {
        throw new Error("db_url is required");
    }
    if (!jsonConfig.current_user_name) {
        throw new Error("current_user_name is required");
    }
}

