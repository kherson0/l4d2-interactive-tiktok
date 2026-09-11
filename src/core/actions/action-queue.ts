import type { InteractiveAction } from "./interactive-action.model.js";
import type { ActionExecutor } from "./action-executor.js";

import { EffectSkipped } from "../../conectors/l4d2/l4d2.client.js";

import {
    getCooldownKey,
    getCooldownMs,
} from "./action-cooldowns.js";

type ActionQueueOptions = {
    delayMs?: number;
    maxSize?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
};

export class ActionQueue {
    private readonly queue: InteractiveAction[] = [];

    private readonly lastRunAt = new Map<string, number>();

    private processing = false;

    private readonly delayMs: number;
    private readonly maxSize: number;
    private readonly retryAttempts: number;
    private readonly retryDelayMs: number;

    constructor(
        private readonly executor: ActionExecutor,
        options: ActionQueueOptions = {},
    ) {
        this.delayMs = options.delayMs ?? 500;
        this.maxSize = options.maxSize ?? 100;
        this.retryAttempts = options.retryAttempts ?? 3;
        this.retryDelayMs = options.retryDelayMs ?? 2_000;
    }

    enqueue(action: InteractiveAction): boolean {
        if (this.queue.length >= this.maxSize) {
            console.warn(
                `[ActionQueue] Cola llena. Acción descartada: ${action.type}`,
            );

            return false;
        }

        this.queue.push(action);

        console.log(
            `[ActionQueue] Acción agregada. Pendientes: ${this.queue.length}`,
        );

        void this.process();

        return true;
    }

    private async process(): Promise<void> {
        if (this.processing) {
            return;
        }

        this.processing = true;

        try {
            while (this.queue.length > 0) {
                const action = this.queue.shift();

                if (!action) {
                    continue;
                }

                console.log(
                    `[ActionQueue] Ejecutando ${action.type}. Pendientes: ${this.queue.length}`,
                );

                await this.waitForCooldown(action);

                const executed = await this.executeWithRetry(action);

                if (executed) {
                    this.lastRunAt.set(
                        getCooldownKey(action),
                        Date.now(),
                    );
                }

                if (this.queue.length > 0) {
                    await this.delay(this.delayMs);
                }
            }
        } finally {
            this.processing = false;
        }
    }

    // The viewer paid for this effect, so a cooldown defers it instead of
    // dropping it. The queue is serial, so waiting also spreads the burst.
    private async waitForCooldown(
        action: InteractiveAction,
    ): Promise<void> {
        const lastRunAt = this.lastRunAt.get(
            getCooldownKey(action),
        );

        if (lastRunAt === undefined) {
            return;
        }

        const remainingMs =
            getCooldownMs(action) -
            (Date.now() - lastRunAt);

        if (remainingMs <= 0) {
            return;
        }

        console.log(
            `[ActionQueue] ${getCooldownKey(action)} en cooldown. Esperando ${remainingMs}ms`,
        );

        await this.delay(remainingMs);
    }

    private async executeWithRetry(
        action: InteractiveAction,
    ): Promise<boolean> {
        for (
            let attempt = 1;
            attempt <= this.retryAttempts;
            attempt++
        ) {
            try {
                await this.executor.execute(action);

                return true;
            } catch (error) {
                if (error instanceof EffectSkipped) {
                    console.warn(
                        `[ActionQueue] ${action.type} descartada: la partida no está activa`,
                    );

                    return false;
                }

                if (attempt >= this.retryAttempts) {
                    console.error(
                        `[ActionQueue] ${action.type} descartada tras ${attempt} intentos:`,
                        error,
                    );

                    return false;
                }

                console.warn(
                    `[ActionQueue] Falló ${action.type} (intento ${attempt}/${this.retryAttempts}). Reintentando en ${this.retryDelayMs}ms:`,
                    error,
                );

                await this.delay(this.retryDelayMs);
            }
        }

        return false;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
