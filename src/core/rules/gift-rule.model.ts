import type { InteractiveAction } from "../actions/interactive-action.model.js";

export type GiftRule = {
  gift: string;
  action: InteractiveAction;
};