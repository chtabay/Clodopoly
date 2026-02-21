import { describe, it, expect } from "vitest";
import {
  OBJECT_CARDS,
  EVENT_CARDS,
  SCAVENGE_CARDS,
  instantiateCards,
  getCardDef,
  cardIdToTemplate,
  totalObjectCards,
  totalEventCards,
  totalScavengeCards,
} from "../../src/engine/cards";

describe("Cards", () => {
  it("has 8 object card types", () => {
    expect(OBJECT_CARDS).toHaveLength(8);
  });

  it("has 32 total object card instances", () => {
    expect(totalObjectCards()).toBe(32);
  });

  it("has 9 event card types totaling 16 cards", () => {
    expect(EVENT_CARDS).toHaveLength(9);
    expect(totalEventCards()).toBe(16);
  });

  it("has 9 scavenge card types totaling 16 cards", () => {
    expect(SCAVENGE_CARDS).toHaveLength(9);
    expect(totalScavengeCards()).toBe(16);
  });

  it("all object cards have pcValue and price", () => {
    for (const card of OBJECT_CARDS) {
      expect(card.pcValue).toBeGreaterThan(0);
      expect(card.price).toBeGreaterThan(0);
      expect(card.keepable).toBe(true);
    }
  });

  it("car card has pcValue 3", () => {
    const car = OBJECT_CARDS.find(c => c.id === "obj_car");
    expect(car?.pcValue).toBe(3);
  });

  it("event cards are not keepable", () => {
    for (const card of EVENT_CARDS) {
      expect(card.keepable).toBe(false);
    }
  });

  it("instantiateCards creates correct number of instances", () => {
    const instances = instantiateCards(OBJECT_CARDS);
    expect(instances).toHaveLength(32);
    expect(instances[0].instanceId).toBe("obj_costume_0");
    expect(instances[0].templateId).toBe("obj_costume");
  });

  it("each instance has a unique instanceId", () => {
    const instances = instantiateCards(OBJECT_CARDS);
    const ids = new Set(instances.map(i => i.instanceId));
    expect(ids.size).toBe(instances.length);
  });

  it("getCardDef resolves instance IDs to definitions", () => {
    const def = getCardDef("obj_costume_2");
    expect(def).toBeDefined();
    expect(def?.id).toBe("obj_costume");
    expect(def?.pcValue).toBe(2);
  });

  it("cardIdToTemplate extracts template from instance ID", () => {
    expect(cardIdToTemplate("obj_costume_0")).toBe("obj_costume");
    expect(cardIdToTemplate("evt_rain_1")).toBe("evt_rain");
    expect(cardIdToTemplate("scv_sleeping_bag_0")).toBe("scv_sleeping_bag");
  });

  it("all card IDs are unique within their category", () => {
    const objectIds = new Set(OBJECT_CARDS.map(c => c.id));
    expect(objectIds.size).toBe(OBJECT_CARDS.length);

    const eventIds = new Set(EVENT_CARDS.map(c => c.id));
    expect(eventIds.size).toBe(EVENT_CARDS.length);

    const scavengeIds = new Set(SCAVENGE_CARDS.map(c => c.id));
    expect(scavengeIds.size).toBe(SCAVENGE_CARDS.length);
  });
});
