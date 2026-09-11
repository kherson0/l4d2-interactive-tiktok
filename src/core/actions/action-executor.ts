import { L4D2Client } from "../../conectors/l4d2/l4d2.client.js";

import {
    toEffect,
    type InteractiveAction,
} from "./interactive-action.model.js";

export class ActionExecutor {
    constructor(
        private readonly l4d2: L4D2Client,
    ) { }

    async execute(action: InteractiveAction): Promise<void> {
        console.log(
            "[ActionExecutor] Ejecutando:",
            action,
        );

        const { effect, intensity } = toEffect(action);

        await this.l4d2.runEffect(
            effect,
            intensity,
            action.source,
        );
    }
}
