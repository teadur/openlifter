// vim: set ts=2 sts=2 sw=2 et:
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

import React from "react";
import { connect } from "react-redux";

import FormControl from "react-bootstrap/FormControl";

import { changeLanguage } from "../../actions/languageActions";
import { Language } from "../../types/dataTypes";
import { GlobalState } from "../../types/stateTypes";

import styles from "./LanguageSelector.module.scss";
import { Dispatch } from "redux";
import { FormControlTypeHack } from "../../types/utils";

interface StateProps {
  language: Language;
}

interface DispatchProps {
  changeLanguage: (event: React.FormEvent<FormControlTypeHack>) => any;
}

type Props = StateProps & DispatchProps;

// TODO: Can we get these from the i18n lib somehow?
const languageOptions = [
  <option key="en" value="en">
    English
  </option>,
  <option key="eo" value="eo">
    Esperanto
  </option>,
  <option key="hr" value="hr">
    Hrvatski
  </option>,
  <option key="lt" value="lt">
    Lietuvių
  </option>,
  <option key="nl" value="nl">
    Nederlands
  </option>,
  <option key="ru" value="ru">
    Русский
  </option>,
  <option key="tr" value="tr">
    Türkçe
  </option>,
  <option key="zh-Hans" value="zh-Hans">
    简体中文
  </option>
];

class LanguageSelector extends React.Component<Props> {
  render() {
    return (
      <FormControl
        as="select"
        defaultValue={this.props.language}
        onChange={this.props.changeLanguage}
        className="custom-select"
      >
        {languageOptions}
      </FormControl>
    );
  }
}

// Allows react component to subscribe to redux state updates
const mapStateToProps = (state: GlobalState): StateProps => ({
  language: state.language
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => {
  return {
    // TODO: Can we make this more type safe and avoid the cast?
    changeLanguage: (event: React.FormEvent<FormControlTypeHack>) =>
      dispatch(changeLanguage(event.currentTarget.value as Language))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LanguageSelector);
