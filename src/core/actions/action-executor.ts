
import { L4D2Client } from "../../conectors/l4d2/l4d2.client.js";
import type { InteractiveAction } from "./interactive-action.model.js";

export class ActionExecutor {
    constructor(
        private readonly l4d2: L4D2Client,
    ) { }

    async execute(action: InteractiveAction): Promise<void> {
        console.log(
            "[ActionExecutor] Ejecutando:",
            action,
        );

        switch (action.type) {
            case "spawnInfected":
                await this.l4d2.spawnInfected(
                    action.infected,
                    action.amount,
                );
                break;
        }
    }
}