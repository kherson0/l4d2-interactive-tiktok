import { L4D2Client } from "../conectors/l4d2/l4d2.client.js";
import { env } from "../config/env.js";
import { ActionExecutor } from "../core/actions/action-executor.js";
import { ActionQueue } from "../core/actions/action-queue.js";
import { EventHandler } from "../core/events/event-handler.js";

export async function startApp() {
    const l4d2 = new L4D2Client(
        env.l4d2.host,
        env.l4d2.port,
        env.l4d2.password,
    );

    await l4d2.connect();

    const actionExecutor = new ActionExecutor(
        l4d2,
    );

    const actionQueue = new ActionQueue(
        actionExecutor,
        {
            delayMs: env.actionQueue.delayMs,
            maxSize: env.actionQueue.maxSize,
        },
    );

    const eventHandler = new EventHandler(
        actionQueue,
    );

    console.log(
        "[Interactive App] Lista para recibir eventos",
    );

    await eventHandler.handle({
        type: "gift",
        user: "viewer_test",
        gift: "universe",
        amount: 5,
    });

    // await Promise.all([
    //     eventHandler.handle({
    //         type: "gift",
    //         user: "viewer_1",
    //         gift: "rose",
    //         amount: 1,
    //     }),

    //     eventHandler.handle({
    //         type: "gift",
    //         user: "viewer_2",
    //         gift: "heart",
    //         amount: 1,
    //     }),

    //     eventHandler.handle({
    //         type: "gift",
    //         user: "viewer_3",
    //         gift: "universe",
    //         amount: 1,
    //     }),
    // ]);

    console.log(
        "[Interactive App] Los eventos ya fueron recibidos",
    );

    const shutdown = async () => {
        console.log(
            "\n[Interactive App] Cerrando...",
        );

        await l4d2.disconnect();

        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}