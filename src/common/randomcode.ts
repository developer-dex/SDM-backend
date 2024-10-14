import Filters from "../models/Filters";

export const generateUniqueCode = async () => {
    let code: string;
    let existingFilter: any;
    do {
        // Generate a 6-digit code with an alphabetic first character
        const firstChar = String.fromCharCode(
            65 + Math.floor(Math.random() * 26)
        );
        const numericPart = Math.floor(
            10000 + Math.random() * 90000
        ).toString();
        code = `#${firstChar}${numericPart}`;

        // Check if the code is already in use
        existingFilter = await Filters.findOne({ code });
    } while (existingFilter);

    return code;
};
