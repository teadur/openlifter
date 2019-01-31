// vim: set ts=2 sts=2 sw=2 et:
// @flow
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

// The main component of the Lifting page, contained by the LiftingView.

import React from "react";
import { connect } from "react-redux";

import AttemptInput from "./AttemptInput";

import { getWeightClassStr } from "../../reducers/meetReducer";
import {
  getProjectedTotalKg,
  getFinalTotalKg,
  getProjectedWilks,
  getFinalWilks,
  getProjectedIPFPoints,
  getFinalIPFPoints,
  getProjectedGlossbrenner,
  getFinalGlossbrenner,
  liftToAttemptFieldName,
  liftToStatusFieldName
} from "../../logic/entry";

import { getAllResults } from "../../logic/divisionPlace";
import type { CategoryResults } from "../../logic/divisionPlace";

import type { Sex } from "../../types/dataTypes";
import type { MeetState, LiftingState } from "../../types/stateTypes";

import styles from "./LiftingTable.module.scss";

type Props = {
  meet: MeetState,
  lifting: LiftingState,
  attemptOneIndexed: number,
  orderedEntries: Array<Object>,
  currentEntryId?: number
};

// List of possible columns that can be rendered.
// The main render() function decides what columns to render,
// and communicates its selection with each row's renderer.
type ColumnType =
  | "Name"
  | "Bodyweight"
  | "WeightClass"
  | "Division"
  | "Equipment"
  | "Age"
  | "S1" | "S2" | "S3" | "S4" // eslint-disable-line
  | "B1" | "B2" | "B3" | "B4" // eslint-disable-line
  | "D1" | "D2" | "D3" | "D4" // eslint-disable-line
  | "BestSquat" | "BestBench" // eslint-disable-line
  | "ProjectedTotal"
  | "ProjectedPoints"
  | "FinalTotal"
  | "FinalPoints"
  | "Place";

class LiftingTable extends React.Component<Props> {
  constructor(props) {
    super(props);
    this.renderRows = this.renderRows.bind(this);
  }

  renderBest3AttemptField(entry, lift, columnType: ColumnType) {
    const fieldKg = liftToAttemptFieldName(lift);
    const fieldStatus = liftToStatusFieldName(lift);

    // Look for either the best lift or the lightest no-lift.
    let best3 = 0.0;
    let lightestFailed = 0.0;

    for (let i = 0; i < 3; i++) {
      const kg = entry[fieldKg][i];

      if (entry[fieldStatus][i] === 1) {
        best3 = Math.max(best3, kg);
      } else if (entry[fieldStatus][i] === -1) {
        lightestFailed = lightestFailed === 0 ? kg : Math.min(lightestFailed, kg);
      }
    }

    // Render cells using attempt coloring.
    if (best3 !== 0) {
      return (
        <td key={columnType} className={styles.goodlift}>
          {best3}
        </td>
      );
    }
    if (lightestFailed !== 0) {
      return (
        <td key={columnType} className={styles.nolift}>
          {lightestFailed}
        </td>
      );
    }

    // Show an empty cell by default.
    return <td key={columnType} />;
  }

  renderAttemptField(entry, lift, attemptOneIndexed: number, columnType: ColumnType) {
    const fieldKg = liftToAttemptFieldName(lift);
    const fieldStatus = liftToStatusFieldName(lift);

    const kg = entry[fieldKg][attemptOneIndexed - 1];
    const status = entry[fieldStatus][attemptOneIndexed - 1];

    // If the attempt was already made, render a colored text field.
    // The weight cannot be changed after the fact.
    if (status !== 0) {
      const className = status === 1 ? styles.goodlift : styles.nolift;
      const maybeNegative = status === 1 ? "" : "-";
      return (
        <td key={columnType} className={className}>
          {maybeNegative}
          {kg}
        </td>
      );
    }

    // If the attempt isn't for the current lift, just show the number.
    if (lift !== this.props.lifting.lift) {
      const kgStr = kg === 0 ? "" : String(kg);
      return <td key={columnType}>{kgStr}</td>;
    }

    // Was any previous attempt taken?
    let anyPreviousAttemptTaken = false;
    for (var i = 1; i < attemptOneIndexed; i++) {
      if (entry[fieldStatus][i - 1] !== 0) {
        anyPreviousAttemptTaken = true;
        break;
      }
    }

    // Show a text input box if either:
    // 1. This column is for the current attempt, and the lifter has a previous attempt.
    // 2. This column is for the next attempt, and the lifter took the current attempt.
    // 3. For whatever reason, someone managed to specify a weight.
    const currentAndHasPrevious = attemptOneIndexed === this.props.attemptOneIndexed && anyPreviousAttemptTaken;
    const nextAndTookLast =
      attemptOneIndexed === this.props.attemptOneIndexed + 1 &&
      entry[fieldStatus][this.props.attemptOneIndexed - 1] !== 0;

    if (kg !== 0 || currentAndHasPrevious || nextAndTookLast) {
      return (
        <td key={columnType} className={styles.attemptInputCell}>
          <AttemptInput entry={entry} lift={lift} attemptOneIndexed={attemptOneIndexed} />
        </td>
      );
    }

    // Default handler.
    const kgStr = kg === 0 ? "" : String(kg);
    return <td key={columnType}>{kgStr}</td>;
  }

