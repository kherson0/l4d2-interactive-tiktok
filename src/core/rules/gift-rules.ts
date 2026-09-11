import type { GiftRule } from "./gift-rule.model.js";

// Un regalo de TikTok por efecto. `maxPerEvent` es el techo tras multiplicar
// por la cantidad de regalos enviados: es lo único que impide que una
// donación grande tumbe la partida.
export const giftRules: GiftRule[] = [
    // ---- Dificultad ----
    {
        gift: "rose",
        action: {
            type: "spawnInfected",
            infected: "hunter",
            amount: 1,
        },
        maxPerEvent: 5,
    },
    {
        gift: "heart",
        action: {
            type: "spawnInfected",
            infected: "jockey",
            amount: 2,
        },
        maxPerEvent: 6,
    },
    {
        gift: "universe",
        action: {
            type: "spawnInfected",
            infected: "witch",
            amount: 1,
        },
        maxPerEvent: 2,
    },
    {
        gift: "galaxy",
        action: {
            type: "spawnInfected",
            infected: "tank",
            amount: 1,
        },
        maxPerEvent: 1,
    },

    // ---- Ayuda ----
    {
        gift: "finger heart",
        action: {
            type: "heal",
            amount: 25,
        },
        // Sin techo: 200 regalos son 5000 de vida, y eso no rompe nada.
    },

    // ---- Caos ----
    {
        gift: "phoenix",
        action: {
            type: "ignite",
            seconds: 5,
        },
        maxPerEvent: 15,
    },
];
