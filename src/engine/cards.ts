import { CardDefinition, CardInstance } from "./types";

export const OBJECT_CARDS: readonly CardDefinition[] = [
  { id: "obj_costume",  type: "object", icon: "👔", pcValue: 2, price: 150, copies: 4, keepable: true },
  { id: "obj_car",      type: "object", icon: "🚗", pcValue: 3, price: 400, copies: 4, keepable: true },
  { id: "obj_hat",      type: "object", icon: "🎩", pcValue: 1, price: 40,  copies: 4, keepable: true },
  { id: "obj_shoes",    type: "object", icon: "👞", pcValue: 1, price: 80,  copies: 4, keepable: true },
  { id: "obj_hair",     type: "object", icon: "💇", pcValue: 1, price: 80,  copies: 4, keepable: true },
  { id: "obj_phone",    type: "object", icon: "📱", pcValue: 2, price: 250, copies: 4, keepable: true },
  { id: "obj_watch",    type: "object", icon: "⌚", pcValue: 1, price: 120, copies: 4, keepable: true },
  { id: "obj_bag",      type: "object", icon: "💼", pcValue: 1, price: 80,  copies: 4, keepable: true },
];

export const EVENT_CARDS: readonly CardDefinition[] = [
  { id: "evt_id_check",    type: "event", icon: "👮", effect: { pcDelta: -2 },                          copies: 2, keepable: false },
  { id: "evt_samaritan",   type: "event", icon: "🤝", effect: { moneyDelta: 100 },                     copies: 2, keepable: false },
  { id: "evt_assault",     type: "event", icon: "👊", effect: { pvDelta: -1, loseObject: "any" },       copies: 2, keepable: false },
  { id: "evt_strike",      type: "event", icon: "🚌", effect: { disableBus: true },                     copies: 2, keepable: false },
  { id: "evt_breakdown",   type: "event", icon: "⛽", effect: { disableCar: true },                     copies: 2, keepable: false },
  { id: "evt_food_poison", type: "event", icon: "🤢", effect: { pvDelta: -2 },                          copies: 2, keepable: false },
  { id: "evt_rain",        type: "event", icon: "🌧️", effect: { destroyCartons: true },                 copies: 2, keepable: false },
  { id: "evt_police_raid", type: "event", icon: "🚨", effect: { loseObject: "most_expensive" },         copies: 1, keepable: false },
  { id: "evt_pickpocket",  type: "event", icon: "🦹", effect: { loseObject: "left_player_choice" },     copies: 1, keepable: false },
];

export const SCAVENGE_CARDS: readonly CardDefinition[] = [
  { id: "scv_costume",     type: "scavenge", icon: "👔", pcValue: 1, copies: 1, keepable: true },
  { id: "scv_toiletries",  type: "scavenge", icon: "🚿", pcValue: 1, copies: 1, keepable: true },
  { id: "scv_food",        type: "scavenge", icon: "🥫", effect: { pvDelta: 1 },          copies: 2, keepable: false },
  { id: "scv_cardboard",   type: "scavenge", icon: "📦",                                  copies: 2, keepable: true },
  { id: "scv_hideout",     type: "scavenge", icon: "🏚️",                                  copies: 2, keepable: true },
  { id: "scv_sellable",    type: "scavenge", icon: "💰", effect: { moneyDelta: 50 },      copies: 3, keepable: false },
  { id: "scv_meds",        type: "scavenge", icon: "💊", effect: { pvDelta: 2 },           copies: 2, keepable: false },
  { id: "scv_phone",       type: "scavenge", icon: "📱", pcValue: 1,                      copies: 1, keepable: true },
  { id: "scv_sleeping_bag",type: "scavenge", icon: "🛏️",                                  copies: 2, keepable: true },
];

export const ALL_CARD_DEFS: ReadonlyMap<string, CardDefinition> = new Map([
  ...OBJECT_CARDS.map(c => [c.id, c] as const),
  ...EVENT_CARDS.map(c => [c.id, c] as const),
  ...SCAVENGE_CARDS.map(c => [c.id, c] as const),
]);

export function instantiateCards(definitions: readonly CardDefinition[]): CardInstance[] {
  const instances: CardInstance[] = [];
  for (const def of definitions) {
    for (let i = 0; i < def.copies; i++) {
      instances.push({
        instanceId: `${def.id}_${i}`,
        templateId: def.id,
      });
    }
  }
  return instances;
}

export function getCardDef(cardId: string): CardDefinition | undefined {
  const templateId = cardId.replace(/_\d+$/, "");
  return ALL_CARD_DEFS.get(templateId);
}

export function cardIdToTemplate(cardId: string): string {
  return cardId.replace(/_\d+$/, "");
}

export function totalObjectCards(): number {
  return OBJECT_CARDS.reduce((sum, c) => sum + c.copies, 0);
}

export function totalEventCards(): number {
  return EVENT_CARDS.reduce((sum, c) => sum + c.copies, 0);
}

export function totalScavengeCards(): number {
  return SCAVENGE_CARDS.reduce((sum, c) => sum + c.copies, 0);
}
