import type { GiftRule } from "./gift-rule.model.js";

export const giftRules: GiftRule[] = [
    {
        gift: "rose",
        action: {
            type: "spawnInfected",
            infected: "hunter",
            amount: 1,
        },
    },
    {
        gift: "heart",
        action: {
            type: "spawnInfected",
            infected: "jockey",
            amount: 2,
        },
    },
    {
        gift: "universe",
        action: {
            type: "spawnInfected",
            infected: "witch",
            amount: 1,
        },
    },
];