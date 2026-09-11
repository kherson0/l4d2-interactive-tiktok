import type { InteractiveAction } from "../actions/interactive-action.model.js";

export type GiftRule = {
  gift: string;
  action: InteractiveAction;

  /**
   * Techo tras aplicar el multiplicador de regalos. Solo se pone donde el
   * exceso puede romper algo (spawns). Sin valor, el espectador manda.
   */
  maxPerEvent?: number;
};
