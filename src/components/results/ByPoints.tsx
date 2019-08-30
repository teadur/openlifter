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

// Displays the results by points.

import React from "react";
import { connect } from "react-redux";

import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";

import { getAllRankings } from "../../logic/pointsPlace";
import { getWeightClassStr, getWeightClassLbsStr } from "../../reducers/meetReducer";
import {
  getBest5SquatKg,
  getBest5BenchKg,
  getBest5DeadliftKg,
  getFinalEventTotalKg,
  entryHasLifted
} from "../../logic/entry";
import { kg2lbs, displayWeight } from "../../logic/units";

import { getPoints, getAgeAdjustedPoints } from "../../logic/coefficients/coefficients";

import { PointsCategory, PointsCategoryResults } from "../../logic/pointsPlace";
import { AgeCoefficients, Entry, Formula, Sex } from "../../types/dataTypes";
import { GlobalState } from "../../types/stateTypes";
import { checkExhausted } from "../../types/utils";
import { fosterMcCulloch } from "../../logic/coefficients/foster-mcculloch";

interface StateProps {
  inKg: boolean;
  meetName: string;
  meetDate: string;
  formula: Formula;
  combineSleevesAndWraps: boolean;
  lengthDays: number;
  weightClassesKgMen: Array<number>;
  weightClassesKgWomen: Array<number>;
  weightClassesKgMx: Array<number>;
  entries: Array<Entry>;
}

// Overloads this component so it can render different types of "Best Lifter" categories.
export type AgePointsCategory = "BestLifter" | "BestMastersLifter" | "BestJuniorsLifter";

interface OwnProps {
  day: string | number; // Really a number, 0 meaning "all".
  ageCoefficients: AgeCoefficients; // In OwnProps so that caller can disable it.
  agePointsCategory: AgePointsCategory;
}

type Props = StateProps & OwnProps;

const mapSexToClasses = (sex: Sex, props: Props): Array<number> => {
  switch (sex) {
    case "M":
      return props.weightClassesKgMen;
    case "F":
      return props.weightClassesKgWomen;
    case "Mx":
      return props.weightClassesKgMx;
    default:
      checkExhausted(sex);
      return props.weightClassesKgMen;
  }
};

class ByPoints extends React.Component<Props> {
  renderEntryRow = (entry: Entry, category: PointsCategory, key: number): JSX.Element | null => {
    // Skip no-show lifters.
    if (!entryHasLifted(entry)) return null;

    // Skip DQ'd lifters. Meet directors have reported that it's embarrassing
    // to the DQ'd lifter to have that projected.
    const totalKg = getFinalEventTotalKg(entry, category.event);
    if (totalKg === 0) return null;

    const inKg = this.props.inKg;

    // The place proceeds in order by key, except for DQ entries.
    const rank = totalKg === 0 ? "DQ" : key + 1;

    const points: number = getAgeAdjustedPoints(
      this.props.ageCoefficients,
      this.props.meetDate,
      this.props.formula,
      entry,
      category.event,
      totalKg,
      inKg
    );

    let pointsStr = "";
    if (totalKg !== 0 && points === 0) pointsStr = "N/A";
    else if (totalKg !== 0 && points !== 0) pointsStr = points.toFixed(2);

    const classes = mapSexToClasses(entry.sex, this.props);
    const wtcls = inKg
      ? getWeightClassStr(classes, entry.bodyweightKg)
      : getWeightClassLbsStr(classes, entry.bodyweightKg);
    const bw = inKg ? entry.bodyweightKg : kg2lbs(entry.bodyweightKg);

    const squatKg = getBest5SquatKg(entry);
    const squat = inKg ? squatKg : kg2lbs(squatKg);

    const benchKg = getBest5BenchKg(entry);
    const bench = inKg ? benchKg : kg2lbs(benchKg);

    const deadliftKg = getBest5DeadliftKg(entry);
    const deadlift = inKg ? deadliftKg : kg2lbs(deadliftKg);

    const total = inKg ? totalKg : kg2lbs(totalKg);

    return (
      <tr key={key}>
        <td>{rank}</td>
        <td>{entry.name}</td>
        <td>{entry.sex}</td>
        <td>{entry.equipment}</td>
        <td>{entry.bodyweightKg === 0 ? null : wtcls}</td>
        <td>{entry.bodyweightKg === 0 ? null : displayWeight(bw)}</td>
        <td>{entry.age === 0 ? null : entry.age}</td>
        <td>{squatKg === 0 ? "" : displayWeight(squat)}</td>
        <td>{benchKg === 0 ? "" : displayWeight(bench)}</td>
        <td>{deadliftKg === 0 ? "" : displayWeight(deadlift)}</td>
        <td>{totalKg === 0 ? "" : displayWeight(total)}</td>
        <td>{pointsStr}</td>
      </tr>
    );
  };