  mapSexToClasses = (sex: Sex, meetState: MeetState): Array<number> => {
    switch (sex) {
      case "M":
        return meetState.weightClassesKgMen;
      case "F":
        return meetState.weightClassesKgWomen;
      case "Mx":
        return meetState.weightClassesKgMx;
      default:
        (sex: empty) // eslint-disable-line
        return meetState.weightClassesKgMen;
    }
  };

  renderCell = (entry: Object, columnType: ColumnType, categoryResults: Array<CategoryResults>) => {
    switch (columnType) {
      case "Name":
        return (
          <td key={columnType} className={styles.textCell}>
            {entry.name}
          </td>
        );
      case "Bodyweight":
        return <td key={columnType}>{entry.bodyweightKg}</td>;
      case "WeightClass": {
        const classesForSex = this.mapSexToClasses(entry.sex, this.props.meet);
        const weightClass = getWeightClassStr(classesForSex, entry.bodyweightKg);
        return <td key={columnType}>{weightClass}</td>;
      }
      case "Division": {
        // Just show the first division in the list, if any.
        // Changing this requires coordination with the "Place" column code.
        const firstDiv = entry.divisions.length > 0 ? entry.divisions[0] : null;
        return (
          <td key={columnType} className={styles.textCell}>
            {firstDiv}
          </td>
        );
      }
      case "Equipment": {
        // Use shorter names to actually fit in the table.
        let equipment = entry.equipment;
        if (equipment === "Single-ply") equipment = "Single";
        if (equipment === "Multi-ply") equipment = "Multi";
        return <td key={columnType}>{equipment}</td>;
      }
      case "Age":
        return <td key={columnType}>{entry.age}</td>;
      case "S1":
        return this.renderAttemptField(entry, "S", 1, columnType);
      case "S2":
        return this.renderAttemptField(entry, "S", 2, columnType);
      case "S3":
        return this.renderAttemptField(entry, "S", 3, columnType);
      case "S4":
        return this.renderAttemptField(entry, "S", 4, columnType);
      case "B1":
        return this.renderAttemptField(entry, "B", 1, columnType);
      case "B2":
        return this.renderAttemptField(entry, "B", 2, columnType);
      case "B3":
        return this.renderAttemptField(entry, "B", 3, columnType);
      case "B4":
        return this.renderAttemptField(entry, "B", 4, columnType);
      case "D1":
        return this.renderAttemptField(entry, "D", 1, columnType);
      case "D2":
        return this.renderAttemptField(entry, "D", 2, columnType);
      case "D3":
        return this.renderAttemptField(entry, "D", 3, columnType);
      case "D4":
        return this.renderAttemptField(entry, "D", 4, columnType);
      case "BestSquat":
        return this.renderBest3AttemptField(entry, "S", columnType);
      case "BestBench":
        return this.renderBest3AttemptField(entry, "B", columnType);
      case "ProjectedTotal": {
        const totalKg = getProjectedTotalKg(entry);
        return <td key={columnType}>{totalKg !== 0 ? totalKg : null}</td>;
      }
      case "ProjectedPoints": {
        let points = 0;
        if (this.props.meet.formula === "Glossbrenner") {
          points = getProjectedGlossbrenner(entry);
        } else if (this.props.meet.formula === "IPF Points") {
          const event = entry.events.length > 0 ? entry.events[0] : "SBD";
          points = getProjectedIPFPoints(entry, event);
        } else if (this.props.meet.formula === "Wilks") {
          points = getProjectedWilks(entry);
        }
        return <td key={columnType}>{points !== 0 ? points.toFixed(2) : null}</td>;
      }
      case "FinalTotal": {
        const totalKg = getFinalTotalKg(entry);
        return <td key={columnType}>{totalKg !== 0 ? totalKg : null}</td>;
      }
      case "FinalPoints": {
        let points = 0;
        if (this.props.meet.formula === "Glossbrenner") {
          points = getFinalGlossbrenner(entry);
        } else if (this.props.meet.formula === "IPF Points") {
          const event = entry.events.length > 0 ? entry.events[0] : "SBD";
          points = getFinalIPFPoints(entry, event);
        } else if (this.props.meet.formula === "Wilks") {
          points = getFinalWilks(entry);
        }
        return <td key={columnType}>{points !== 0 ? points.toFixed(2) : null}</td>;
      }
      case "Place": {
        // If the lifter has no total, then don't report a place.
        if (getFinalTotalKg(entry) === 0) return <td key={columnType} />;

        // Just show the Place from the first division in the list.
        // This is the same division as shown in the "Division" column.
        if (entry.divisions.length === 0) return <td key={columnType} />;
        const firstDiv = entry.divisions[0];

        // Look at all the categories, and find the first one including this division
        // and entry. Because the categories are in sorted order, SBD takes priority
        // over B by default.
        for (let i = 0; i < categoryResults.length; i++) {
          const result = categoryResults[i];
          if (result.category.division !== firstDiv) {
            continue;
          }

          const catEntries = result.orderedEntries;
          for (let j = 0; j < catEntries.length; j++) {
            const catEntry = catEntries[j];

            if (catEntry.id === entry.id) {
              return <td key={columnType}>{j + 1}</td>;
            }
          }
        }

        return <td key={columnType} />; // Shouldn't happen.
      }
      default:
        (columnType: empty); // eslint-disable-line
        return <td key={columnType} />;
    }
  };

