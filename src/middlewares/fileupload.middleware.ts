import { ADMIN_PROFILE_PATH, CLIENT_WEBSITE_BANNER_PATH, INTEGRATION_IMAGES_PATH, TESTIMONIAL_IMAGE_PATH, TRAINING_FILES_PATH, UPLOAD_PATH } from "../helpers/constants";
import { createMulterMiddleware } from "../helpers/util";
import { Request, Response, NextFunction } from "express";

export class FileUploadMiddleware {
    uploadWebsiteFrontImage = (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const multerMiddleware = createMulterMiddleware(UPLOAD_PATH);
        multerMiddleware.single("image")(req, res, (err) => {
            if (err) {
                return res
                    .status(400)
                    .json({ message: "File upload failed", error: err });
            }
            console.log("File uploaded successfully: ", req.file);
            next();
        });
    };

    uploadClientWebsiteBanner = (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        console.log("uploadClientWebsiteBanner");
        const multerMiddleware = createMulterMiddleware(CLIENT_WEBSITE_BANNER_PATH);
        multerMiddleware.single("image")(req, res, (err) => {
            if (err) {
                return res
                    .status(400)
                    .json({ message: "File upload failed", error: err });
            }
            next();
        });
    }
    uploadAdminProfile = (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        console.log("uploadAdminProfile");
        const multerMiddleware = createMulterMiddleware(ADMIN_PROFILE_PATH);
        multerMiddleware.single("image")(req, res, (err) => {
            if (err) {
                return res
                    .status(400)
                    .json({ message: "File upload failed", error: err });
            }
            next();
        });
    }
    uploadTrainingFiles = (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const multerMiddleware = createMulterMiddleware(TRAINING_FILES_PATH);
        multerMiddleware.single("file")(req, res, (err) => {
            if (err) {
                return res.status(400).json({ message: "File upload failed", error: err });
            }
            next();
        });
    }

    uploadTestimonialImage = (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const multerMiddleware = createMulterMiddleware(TESTIMONIAL_IMAGE_PATH);
        multerMiddleware.single("image")(req, res, (err) => {
            if (err) {
                return res.status(400).json({ message: "File upload failed", error: err });
            }
            next();
        });
    }

    uploadIntegrationImages = (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const multerMiddleware = createMulterMiddleware(INTEGRATION_IMAGES_PATH);
        multerMiddleware.single("image")(req, res, (err) => {
            if (err) {
                return res.status(400).json({ message: "File upload failed", error: err });
            }
            next();
        });
    }
}