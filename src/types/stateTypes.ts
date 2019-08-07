// vim: set ts=2 sts=2 sw=2 et:
//
// This file is part of OpenLifter, simple Powerlifting meet software.
// Copyright (C) 2019 The OpenPowerlifting Project.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Defines all the project-wide shared Redux state types in a single place.
//
// Because the Redux store is immutable, all types are internally prefixed
// with the "readonly " covariant type, which makes them immutable.

import { Entry, Flight, Formula, Lift, Plate, AgeCoefficients } from "./dataTypes";
import translations from "../translations/locales";

export type VersionsState = {
  readonly stateVersion: string;
  readonly releaseVersion: string;
};

export type LanguageState = keyof typeof translations | "en";

export type MeetState = {
  // Sanction Information.
  readonly name: string;
  readonly country: string;
  readonly state: string;
  readonly city: string;
  readonly federation: string;
  readonly date: string;
  readonly lengthDays: number;
  readonly platformsOnDays: Array<number>;
  readonly ageCoefficients: AgeCoefficients;

  // Competition Rules.
  readonly divisions: Array<string>;
  readonly weightClassesKgMen: Array<number>;
  readonly weightClassesKgWomen: Array<number>;
  readonly weightClassesKgMx: Array<number>;
  readonly formula: Formula;
  readonly combineSleevesAndWraps: boolean;
  readonly allow4thAttempts: boolean;

  // Weights and Loading Setup.
  readonly inKg: boolean;
  readonly squatBarAndCollarsWeightKg: number;
  readonly benchBarAndCollarsWeightKg: number;
  readonly deadliftBarAndCollarsWeightKg: number;
  readonly plates: Array<Plate>;
  readonly showAlternateUnits: boolean;
};

export type RegistrationState = {
  readonly nextEntryId: number;
  readonly entries: Array<Entry>;
  readonly lookup: {
    readonly [id: number]: number;
  };
};

export type LiftingState = {
  readonly day: number;
  readonly platform: number;
  readonly flight: Flight;
  readonly lift: Lift;
  readonly overrideAttempt: number | null;
  readonly overrideEntryId: number | null;
  readonly columnDivisionWidthPx: number;
};

export type GlobalState = {
  readonly versions: VersionsState;
  readonly language: LanguageState;
  readonly meet: MeetState;
  readonly registration: RegistrationState;
  readonly lifting: LiftingState;
};
