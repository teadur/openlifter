// vim: set ts=2 sts=2 sw=2 et:
//
// Randomizes the Registration page, for debugging.

import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Button } from "react-bootstrap";

import { randomInt } from "./RandomizeHelpers";

import { newRegistration, deleteRegistration } from "../../actions/registrationActions";

const NonsenseFirstNames = [
  "Aragorn",
  "Arwen",
  "Aule",
  "Balin",
  "Beorn",
  "Beregond",
  "Bert",
  "Bifur",
  "Bilbo",
  "Bofur",
  "Bolg",
  "Bombur",
  "Boromir",
  "Bregalad",
  "Bullroarer",
  "Bungo",
  "Carc",
  "Celeborn",
  "Dain",
  "Denethor",
  "Dori",
  "Dwalin",
  "Elrohir",
  "Elrond",
  "Eomer",
  "Eowyn",
  "Este",
  "Faramir",
  "Fili",
  "Fredegar",
  "Frodo",
  "Galadriel",
  "Galion",
  "Gandalf",
  "Gimli",
  "Gloin",
  "Glorfindel",
  "Golfimbul",
  "Gollum",
  "Gothmog",
  "Grima",
  "Imrahil",
  "Kili",
  "Legolas",
  "Lorien",
  "Mandos",
  "Manwe",
  "Melkor",
  "Meriadoc",
  "Nessa",
  "Nienna",
  "Nori",
  "Oin",
  "Ori",
  "Orome",
  "Peregrin",
  "Pippin",
  "Radagast",
  "Roac",
  "Samwise",
  "Saruman",
  "Sauron",
  "Shelob",
  "Smaug",
  "Theoden",
  "Thorin",
  "Thranduil",
  "Tom",
  "Treebeard",
  "Tulkas",
  "Ulmo",
  "Vaire",
  "Vana",
  "Varda",
  "William",
  "Yavanna"
];

const NonsenseLastNames = [
  "Black",
  "Burbage",
  "Carrow",
  "Cattermole",
  "Chang",
  "Clearwater",
  "Crabbe",
  "Creevey",
  "Crouch",
  "Delacour",
  "Diggory",
  "Dumbledore",
  "Dursley",
  "Edgecombe",
  "Filch",
  "Flitwick",
  "Fudge",
  "Goyle",
  "Granger",
  "Grindelwald",
  "Hagrid",
  "Hufflepuff",
  "Kettleburn",
  "Lockhart",
  "Longbottom",
  "Lovegood",
  "Lupin",
  "Malfoy",
  "Marchbanks",
  "McGonagall",
  "McLaggen",
  "Moody",
  "Nott",
  "Ogden",
  "Ollivander",
  "Parkinson",
  "Pettigrew",
  "Peverell",
  "Pince",
  "Podmore",
  "Pomfrey",
  "Potter",
  "Quirrell",
  "Riddle",
  "Rookwood",
  "Rowle",
  "Runcorn",
  "Scrimgeour",
  "Shacklebolt",
  "Shunpike",
  "Sinistra",
  "Slughorn",
  "Slytherin",
  "Snape",
  "Spinnet",
  "Sprout",
  "Thicknesse",
  "Tanks",
  "Trelawney",
  "Twycross",
  "Umbridge",
  "Vance",
  "Voldemort",
  "Weasley",
  "Wood",
  "Yaxley",
  "Zabini"
];

class RandomizeRegistrationButton extends React.Component {
  constructor(props) {
    super(props);
    this.deleteExistingRegistrations = this.deleteExistingRegistrations.bind(this);
    this.generateEntries = this.generateEntries.bind(this);
    this.randomizeRegistration = this.randomizeRegistration.bind(this);
  }

  deleteExistingRegistrations() {
    const entryIds = this.props.registration.entries.map(e => e.id);
    for (let i = 0; i < entryIds.length; i++) {
      this.props.deleteRegistration(entryIds[i]);
    }
  }

