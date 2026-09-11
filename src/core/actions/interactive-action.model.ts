import { InfectedType } from "../../conectors/l4d2/infected.type";



export type ActionSource = {
    user: string;
    gift?: string;
    giftAmount?: number;
};

export type SpawnInfectedAction = {
    type: "spawnInfected";
    infected: InfectedType;
    amount: number;
    source?: ActionSource;
};

export type InteractiveAction =
    | SpawnInfectedAction;