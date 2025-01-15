import { Notification, Push } from "sonddr-shared";
import { getDocuments, watchCollection } from "../database.js";
import webpush from "web-push";

export function watchNotifications() {
    _setupVapidKeys();
    watchCollection<Notification>("notifications").subscribe(async (change) => {
        if (change.type === "insert") {
            let payload = {
                notification: {
                    title: change.docAfter.content,
                    data: {
                        onActionClick: {
                            default: { operation: "openWindow", "url": change.docAfter.href }
                        },
                    },
                }
            };
            const toUserIds = change.docAfter.toIds;
            const endpoints = await getDocuments<Push>("push", undefined, {
                field: "userId",
                operator: "in",
                value: toUserIds,
            }).then(push => push.map(p => p.subscription));
            await Promise.all(endpoints.map(sub => {
                webpush.sendNotification(sub, JSON.stringify(payload));
            }));
        }
    });
}

function _setupVapidKeys() {
    const publicKey = process.env["VAPID_PUBLIC_KEY"];
    if (!publicKey) { throw new Error(`VAPID_PUBLIC_KEY not found`); }
    const privateKey = process.env["VAPID_PRIVATE_KEY"];
    if (!privateKey) { throw new Error(`VAPID_PRIVATE_KEY not found`); }
    webpush.setVapidDetails("mailto:contact@sonddr.com", publicKey, privateKey);
}
