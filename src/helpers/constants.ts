import getEnvVar from "./util";
export const UPLOAD_PATH = "assets/frontImages";
export const CLIENT_WEBSITE_BANNER_PATH = "assets/clientWebsiteBanners";
export const TRAINING_FILES_PATH = "assets/trainingFiles";
export const TESTIMONIAL_IMAGE_PATH = "assets/testimonialImages";
export const INTEGRATION_IMAGES_PATH = "assets/integrationImages";
export const FEEDBACK_AND_SUGGESTION_IMAGE_PATH =
    "assets/feedbackAndSuggestionImages";
export const ADMIN_PROFILE_PATH = "assets/adminProfiles";
export const RESET_PASSWORD_FRONT_URL =
    getEnvVar("FRONTEND_URL") + "/reset-password";

export const clientAdminPermissions =
    "client-dashboard,ping-path,client-user-management,backup-storage-statistics,job-fire-statistics,pricing-client,audit-trail,email,traning,setting,client-support-ticket,client-faq,feedback-suggestion,email-schedule,client-management-list";

export const SUPER_ADMIN_DATABASE = "SuperAdmin";

export const Modules = {
    ADMIN_DASHBOARD: "Admin Dashboard",
    PRICING_PLAN: "Pricing Plan",
    SUPPORT_TICKET: "Support Ticket",
    CUSTOMER_MANAGEMENT: "Customer Management",
    USER_MANAGEMENT: "User Management",
    AUDIT_LOGS: "Audit Logs",
    NOTIFICATION: "Notification",
    BANNER_MANAGEMENT: "Banner Management",
    ANALYTICS: "Analytics",
    LICENSE_MANAGEMENT: "License Management",
};

export const Actions = {
    PRICING_PLAN: {
        CREATE: "Create Plan",
        UPDATE: "Update Plan",
        DELETE: "Delete Plan",
    },
    SUPPORT_TICKET: {
        CREATE: "Create Support Ticket",
        UPDATE: "Update Support Ticket",
        DELETE: "Delete Support Ticket",
    },
    CUSTOMER_MANAGEMENT: {
        CREATE: "Create Customer",
        UPDATE: "Update Customer",
        DELETE: "Delete Customer",
    },
    USER_MANAGEMENT: {
        GET_ALL: "Get All Users",
        CREATE: "Create User",
        UPDATE: "Update User",
        DELETE: "Delete User",
        EXPORT_TO_EMAIL: "Export to Email",
        EXPORT_LOCAL: "Export",
    },
    ADMIN_DASHBOARD: {
        LOGIN: "Login",
        LOGOUT: "Logout",
    },
    AUDIT_TRAIL: {
        EXPORT_TO_EMAIL: "Export to Email",
    },
    LICENSE_MANAGEMENT: {
        EXPORT_TO_EMAIL: "Export to Email",
        CREATE: "Create License",
        UPDATE: "Update License",
        DELETE: "Delete License",
    },
};