  renderRows = (columns: Array<ColumnType>, categoryResults: Array<CategoryResults>) => {
    const orderedEntries = this.props.orderedEntries;
    const currentEntryId = this.props.currentEntryId;

    let rows = [];
    for (let i = 0; i < orderedEntries.length; i++) {
      const entry = orderedEntries[i];

      // Iterate over each columnType, handling each.
      let cells = [];
      for (let col = 0; col < columns.length; col++) {
        const columnType = columns[col];
        cells.push(this.renderCell(entry, columnType, categoryResults));
      }

      const isCurrent = entry.id === currentEntryId;
      const rowClassName = isCurrent ? styles.current : "";
      rows.push(
        <tr key={entry.id} className={rowClassName}>
          {cells}
        </tr>
      );
    }
    return rows;
  };

  getColumnHeaderString = (columnType: ColumnType): string => {
    switch (columnType) {
      case "Name":
        return "Name";
      case "Bodyweight":
        return "Bwt";
      case "WeightClass":
        return "Class";
      case "Division":
        return "Division";
      case "Equipment":
        return "Equip";
      case "Age":
        return "Age";
      case "S1":
        return "S1";
      case "S2":
        return "S2";
      case "S3":
        return "S3";
      case "S4":
        return "S4";
      case "B1":
        return "B1";
      case "B2":
        return "B2";
      case "B3":
        return "B3";
      case "B4":
        return "B4";
      case "D1":
        return "D1";
      case "D2":
        return "D2";
      case "D3":
        return "D3";
      case "D4":
        return "D4";
      case "BestSquat":
        return "Squat";
      case "BestBench":
        return "Bench";
      case "ProjectedTotal":
        return "Total";
      case "ProjectedPoints":
        return "Points";
      case "FinalTotal":
        return "Total";
      case "FinalPoints":
        return "Points";
      case "Place":
        return "Place";
      default:
        (columnType: empty); // eslint-disable-line
        return "";
    }
  };

  render() {
    // Select the columns for display.
    let columns: Array<ColumnType> = ["Name", "Division", "Bodyweight", "WeightClass"];

    // Select lift columns based off the current lift.
    if (this.props.lifting.lift === "S") {
      columns.push("S1", "S2", "S3");
      if (this.props.attemptOneIndexed === 4) {
        columns.push("S4");
      }
      columns.push("B1", "D1");
    } else if (this.props.lifting.lift === "B") {
      columns.push("BestSquat", "B1", "B2", "B3");
      if (this.props.attemptOneIndexed === 4) {
        columns.push("B4");
      }
      columns.push("D1");
    } else if (this.props.lifting.lift === "D") {
      columns.push("BestSquat", "BestBench", "D1", "D2", "D3");
      if (this.props.attemptOneIndexed === 4) {
        columns.push("D4");
      }
    }

    // Use projected totals for everything before 2nd attempt deadlifts.
    if (this.props.lifting.lift !== "D" || this.props.attemptOneIndexed < 2) {
      columns.push("ProjectedTotal", "ProjectedPoints", "Place");
    } else {
      columns.push("FinalTotal", "FinalPoints", "Place");
    }

    // Build headers.
    let headers = [];
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      let className = styles.smallCell;
      if (column === "Name") className = styles.nameCell;
      else if (column === "Division") className = styles.divisionCell;

      headers.push(
        <th key={column} className={className}>
          {this.getColumnHeaderString(column)}
        </th>
      );
    }

    // Calculate the Division placings for each of the lifters.
    const categoryResults = getAllResults(
      this.props.orderedEntries,
      this.props.meet.weightClassesKgMen,
      this.props.meet.weightClassesKgWomen,
      this.props.meet.weightClassesKgMx
    );

    return (
      <table className={styles.liftingtable}>
        <thead>
          <tr>{headers}</tr>
        </thead>
        <tbody>{this.renderRows(columns, categoryResults)}</tbody>
      </table>
    );
  }
}

const mapStateToProps = state => {
  return {
    ...state
  };
};

export default connect(
  mapStateToProps,
  null
)(LiftingTable);
