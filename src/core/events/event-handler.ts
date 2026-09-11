import type { ActionQueue } from "../actions/action-queue.js";
import type { InteractiveAction } from "../actions/interactive-action.model.js";
import { giftRules } from "../rules/gift-rules.js";

import type {
    GiftEvent,
    InteractiveEvent,
} from "./interactive-event.model.js";

export class EventHandler {
    constructor(
        private readonly actionQueue: ActionQueue,
    ) { }

    async handle(event: InteractiveEvent): Promise<void> {
        console.log(
            "[EventHandler] Evento recibido:",
            event,
        );

        switch (event.type) {
            case "gift":
                this.handleGift(event);
                break;

            case "like":
                console.log(
                    `[EventHandler] Likes recibidos: ${event.amount}`,
                );
                break;
        }
    }

    private handleGift(event: GiftEvent): void {
        const rule = giftRules.find(
            (rule) =>
                rule.gift.toLowerCase() ===
                event.gift.toLowerCase(),
        );

        if (!rule) {
            console.log(
                `[EventHandler] No existe regla para ${event.gift}`,
            );

            return;
        }

        const action = this.createGiftAction(
            rule.action,
            event,
        );

        const accepted = this.actionQueue.enqueue(
            action,
        );

        if (!accepted) {
            console.warn(
                `[EventHandler] Acción descartada para ${event.user}`,
            );
        }
    }

    private createGiftAction(
        action: InteractiveAction,
        event: GiftEvent,
    ): InteractiveAction {
        switch (action.type) {
            case "spawnInfected":
                return {
                    ...action,

                    amount:
                        action.amount *
                        event.amount,

                    source: {
                        user: event.user,
                        gift: event.gift,
                        giftAmount: event.amount,
                    },
                };
        }
    }
}