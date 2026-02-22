import { JobType, PropertyColor } from "./types";

export const MAX_PV = 5;
export const MAX_PC = 10;
export const STARTING_MONEY = 800;
export const STARTING_PV = MAX_PV;
export const STARTING_PC_TARGET = 8;
export const STARTING_JOB = JobType.EMPLOYE;

export const BOARD_SIZE = 40;
export const INITIAL_HOUSES = 5;
export const INITIAL_HOTELS = 2;
export const MARKET_SLOTS = 2;

export const FOOD_COST_BASE = 20;
export const FOOD_CAMP_RATIO = 0.6;

export const CAR_FUEL_COST = 30;
export const BUS_TICKET_COST = 10;
export const CAR_FUEL_DEBT_LIMIT = 2;

export const PETIT_BOULOT_PAY = 80;
export const CLINIC_COST = 50;
export const SHELTER_EXIT_COST = 50;
export const GUARANTEED_LODGING_COST = 80;
export const SELL_PRICE_RATIO = 0.5;

export const TAX_LUXURY_AMOUNT = 75;
export const TAX_INCOME_RATE = 0.1;
export const TAX_INCOME_MIN = 20;

export const ROAD_FINE = 30;
export const SDF_FINE = 50;

export const SLEEP_OUTSIDE_PV = -1;
export const SLEEP_OUTSIDE_PC = -1;
export const NO_FOOD_PV = -1;

export const CAMP_PC_BONUS = 1;

export const NIGHT_CAUGHT_PC = -1;
export const CONFRONTATION_LOSER_PV = -1;
export const CONFRONTATION_BOTH_PC = -1;

export const MAX_TURNS = 24;
/** Nombre d'actions par joueur avant que la nuit tombe (1 manche = 1 action par joueur) */
export const ACTIONS_PER_PLAYER_PER_DAY = 4;

export const JOB_STATS: Record<
  JobType,
  {
    salary: number;
    hireMinPc: number;
    keepMinPc: number;
    maxLate: number;
    bonusSalary: number;
  }
> = {
  [JobType.CADRE]: {
    salary: 500,
    hireMinPc: 8,
    keepMinPc: 6,
    maxLate: 0,
    bonusSalary: 550,
  },
  [JobType.EMPLOYE]: {
    salary: 350,
    hireMinPc: 5,
    keepMinPc: 3,
    maxLate: 1,
    bonusSalary: 385,
  },
  [JobType.PRECAIRE]: {
    salary: 200,
    hireMinPc: 2,
    keepMinPc: 1,
    maxLate: 3,
    bonusSalary: 220,
  },
};

export const PC_BONUS_THRESHOLD = 8;

export const NIGHT_COST_BY_COLOR: Record<PropertyColor, number> = {
  [PropertyColor.BROWN]: 30,
  [PropertyColor.LIGHT_BLUE]: 30,
  [PropertyColor.PINK]: 60,
  [PropertyColor.ORANGE]: 60,
  [PropertyColor.RED]: 90,
  [PropertyColor.YELLOW]: 90,
  [PropertyColor.GREEN]: 120,
  [PropertyColor.DARK_BLUE]: 120,
};

export const HOTEL_COST_BY_COLOR: Record<PropertyColor, number> = {
  [PropertyColor.BROWN]: 50,
  [PropertyColor.LIGHT_BLUE]: 50,
  [PropertyColor.PINK]: 100,
  [PropertyColor.ORANGE]: 100,
  [PropertyColor.RED]: 150,
  [PropertyColor.YELLOW]: 150,
  [PropertyColor.GREEN]: 200,
  [PropertyColor.DARK_BLUE]: 200,
};

export const PAYDAY_CELL = 0;
export const SHELTER_CELL = 10;
export const WORKPLACE_CELL = 20;
export const ROUNDUP_CELL = 31;