  // Generate entries in a flight together, in case we want to give them
  // similar properties.
  generateEntries(day, platform, flight) {
    const numLifters = randomInt(6, 18);

    for (let i = 0; i < numLifters; i++) {
      // Set a nonsense Name.
      // ==========================================
      const firstName = NonsenseFirstNames[randomInt(0, NonsenseFirstNames.length - 1)];
      const lastName = NonsenseLastNames[randomInt(0, NonsenseLastNames.length - 1)];
      const name = firstName + " " + lastName;

      // Set a random Sex.
      // ==========================================
      const sex = "MF"[randomInt(0, 1)];

      // Generate random events, making most lifters SBD.
      // ==========================================
      let events = [];
      if (Math.random() < 0.5) {
        events.push("SBD");
      }
      if (Math.random() < 0.1) {
        events.push("BD");
      }
      if (Math.random() < 0.1) {
        events.push("S");
      }
      if (Math.random() < 0.1) {
        events.push("B");
      }
      if (Math.random() < 0.1) {
        events.push("D");
      }
      if (events.length === 0) {
        events.push("SBD");
      }

      // Generate random equipment, making most lifters SBD,
      // being careful that it matches their events.
      // ==========================================
      let hasSquat = false;
      for (let i = 0; i < events.length; i++) {
        if (events[i].includes("S")) {
          hasSquat = true;
          break;
        }
      }

      const equipmentSelect = Math.random();
      let equipment = "Sleeves";
      if (equipmentSelect < 0.7) {
        // Nothing, sleeves default case.
      } else if (equipmentSelect < 0.9) {
        if (hasSquat) {
          equipment = "Wraps";
        }
      } else if (equipmentSelect < 0.95) {
        equipment = "Single-ply";
      } else {
        equipment = "Multi-ply";
      }

      // File into random divisions.
      // ==========================================
      let divisions = [];
      if (this.props.meet.divisions.length > 0) {
        const divisionsUpperBound = Math.max(1, this.props.meet.divisions.length - 1);
        const numDivisions = randomInt(1, divisionsUpperBound);

        // List of remaining available divisions.
        let divchooser = this.props.meet.divisions.slice();

        for (let i = 0; i < numDivisions; i++) {
          const choice = randomInt(0, divchooser.length - 1);
          divisions.push(divchooser[choice]);

          // Delete the choice from the list of available divisions.
          divchooser.splice(choice, 1);
        }
      }

      this.props.newRegistration({
        day: day,
        platform: platform,
        flight: flight,
        name: name,
        sex: sex,
        events: events,
        equipment: equipment,
        divisions: divisions
      });
    }
  }

  randomizeRegistration() {
    const FLIGHTCHARS = "ABCDEFGHIJKLMNOP";

    this.deleteExistingRegistrations();
    for (let day = 1; day <= this.props.meet.lengthDays; day++) {
      const numPlatforms = this.props.meet.platformsOnDays[day - 1];
      for (let platform = 1; platform <= numPlatforms; platform++) {
        const numFlights = randomInt(1, 3);
        for (let flight = 0; flight < numFlights; flight++) {
          this.generateEntries(day, platform, FLIGHTCHARS[flight]);
        }
      }
    }
  }

  render() {
    return <Button onClick={this.randomizeRegistration}>Registration</Button>;
  }
}

const mapStateToProps = state => ({
  ...state
});

const mapDispatchToProps = dispatch => {
  return {
    newRegistration: obj => dispatch(newRegistration(obj)),
    deleteRegistration: entryId => dispatch(deleteRegistration(entryId))
  };
};

RandomizeRegistrationButton.propTypes = {
  meet: PropTypes.shape({
    lengthDays: PropTypes.number.isRequired,
    platformsOnDays: PropTypes.array.isRequired,
    divisions: PropTypes.array.isRequired
  }),
  registration: PropTypes.shape({
    entries: PropTypes.array.isRequired
  }),
  newRegistration: PropTypes.func.isRequired,
  deleteRegistration: PropTypes.func.isRequired
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RandomizeRegistrationButton);
