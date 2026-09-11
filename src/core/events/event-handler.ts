import type { ActionQueue } from "../actions/action-queue.js";
import type { InteractiveAction } from "../actions/interactive-action.model.js";
import { giftRules } from "../rules/gift-rules.js";
import type { GiftRule } from "../rules/gift-rule.model.js";

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

        const action = this.createGiftAction(rule, event);

        const accepted = this.actionQueue.enqueue(action);

        if (!accepted) {
            console.warn(
                `[EventHandler] Acción descartada para ${event.user}`,
            );
        }
    }

    private createGiftAction(
        rule: GiftRule,
        event: GiftEvent,
    ): InteractiveAction {
        const action = rule.action;

        const source = {
            user: event.user,
            gift: event.gift,
            giftAmount: event.amount,
        };

        // The viewer decides how many gifts to send, so the multiplier is
        // untrusted input: every effect clamps it.
        switch (action.type) {
            case "spawnInfected":
                return {
                    ...action,
                    amount: this.scale(
                        action.amount,
                        event.amount,
                        rule.maxPerEvent,
                    ),
                    source,
                };

            case "heal":
                return {
                    ...action,
                    amount: this.scale(
                        action.amount,
                        event.amount,
                        rule.maxPerEvent,
                    ),
                    source,
                };

            case "ignite":
                return {
                    ...action,
                    seconds: this.scale(
                        action.seconds,
                        event.amount,
                        rule.maxPerEvent,
                    ),
                    source,
                };
        }
    }

    private scale(
        base: number,
        giftAmount: number,
        max?: number,
    ): number {
        const total = base * giftAmount;

        if (max === undefined || total <= max) {
            return total;
        }

        console.warn(
            `[EventHandler] Cantidad ${total} recortada al máximo ${max}`,
        );

        return max;
    }
}
