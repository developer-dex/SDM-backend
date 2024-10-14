import getEnvVar from "../utils/getENV";

export const config = {
    type: "service_account",
    project_id: getEnvVar("PROJECT_ID"),
    private_key_id: getEnvVar("PRIVATE_KEY_ID"),
    private_key: getEnvVar("PRIVATE_KEY"),
    client_email: getEnvVar("CLIENT_EMAIL"),
    client_id: getEnvVar("CLIENT_ID"),
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
        "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-ysblx%40facepik-19b94.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
};
