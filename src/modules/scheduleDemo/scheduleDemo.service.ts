import ScheduleDemo from "../../models/ScheduleDemo";
import { IScheduleDemoBody } from "./scheduleDemo.interface";

export class ScheduleDemoService {
    constructor() {}

    crateScheduleDemo = async (scheduleDemoBodypayload: IScheduleDemoBody) => {
        await ScheduleDemo.create(scheduleDemoBodypayload);
    };
}
