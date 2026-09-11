import type { InfectedType } from "../../conectors/l4d2/infected.type.js";
import type { InteractiveAction } from "./interactive-action.model.js";

// How long the same effect must wait before running again.
// Keeps a burst of gifts from emptying the server (and the run) in seconds.
const spawnCooldownMs: Record<InfectedType, number> = {
    smoker: 3_000,
    boomer: 3_000,
    hunter: 3_000,
    spitter: 3_000,
    jockey: 3_000,
    charger: 5_000,
    tank: 120_000,
    witch: 60_000,
};

export function getCooldownKey(
    action: InteractiveAction,
): string {
    switch (action.type) {
        case "spawnInfected":
            return `spawnInfected:${action.infected}`;

        default:
            return action.type;
    }
}

export function getCooldownMs(
    action: InteractiveAction,
): number {
    switch (action.type) {
        case "spawnInfected":
            return spawnCooldownMs[action.infected];

        case "heal":
            return 30_000;

        case "ignite":
            return 20_000;
    }
}
