import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
  const filePath = getConfigFilePath();
  const rawData = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };
  fs.writeFileSync(filePath, JSON.stringify(rawData, null, 2), "utf-8");
}

function validateConfig(rawConfig: any): Config {
  if (typeof rawConfig !== "object" || rawConfig === null) {
    throw new Error("Invalid config object");
  }
  if (typeof rawConfig.db_url !== "string") {
    throw new Error("Missing or invalid db_url");
  }
  return {
    dbUrl: rawConfig.db_url,
    currentUserName:
      typeof rawConfig.current_user_name === "string"
        ? rawConfig.current_user_name
        : undefined,
  };
}

export function setUser(username: string): void {
  const cfg = readConfig();
  cfg.currentUserName = username;
  writeConfig(cfg);
}

export function readConfig(): Config {
  const filePath = getConfigFilePath();
  const fileData = fs.readFileSync(filePath, "utf-8");
  const rawConfig = JSON.parse(fileData);
  return validateConfig(rawConfig);
}
