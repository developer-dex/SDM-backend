import "dotenv/config";
export default function getEnvVar(envVarName: string | number): string {
    const value = process.env[envVarName];

    if (!value) {
        throw new Error(`environment variable ${envVarName} is not set`);
    }

    return value;
}

export const generateOtp = (digit: number) => {
    let otp = "";
    for (let i = 0; i < digit; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return Number(otp);
};
