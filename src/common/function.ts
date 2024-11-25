import { executeQuery } from "../config/databaseConfig";

export const createAuditTrail = async (requestData: any) => {
    const { id, username, loginTime, role } = requestData;
    console.log("requestData:::", requestData);
    console.log("user_id:::", id, username, loginTime, role  );
    let logoutQueryAdd = '';
    if(requestData.action === "logout") {
        const currentTime = new Date().toISOString();
        logoutQueryAdd = `, logout_time = '${currentTime}'`;
    }
    const query = `INSERT INTO AuditTrail (module, action, user_id, username, login_time, role ${logoutQueryAdd}) VALUES ('${requestData.module}', '${requestData.action}', '${id}', '${username}', '${loginTime}', '${role}')`;
    return await executeQuery(query);
}