import type { InteractiveAction } from "./interactive-action.model.js";
import type { ActionExecutor } from "./action-executor.js";

type ActionQueueOptions = {
    delayMs?: number;
    maxSize?: number;
};

export class ActionQueue {
    private readonly queue: InteractiveAction[] = [];

    private processing = false;

    private readonly delayMs: number;
    private readonly maxSize: number;

    constructor(
        private readonly executor: ActionExecutor,
        options: ActionQueueOptions = {},
    ) {
        this.delayMs = options.delayMs ?? 500;
        this.maxSize = options.maxSize ?? 100;
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

                try {
                    await this.executor.execute(action);
                } catch (error) {
                    console.error(
                        `[ActionQueue] Error ejecutando ${action.type}:`,
                        error,
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

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}