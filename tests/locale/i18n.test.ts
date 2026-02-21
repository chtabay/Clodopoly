import { describe, it, expect } from "vitest";
import { getCellDisplayName, getCardName, getCardDescription, getJobName, formatJournal } from "../../src/locale/i18n";
import { LANG_FR } from "../../src/locale/lang/fr";
import { THEME_POITIERS } from "../../src/locale/themes/poitiers";
import { THEME_MONOPOLY_US } from "../../src/locale/themes/monopoly";
import { BOARD } from "../../src/engine/board";
import { OBJECT_CARDS, EVENT_CARDS, SCAVENGE_CARDS } from "../../src/engine/cards";

describe("i18n", () => {
  describe("getCellDisplayName", () => {
    it("returns Poitiers street names for properties", () => {
      expect(getCellDisplayName(1, LANG_FR, THEME_POITIERS)).toBe("Rue de la Cueille");
      expect(getCellDisplayName(3, LANG_FR, THEME_POITIERS)).toBe("Rue du Pont Neuf");
    });

    it("returns Monopoly US names for properties", () => {
      expect(getCellDisplayName(1, LANG_FR, THEME_MONOPOLY_US)).toBe("Mediterranean Ave");
      expect(getCellDisplayName(3, LANG_FR, THEME_MONOPOLY_US)).toBe("Baltic Ave");
    });

    it("returns station names from theme", () => {
      expect(getCellDisplayName(5, LANG_FR, THEME_POITIERS)).toBe("Gare de Poitiers");
      expect(getCellDisplayName(15, LANG_FR, THEME_POITIERS)).toBe("Marché Notre-Dame");
      expect(getCellDisplayName(25, LANG_FR, THEME_POITIERS)).toBe("CHU de Poitiers");
      expect(getCellDisplayName(29, LANG_FR, THEME_POITIERS)).toBe("Les Cordeliers");
    });

    it("returns localized names for special cells", () => {
      expect(getCellDisplayName(0, LANG_FR, THEME_POITIERS)).toBe("Paie");
      expect(getCellDisplayName(10, LANG_FR, THEME_POITIERS)).toBe("Foyer d'urgence");
      expect(getCellDisplayName(20, LANG_FR, THEME_POITIERS)).toBe("Lieu de Travail");
      expect(getCellDisplayName(31, LANG_FR, THEME_POITIERS)).toBe("Rafle");
    });

    it("returns a name for every cell on the board", () => {
      for (let i = 0; i < BOARD.length; i++) {
        const name = getCellDisplayName(i, LANG_FR, THEME_POITIERS);
        expect(name).toBeTruthy();
        expect(name).not.toBe("???");
      }
    });

    it("handles dark blue properties (index 35, 39)", () => {
      expect(getCellDisplayName(35, LANG_FR, THEME_POITIERS)).toBe("Parc de Blossac");
      expect(getCellDisplayName(39, LANG_FR, THEME_POITIERS)).toBe("Place d'Armes");
      expect(getCellDisplayName(35, LANG_FR, THEME_MONOPOLY_US)).toBe("Park Place");
      expect(getCellDisplayName(39, LANG_FR, THEME_MONOPOLY_US)).toBe("Boardwalk");
    });
  });

  describe("getCardName", () => {
    it("returns French card names", () => {
      expect(getCardName("obj_costume_0", LANG_FR)).toBe("Costume");
      expect(getCardName("obj_car_2", LANG_FR)).toBe("Voiture");
      expect(getCardName("evt_rain_0", LANG_FR)).toBe("Pluie torrentielle");
      expect(getCardName("scv_meds_1", LANG_FR)).toBe("Médicaments");
    });

    it("returns a name for every card type", () => {
      for (const card of [...OBJECT_CARDS, ...EVENT_CARDS, ...SCAVENGE_CARDS]) {
        const name = getCardName(card.id, LANG_FR);
        expect(name).toBeTruthy();
        expect(name).not.toBe(card.id);
      }
    });
  });

  describe("getCardDescription", () => {
    it("returns descriptions for cards", () => {
      expect(getCardDescription("obj_costume_0", LANG_FR)).toBe("Perdu si dormir dehors");
      expect(getCardDescription("scv_cardboard_0", LANG_FR)).toContain("Annule -1 PV");
    });
  });

  describe("getJobName", () => {
    it("returns French job names", () => {
      expect(getJobName("cadre", LANG_FR)).toBe("Cadre");
      expect(getJobName("employe", LANG_FR)).toBe("Employé");
      expect(getJobName("precaire", LANG_FR)).toBe("Précaire");
    });
  });

  describe("formatJournal", () => {
    it("replaces placeholders", () => {
      const msg = formatJournal("salary", LANG_FR, { player: "Alice", amount: "350" });
      expect(msg).toBe("Alice touche son salaire : +350€");
    });

    it("handles missing placeholders gracefully", () => {
      const msg = formatJournal("movement", LANG_FR, { player: "Bob" });
      expect(msg).toContain("Bob");
      expect(msg).toContain("{cell}");
    });
  });
});