  mapSexToLabel = (sex: Sex): string => {
    switch (sex) {
      case "M":
        return "Men's";
      case "F":
        return "Women's";
      case "Mx":
        return "Mx";
      default:
        checkExhausted(sex);
        return "";
    }
  };

  renderCategoryResults = (results: PointsCategoryResults, key: number): JSX.Element | null => {
    const { category, orderedEntries } = results;
    const sex = this.mapSexToLabel(category.sex);

    // Gather rows.
    let rows = [];
    for (let i = 0; i < orderedEntries.length; i++) {
      const row = this.renderEntryRow(orderedEntries[i], category, i);
      if (row !== null) {
        rows.push(row);
      }
    }

    // If all lifters were No-Show, skip displaying this category.
    if (rows.length === 0) {
      return null;
    }

    let eqpstr: string = category.equipment;
    if (this.props.combineSleevesAndWraps) {
      eqpstr = "Sleeves + Wraps";
    }

    return (
      <Card key={key}>
        <Card.Header>
          {sex} {eqpstr} {category.event}
        </Card.Header>
        <Card.Body>
          <Table striped hover size="sm">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Sex</th>
                <th>Equipment</th>
                <th>Class</th>
                <th>Bwt</th>
                <th>Age</th>
                <th>Squat</th>
                <th>Bench</th>
                <th>Deadlift</th>
                <th>Total</th>
                <th>{this.props.ageCoefficients === "None" ? "Points" : "Age-Points"}</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  render() {
    let entries = this.props.entries;

    // If this is for Best Masters lifter, just include non-standard-aged lifters.
    if (this.props.agePointsCategory !== "BestLifter") {
      entries = entries.filter(e => {
        // Filter out based on age.
        switch (this.props.agePointsCategory) {
          case "BestLifter":
            break;
          case "BestMastersLifter":
            // The coefficients logic below will handle older lifters
            // according to the chosen age coefficient system.
            if (e.age <= 27) {
              return false;
            }
            break;
          case "BestJuniorsLifter":
            // The coefficients logic below will handle older lifters
            // according to the chosen age coefficient system.
            if (e.age >= 27) {
              return false;
            }
            break;
          default:
            checkExhausted(this.props.agePointsCategory);
            break;
        }

        // Only include lifters who get an age bump.
        switch (this.props.ageCoefficients) {
          case "None":
            return true;
          case "FosterMcCulloch":
            return fosterMcCulloch(e.age) !== 1.0;
          default:
            checkExhausted(this.props.ageCoefficients);
            return true;
        }
      });
    }

    const results = getAllRankings(
      entries,
      this.props.formula,
      this.props.ageCoefficients,
      this.props.combineSleevesAndWraps,
      this.props.inKg,
      this.props.meetDate
    );

    let categoryCards = [];
    for (let i = 0; i < results.length; i++) {
      const panel = this.renderCategoryResults(results[i], i);
      if (panel !== null) {
        categoryCards.push(panel);
      }
    }

    return <div>{categoryCards}</div>;
  }
}

const mapStateToProps = (state: GlobalState, ownProps: OwnProps): StateProps => {
  const day = Number(ownProps.day);
  let entries = state.registration.entries;
  if (day > 0) {
    entries = entries.filter(e => e.day === day);
  }

  return {
    inKg: state.meet.inKg,
    meetName: state.meet.name,
    meetDate: state.meet.date,
    formula: state.meet.formula,
    combineSleevesAndWraps: state.meet.combineSleevesAndWraps,
    lengthDays: state.meet.lengthDays,
    weightClassesKgMen: state.meet.weightClassesKgMen,
    weightClassesKgWomen: state.meet.weightClassesKgWomen,
    weightClassesKgMx: state.meet.weightClassesKgMx,
    entries: entries
  };
};

export default connect(
  mapStateToProps,
  null
)(ByPoints);
