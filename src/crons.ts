import { executeQuery } from "./config/databaseConfig";


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
