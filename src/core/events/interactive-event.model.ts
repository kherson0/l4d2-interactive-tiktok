export type GiftEvent = {
    type: "gift";
    user: string;
    gift: string;
    amount: number;
};

export type LikeEvent = {
    type: "like";
    user: string;
    amount: number;
};

export type InteractiveEvent =
    | GiftEvent
    | LikeEvent;