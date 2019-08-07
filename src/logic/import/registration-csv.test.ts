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

import { Csv } from "../export/csv";
import { makeExampleRegistrationsCsv, loadRegistrations } from "./registration-csv";

import rootReducer from "../../reducers/rootReducer";

describe("loadRegistrations", () => {
  it("can load the example", () => {
    let state = rootReducer({}, "OVERWRITE_STORE"); // Get a default global state.

    // Make modifications so the example will load.
    state.meet.divisions = ["Open", "J20-23"];

    const example = makeExampleRegistrationsCsv();
    expect(typeof example).toEqual("string");

    let csv = new Csv();
    expect(typeof csv.fromString(example)).toEqual("object");

    let entries = loadRegistrations(state, csv);
    expect(typeof entries).toEqual("object");
  });
});