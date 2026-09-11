import { L4D2Client } from "../conectors/l4d2/l4d2.client.js";
import { env } from "../config/env.js";
import { ActionExecutor } from "../core/actions/action-executor.js";
import { ActionQueue } from "../core/actions/action-queue.js";
import { EventHandler } from "../core/events/event-handler.js";

export function createApp() {
    const l4d2 = new L4D2Client(
        env.l4d2.host,
        env.l4d2.port,
        env.l4d2.password,
    );

    const actionQueue = new ActionQueue(
        new ActionExecutor(l4d2),
        {
            delayMs: env.actionQueue.delayMs,
            maxSize: env.actionQueue.maxSize,
            retryAttempts: env.actionQueue.retryAttempts,
            retryDelayMs: env.actionQueue.retryDelayMs,
        },
    );

    const eventHandler = new EventHandler(actionQueue);

    return { l4d2, actionQueue, eventHandler };
}

export async function startApp() {
    const { l4d2 } = createApp();

    await l4d2.connect();

    console.log(
        "[Interactive App] Lista para recibir eventos",
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
