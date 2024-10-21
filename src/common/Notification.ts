// import admin from "firebase-admin";
// import { config } from "./firebase";

// const notification = admin.initializeApp({
//     credential: admin.credential.cert(config as admin.ServiceAccount),
// });

// export const pushNotification = async (deviceTokens, title, body) => {
//     const messages = deviceTokens
//         .filter((token) => token && token.length > 8)
//         .map((token) => ({
//             token,
//             notification: {
//                 title,
//                 body,
//             },
//         }));
//     console.log(messages);
//     if (messages.length > 0) {
//         await notification.messaging().sendEach(messages);
//     }
// };
