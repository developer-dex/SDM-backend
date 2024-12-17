import { executeQuery } from "./config/databaseConfig";
import { sendMultipleCsvToMail } from "./helpers/sendMail";
import fs from 'fs';


export const expiredLicenseCron = async () => {
    const updateStatusToInactive = `UPDATE Licenses SET status = 'inactive' where CAST(expiration_date AS DATE) = CAST(GETDATE() AS DATE)`;
    await executeQuery(updateStatusToInactive);
};


export const deleteExpiredNotification = async () => {
    const deleteExpiredNotification = 'DELETE FROM UsersNotifications where CAST(ExpireDate AS DATE) = CAST(GETDATE() AS DATE)';
    await executeQuery(deleteExpiredNotification);
};

export const expiredSubscription = async () => {
    const expiredSubscription = `UPDATE Subscription SET status = 'expired' where CAST(plan_expired_at AS DATE) = CAST(GETDATE() AS DATE)`;
    await executeQuery(expiredSubscription);
};


export const autoScheduleEmails = async () => {
    const autoScheduleEmails = `SELECT es.id as emailScheduleId, es.ReportName, es.UserId, es.EmailTo, es.Subject, es.Body, u.Email, u.databaseName FROM EmailSchedule es LEFT JOIN Users u ON es.UserId = u.id where es.Type = 'recurring'`;

    console.log("autoScheduleEmails_____________________", autoScheduleEmails);
    const result = await executeQuery(autoScheduleEmails);

    for (const data of result.rows) {
        console.log("data_____________________", data);
        // Find userDetails
        everyDayEmailSchedule(data.databaseName, data.UserId, data);
        // const emailConfig = await getEmailConfiguration(result.rows[0].UserId);

        // find AttachmentPaths

        // await sendMultipleCsvToMail(email.EmailTo, email.Subject, email.Body, email.AttachmentPaths, emailConfig[0].SenderEmail, emailConfig[0].Password);
    }
    
};

 // Email Configration
 // Email Configration
 const getEmailConfiguration = async (userId: number) => {
    const query = `SELECT * FROM EmailConfig WHERE UserId = ${userId}`;
    const result = await executeQuery(query);
    return result.rows;
};

const everyDayEmailSchedule = async (
    DBName: string,
    userId: number,
    body: any
) => {
    // Make csv file for each report and save into attachmentPaths and send email to users

    const emailConfig = await getEmailConfiguration(userId);
    console.log("emailConfig_____________", emailConfig);
    const attachmentPaths = [];

    // split the ReportName by space and get the first word
    const reportNames = body.ReportName.split(",");
    console.log("reportNames___________________", reportNames);
    for (const reportName of reportNames) {
        let query = `SELECT * FROM ${DBName}.dbo.${reportName}`;
        console.log("query________________", query);
        if (reportName === "Clients" || reportName === "BackupJobs") {
        } else {
            if (reportName === "BackupSSLogs") {
                query += ` WHERE EntryDateTime >= CAST(GETDATE() AS DATE) AND EntryDateTime < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))`;
            } else if (reportName === "AuditTrail") {
                query += ` WHERE DateTimeStamp >= CAST(GETDATE() AS DATE) AND DateTimeStamp < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))`;
            } else if (reportName === "PingPathLogs") {
                query += ` WHERE EntryDateTime >= CAST(GETDATE() AS DATE) AND EntryDateTime < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))`;
            } else if (reportName === "JobFireEntries") {
                query += ` WHERE StartTime >= CAST(GETDATE() AS DATE) AND StartTime < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))`;
            }
        }
        const result = await executeQuery(query);
        const csvFilePath = await generateCSVFile(
            reportName,
            result.rows
        );
        attachmentPaths.push({
            fileName: csvFilePath.fileName,
            path: csvFilePath.filePath,
        });
    }

    // Send email to users
    await sendEmailWithAttachments(
        body,
        attachmentPaths,
        emailConfig[0].SenderEmail,
        emailConfig[0].Password
    );
};

const sendEmailWithAttachments = async (
    body: any,
    attachmentPaths: any[],
    senderEmail: string,
    senderPassword: string
) => {
    await sendMultipleCsvToMail(
        body.EmailTo,
        body.Subject,
        body.Body,
        attachmentPaths,
        senderEmail,
        senderPassword
    );
};

const generateCSVFile = async (
    reportName: string,
    data: any[]
): Promise<{ fileName: string; filePath: string }> => {
    const csv = data.map((row) => Object.values(row).join(",")).join("\n");
    const fileName = `${reportName}-${new Date().toISOString().split("T")[0]}.csv`;
    const filePath = `src/assets/emailCsv/${fileName}`; // Define your path here
     // Ensure the directory exists
     await fs.promises.mkdir('src/assets/emailCsv', { recursive: true }); // Create directory if it doesn't exist
    
    await fs.promises.writeFile(filePath, csv);
    return {
        fileName,
        filePath,
    };
}