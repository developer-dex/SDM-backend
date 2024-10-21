import "dotenv/config";
import multer from "multer";
import path from "path";
import fs from "fs";
import { EWebsiteFromImage } from "../common/common.enum";
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
}


export const generateRandomString = (length: number) => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
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
        case 's':
          return { ms: value * 1000, long: value + ' ' + 'Seconds' };
        case 'm':
          return { ms: value * 60000, long: value + ' ' + 'Minutes' };
        case 'h':
          return { ms: value * 3600000, long: value + ' ' + 'Hours' };
        case 'd':
          return { ms: value * 86400000, long: value + ' ' + 'Days' };
        case 'w':
          return { ms: value * 604800000, long: value + ' ' + 'Weeks' };
        case 'M':
          return { ms: value * 2592000000, long: value + ' ' + 'Months' };
        case 'y':
          return { ms: value * 31536000000, long: value + ' ' + 'Years' };
      }
    }
  
    return { ms: 0, long: '' }; // Invalid time interval format
  };
