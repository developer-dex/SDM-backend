import ContactUs from "../../models/ContactUs";
import { IContactUsRequest } from "./contactUs.interface";

export class ContactUsService {
    constructor() {}

    public async contactUsRequest(
        contactUsRequestpayload: IContactUsRequest
    ): Promise<void> {
        await ContactUs.create(contactUsRequestpayload);
    }
}
