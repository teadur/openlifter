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

// The left panel on the lifting page, showing information about the current lifter
// and helpful information for the loading crew.

import React from "react";
import { connect } from "react-redux";

import { selectPlatesKg, makeLoadingRelative } from "../../logic/barLoad";
import { liftToAttemptFieldName } from "../../logic/entry";

import BarLoad from "./BarLoad";

import styles from "./LeftPanel.module.scss";

import type { Entry, LoadedPlate, PlatePairCount } from "../../types/dataTypes";
import type { GlobalState, LiftingState, RegistrationState } from "../../types/stateTypes";

interface OwnProps {
  attemptOneIndexed: number;
  orderedEntries: Array<Entry>;
  currentEntryId?: number;
  nextEntryId?: number;
  nextAttemptOneIndexed?: number;
}

interface StateProps {
  inKg: boolean;
  barAndCollarsWeightKg: number;
  platePairCounts: Array<PlatePairCount>;
  registration: RegistrationState;
  lifting: LiftingState;
}

type Props = OwnProps & StateProps;

interface BarLoadOptions {
  weightKg: number;
  weightLbs: number;
  rackInfo: string;
}

class LeftPanel extends React.Component<Props> {
  getBarLoadProps = (entryId?: number, attemptOneIndexed?: number): BarLoadOptions => {
    const lift = this.props.lifting.lift;
    const fieldKg = liftToAttemptFieldName(lift);

    // Defaults, in case of no lifter.
    if (entryId === null || entryId === undefined || attemptOneIndexed === null || attemptOneIndexed === undefined) {
      return { weightKg: 0, weightLbs: 0, rackInfo: "" };
    }

    const idx = this.props.registration.lookup[entryId];
    const entry = this.props.registration.entries[idx];

    const weightKg = entry[fieldKg][attemptOneIndexed - 1];
    const weightLbs = weightKg * 2.20462262;

    let rackInfo = "";
    if (lift === "S") rackInfo = entry.squatRackInfo;
    if (lift === "B") rackInfo = entry.benchRackInfo;

    return { weightKg, weightLbs, rackInfo };
  };

  render() {
    const current = this.getBarLoadProps(this.props.currentEntryId, this.props.attemptOneIndexed);
    const next = this.getBarLoadProps(this.props.nextEntryId, this.props.nextAttemptOneIndexed);

    // Show one decimal point, and omit it if possible.
    const weightKgText = current.weightKg.toFixed(1).replace(".0", "");
    const weightLbsText = current.weightLbs.toFixed(1).replace(".0", "");

    // Calculate both loadings.
    const currentLoading: Array<LoadedPlate> = selectPlatesKg(
      current.weightKg,
      this.props.barAndCollarsWeightKg,
      this.props.platePairCounts
    );
    const nextLoading: Array<LoadedPlate> = selectPlatesKg(
      next.weightKg,
      this.props.barAndCollarsWeightKg,
      this.props.platePairCounts
    );

    // Set the next loading relative to the current loading.
    if (next.weightKg >= current.weightKg) {
      makeLoadingRelative(nextLoading, currentLoading);
    }

    const nextBarLoad =
      next.weightKg === 0 ? null : (
        <div className={styles.loadingBar}>
          <div className={styles.nextText}>NEXT UP</div>
          <div className={styles.barArea}>
            <BarLoad key={String(next.weightKg) + next.rackInfo} loading={nextLoading} rackInfo={next.rackInfo} />
          </div>
        </div>
      );

    return (
      <div className={styles.container}>
        <div className={styles.activeCard}>
          <div className={styles.loadingBar}>
            <div className={styles.attemptText}>
              {weightKgText}kg / {weightLbsText}lb
            </div>
            <div className={styles.barArea}>
              <BarLoad
                key={String(current.weightKg) + current.rackInfo}
                loading={currentLoading}
                rackInfo={current.rackInfo}
              />
            </div>
          </div>
        </div>
        {nextBarLoad}
      </div>
    );
  }
}

const mapStateToProps = (state: GlobalState): StateProps => {
  return {
    inKg: state.meet.inKg,
    barAndCollarsWeightKg: state.meet.barAndCollarsWeightKg,
    platePairCounts: state.meet.platePairCounts,
    registration: state.registration,
    lifting: state.lifting
  };
};

export default connect(
  mapStateToProps,
  null
)(LeftPanel);
