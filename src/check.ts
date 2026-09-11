// Self-check for the clamp / cooldown / retry logic. Run: pnpm check
import assert from "node:assert/strict";

import { ActionQueue } from "./core/actions/action-queue.js";
import { quoteArg, EffectSkipped } from "./conectors/l4d2/l4d2.client.js";
import { EventHandler } from "./core/events/event-handler.js";
import type { ActionExecutor } from "./core/actions/action-executor.js";
import type { InteractiveAction } from "./core/actions/interactive-action.model.js";

type Run = { action: InteractiveAction; at: number };

function fakeExecutor(failures = 0) {
    const runs: Run[] = [];

    let left = failures;

    const executor = {
        async execute(action: InteractiveAction) {
            if (left > 0) {
                left--;

                throw new Error("RCON caído");
            }

            runs.push({ action, at: Date.now() });
        },
    } as ActionExecutor;

    return { executor, runs };
}

const idle = () =>
    new Promise((resolve) => setTimeout(resolve, 50));

async function clampsGiftMultiplier() {
    const { executor, runs } = fakeExecutor();

    const queue = new ActionQueue(executor, { delayMs: 0 });

    // rose -> 1 hunter por regalo, máximo 5
    await new EventHandler(queue).handle({
        type: "gift",
        user: "viewer",
        gift: "rose",
        amount: 50,
    });

    await idle();

    assert.equal(runs.length, 1);
    assert.equal(runs[0]!.action.type, "spawnInfected");
    assert.equal((runs[0]!.action as any).amount, 5);
}

async function defersSecondSpawnUntilCooldown() {
    const { executor, runs } = fakeExecutor();

    const queue = new ActionQueue(executor, { delayMs: 0 });

    const action: InteractiveAction = {
        type: "spawnInfected",
        infected: "hunter",
        amount: 1,
    };

    queue.enqueue(action);
    queue.enqueue(action);

    await new Promise((resolve) => setTimeout(resolve, 200));

    // el segundo sigue esperando el cooldown de 3s, no se descartó
    assert.equal(runs.length, 1);

    await new Promise((resolve) => setTimeout(resolve, 3_200));

    assert.equal(runs.length, 2);
    assert.ok(runs[1]!.at - runs[0]!.at >= 3_000);
}

async function retriesUntilRconIsBack() {
    const { executor, runs } = fakeExecutor(2);

    const queue = new ActionQueue(executor, {
        delayMs: 0,
        retryAttempts: 3,
        retryDelayMs: 10,
    });

    queue.enqueue({
        type: "spawnInfected",
        infected: "boomer",
        amount: 1,
    });

    await idle();

    assert.equal(runs.length, 1);
}

async function dropsActionAfterLastAttempt() {
    const { executor, runs } = fakeExecutor(99);

    const queue = new ActionQueue(executor, {
        delayMs: 0,
        retryAttempts: 2,
        retryDelayMs: 10,
    });

    queue.enqueue({
        type: "spawnInfected",
        infected: "smoker",
        amount: 1,
    });

    await idle();

    assert.equal(runs.length, 0);
}

async function sanitizesDonorName() {
    // Un ";" o una comilla dejarían ejecutar comandos arbitrarios por RCON.
    assert.equal(
        quoteArg('bot"; rcon_password hack'),
        '"bot rcon_password hack"',
    );

    assert.equal(quoteArg("Jersón_24"), '"Jersón_24"');

    assert.equal(quoteArg("x".repeat(80)).length, 26);
}

async function clampsEveryEffectFamily() {
    const { executor, runs } = fakeExecutor();

    const queue = new ActionQueue(executor, { delayMs: 0 });

    const handler = new EventHandler(queue);

    // finger heart -> +25 de vida por regalo, sin techo
    await handler.handle({
        type: "gift",
        user: "viewer",
        gift: "finger heart",
        amount: 10,
    });

    // phoenix -> 5s de fuego por regalo, techo 15
    await handler.handle({
        type: "gift",
        user: "viewer",
        gift: "phoenix",
        amount: 10,
    });

    await idle();

    assert.equal(runs.length, 2);
    assert.equal((runs[0]!.action as any).amount, 250);
    assert.equal((runs[1]!.action as any).seconds, 15);
}

async function neverRetriesASkippedEffect() {
    let attempts = 0;

    const executor = {
        async execute() {
            attempts++;

            throw new EffectSkipped("fuera de partida");
        },
    } as unknown as ActionExecutor;

    const queue = new ActionQueue(executor, {
        delayMs: 0,
        retryAttempts: 3,
        retryDelayMs: 10,
    });

    queue.enqueue({
        type: "spawnInfected",
        infected: "hunter",
        amount: 1,
    });

    await idle();

    // Un efecto fuera de partida se descarta al primer intento.
    assert.equal(attempts, 1);
}

const checks = [
    clampsGiftMultiplier,
    defersSecondSpawnUntilCooldown,
    retriesUntilRconIsBack,
    dropsActionAfterLastAttempt,
    sanitizesDonorName,
    clampsEveryEffectFamily,
    neverRetriesASkippedEffect,
];

async function main() {
    for (const check of checks) {
        await check();

        console.log(`ok - ${check.name}`);
    }

    console.log("Todo correcto.");
}

main().catch((error) => {
    console.error(error);

    process.exit(1);
});
