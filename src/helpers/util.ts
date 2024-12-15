import "dotenv/config";
import multer from "multer";
import path from "path";
import fs from "fs";
import { EWebsiteFromImage } from "../common/common.enum";
import { ICreateAuditLogRequest } from "../modules/superAdmin/superAdmin.interface";
import { executeQuery } from "../config/databaseConfig";
import { Actions } from "./constants";
import { createObjectCsvWriter } from "csv-writer";
import satelize from "satelize";

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

export const createMulterMiddleware = (uploadPath: string) => {
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname));
        },
    });

    return multer({ storage: storage });
};

// Make one function to remove the image from the given path

export const removeFile = (filePath: string) => {
    console.log("remove filePath: ", filePath);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

export const getFileName = (imageCategoryType: string) => {
    switch (imageCategoryType) {
        case "home":
            return EWebsiteFromImage.HOME;
        case "contact_us":
            return EWebsiteFromImage.CONTACT_US;
        case "schedule_demo":
            return EWebsiteFromImage.SCHEDULE_DEMO;
        case "about_us":
            return EWebsiteFromImage.ABOUT_US;
        case "privacy_policy":
            return EWebsiteFromImage.PRIVACY_POLICY;
        case "login":
            return EWebsiteFromImage.LOGIN;
        case "pricing":
            return EWebsiteFromImage.PRICING;
        case "features":
            return EWebsiteFromImage.FEATURES;
        default:
            return "website";
    }
};

export const formateFrontImagePath = (imagePath: string) => {
    let lastSlashIndex = imagePath.lastIndexOf("/");
    return imagePath.substring(lastSlashIndex);
};

export const addMuniteIntoCurrentTime = (minutes: number) => {
    const currentTime = new Date();
    const newTime = new Date(currentTime.getTime() + minutes * 60 * 1000);
    return newTime;
};

export const generateRandomString = (length: number) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        result += characters.charAt(randomIndex);
    }

    return result;
};

export const parseTimeInterval = (interval: string) => {
    const regex = /^(\d+)([smhdwMy])$/;
    const matches = interval.match(regex);

    if (matches) {
        const value = parseInt(matches[1], 10);
        const unit = matches[2];

        switch (unit) {
            case "s":
                return { ms: value * 1000, long: value + " " + "Seconds" };
            case "m":
                return { ms: value * 60000, long: value + " " + "Minutes" };
            case "h":
                return { ms: value * 3600000, long: value + " " + "Hours" };
            case "d":
                return { ms: value * 86400000, long: value + " " + "Days" };
            case "w":
                return { ms: value * 604800000, long: value + " " + "Weeks" };
            case "M":
                return { ms: value * 2592000000, long: value + " " + "Months" };
            case "y":
                return { ms: value * 31536000000, long: value + " " + "Years" };
        }
    }

    return { ms: 0, long: "" }; // Invalid time interval format
};

export const calculatePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    return { offset, limit };
};

export const generateLicenseKey = (
    plan: string,
    pan: string,
    issueDate: string,
    expirationDate: string
) => {
    // Extracting components from the inputs
    const planCode = plan.toUpperCase(); // Plan code in uppercase
    const firstTwoLetters = pan.substring(0, 2).toUpperCase(); // First 2 letters of PAN
    const thirdToSeventhLetters = pan.substring(2, 7).toUpperCase(); // 3rd to 7th letters of PAN
    const eighthToTenthLetters = pan.substring(7, 10).toUpperCase(); // 8th to 10th letters of PAN

    // Formatting issue date
    const issueDateObj = new Date(issueDate);
    const dayOfPurchase = String(issueDateObj.getDate()).padStart(2, "0"); // Day of purchase
    const monthYearOfPurchase =
        String(issueDateObj.getMonth() + 1).padStart(2, "0") +
        String(issueDateObj.getFullYear()).slice(-2); // MMYY

    // Formatting expiration date
    const expirationDateObj = new Date(expirationDate);
    const dayOfExpiry = String(expirationDateObj.getDate()).padStart(2, "0"); // Day of expiry
    const expiryDateMMYY =
        String(expirationDateObj.getMonth() + 1).padStart(2, "0") +
        String(expirationDateObj.getFullYear()).slice(-2); // MMYY

    // Constructing the license key
    const licenseKey = `${planCode}${firstTwoLetters}-${thirdToSeventhLetters}-${eighthToTenthLetters}${dayOfPurchase}-${monthYearOfPurchase}${dayOfExpiry}-${expiryDateMMYY}`;

    return licenseKey;
};

export const createCsvFile = async (data: any[], header: any[]) => {
    // Define the CSV writer

    // insed of fileName I want current timestamp   
    const fileName = `${Date.now()}.csv`;
    const path = `src/public/${fileName}`;
    const csvWriter = createObjectCsvWriter({
        path: path, 
        header: header,
    });

    // Write data to CSV
    await csvWriter.writeRecords(data);
    return path;

    // setTimeout(() => {
    //     fs.unlinkSync('src/public/support_ticket_titles.csv');
    // }, 5000);
}


export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export const currentLocation = (ipAddress: string) => {
satelize.satelize({ip:ipAddress}, function(err, payload) {
    if(payload){
        const location = payload?.continent?.en
        return location;
    }
    return "India";
  });
};


export const getIpAddressFromRequest = (req: any) => {
    let ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    ipAddress = req.ip.includes('::ffff:') ? req.ip.split('::ffff:')[1] : req.ip;
    return ipAddress;
}

export const getThePageNameFromCategory = (category: string) => {
    switch (category) {
        case "home":
            return "Home";
        case "contact_us":
            return "Contact Us";
        case "schedule_demo":
            return "Schedule Demo";
        case "about_us":
            return "About Us";
        case "privacy_policy":
            return "Privacy Policy";
        case "login":
            return "Login";
        case "pricing":
            return "Pricing";
        case "features":
            return "Features";
    }
}