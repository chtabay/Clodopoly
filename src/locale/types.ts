import { PropertyColor } from "../engine/types";

export type EstablishmentService =
  | "sell"
  | "buy"
  | "work"
  | "sleep"
  | "heal"
  | "employ";

export interface EstablishmentDefinition {
  name: string;
  services: EstablishmentService[];
  /** Coût du logement garanti (si service "sleep" avec option garantie), en € */
  guaranteedLodgingCost?: number;
}

export interface LocationTheme {
  id: string;
  label: string;
  propertyNames: Record<PropertyColor, string[]>;
  stationNames: [string, string, string, string];
  /** Établissements par index de case (propriétés uniquement). Cases sans entrée = pas d'établissement. */
  establishmentsByCellIndex?: Partial<Record<number, EstablishmentDefinition>>;
}

export interface LangData {
  id: string;
  label: string;

  ui: Record<string, string>;

  cells: {
    payday: string;
    shelter: string;
    workplace: string;
    roundup: string;
    event: string;
    scavenge: string;
    shower: string;
    clinic: string;
    market: string;
    petitBoulot: string;
    taxIncome: string;
    taxLuxury: string;
  };

  cards: Record<string, { name: string; description: string }>;

  jobs: Record<string, { name: string }>;

  nightActions: {
    sleep: { name: string; description: string };
    watch: { name: string; description: string };
    scavenge: { name: string; description: string };
    take: { name: string; description: string };
  };

  transport: {
    car: { name: string };
    bus: { name: string };
    foot: { name: string };
  };

  journal: Record<string, string>;
}
