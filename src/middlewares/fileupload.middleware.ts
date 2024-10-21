import { UPLOAD_PATH } from "../helpers/constants";
import { createMulterMiddleware } from "../helpers/util";
import { Request, Response, NextFunction } from "express";
import multer from "multer"; // Ensure multer is imported

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
}
