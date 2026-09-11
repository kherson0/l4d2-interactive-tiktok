import type { InfectedType } from "../../conectors/l4d2/infected.type.js";

export type ActionSource = {
    user: string;
    gift?: string;
    giftAmount?: number;
};

/** Dificultad: aparecen infectados cerca del jugador. */
export type SpawnInfectedAction = {
    type: "spawnInfected";
    infected: InfectedType;
    amount: number;
    source?: ActionSource;
};

/** Ayuda: puntos de vida al jugador. */
export type HealAction = {
    type: "heal";
    amount: number;
    source?: ActionSource;
};

/** Caos: el jugador arde durante unos segundos. */
export type IgniteAction = {
    type: "ignite";
    seconds: number;
    source?: ActionSource;
};

export type InteractiveAction =
    | SpawnInfectedAction
    | HealAction
    | IgniteAction;

/** Efecto e intensidad tal y como los espera el comando sm_interactive. */
export function toEffect(
    action: InteractiveAction,
): { effect: string; intensity: number } {
    switch (action.type) {
        case "spawnInfected":
            return {
                effect: action.infected,
                intensity: action.amount,
            };

        case "heal":
            return { effect: "heal", intensity: action.amount };

        case "ignite":
            return { effect: "ignite", intensity: action.seconds };
    }
}
