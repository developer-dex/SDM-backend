import { executeSqlQuery } from "../../config/databaseConfig";
import { SUPER_ADMIN_DATABASE } from "../../helpers/constants";
import ContactUs from "../../models/ContactUs";
import { IContactUsRequest } from "./contactUs.interface";

export class ContactUsService {
    constructor() {}

    public async contactUsRequest(
        contactUsRequestpayload: IContactUsRequest
    ): Promise<void> {

        const query = `INSERT INTO ContactUs (name, email, message, phoneNo, subject) VALUES ('${contactUsRequestpayload.name}', '${contactUsRequestpayload.email}', '${contactUsRequestpayload.message}', '${contactUsRequestpayload.phoneNo}', '${contactUsRequestpayload.subject}')`;

        await executeSqlQuery(
            query
        );
        await ContactUs.create(contactUsRequestpayload);
    }
}
