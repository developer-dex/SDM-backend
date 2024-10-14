import getEnvVar from "../helpers/util";

interface AppConfig {
    port: string;
}

const AppConfig: AppConfig = {
    port: getEnvVar("PORT"),
};

export default AppConfig;
