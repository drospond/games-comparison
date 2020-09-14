import React, { Component } from "react";
import "./MainPage.scss";
import axios from "axios";
import TextInput from "../../components/TextInput/TextInput";
import Button from "../../components/Button/Button";
import GamesTable from "../../components/GamesTable/GamesTable";
import LoadingWheel from "../../components/LoadingWheel/LoadingWheel";

class MainPage extends Component {
  // Setup a state for tracking username text input field
  // Also initialize state for searching multiple users

  state = {
    additionalUsers: 2,
    usersToSearch: {},
    searchedUsers: "",
    userObject: false,
    sharedGamesState: false,
    isLoading: false,
    usersNotFound: false,
    foundUsers: false,
  };

  componentDidMount() {
    document.addEventListener("keyup", function (e) {
      //Make sure full class list is in conditional to get enter key to submit compare games
      if (e.target && e.target.className === "form-control rounded-left") {
        if (e.keyCode === 13) {
          e.preventDefault();
          document.getElementById("compare-games-button").click();
        }
      }
    });
  }

  addUser = (event) => {
    // We don't want to compare the games lists of more than 10 users
    if (this.state.additionalUsers < 10) {
      this.setState({
        additionalUsers: this.state.additionalUsers + 1,
      });
    }
    // The display warning about 10 user max will need to happen in render
  };

  compareGames = async (event) => {
    this.setState({
      isLoading: true,
      sharedGamesState: false,
      userObject: false,
      usersNotFound: false,
      foundUsers: false
    });

    const usersArray = Object.values(this.state.usersToSearch);
    // this.setState({ searchedUsers: usersArray });
 
    if (usersArray.length > 0) {
      await axios
        .post("/api/steamUsers", {
          usersArray,
        })
        .then((res) => {
          const searchedUsers = [];
          this.setState({foundUsers: res.data.foundUsers});
          res.data.foundUsers.forEach((user) => {
            if (user.vanityUrl === user.personaName) {
              searchedUsers.push(user.personaName);
            } else {
              searchedUsers.push(`${user.personaName} (${user.vanityUrl})`);
            }
          });
          this.setState({ searchedUsers: searchedUsers });
          if (res.data.userNotFound) {
            this.setState({ usersNotFound: res.data.notFoundUsers });
            if (
              this.state.searchedUsers.length ===
              this.state.usersNotFound.length
            ) {
              this.setState({ isLoading: false });
            }
          }
        });
      //adds users games to db
      await axios.post("/api/games", {
        usersArray,
      });
      //compares games
      await axios
        .post("/sharedGames", {
          usersArray,
        })
        .then((res) => {
          this.setState({ isLoading: false });
          this.setState({
            sharedGamesState: res.data.sharedGames,
          });
        })
        .catch((er) => {
          this.setState({ isLoading: false });
          console.log(er);
        });
    } else {
      // If the user didn't enter at least one user, then the loading wheel is turned off
      this.setState({ isLoading: false });
      
      // We discussed sending the user a warning to input at least one Vanity URL, but
      // we're sure users will understand that nothing will happen until they do that.
    }
  };

  // Deletes a user key:value pair from the usersToSearch state.
  // We separated this into it's own function originally because we used it in to places.
  // After some refactoring this is only used in one place now, in handleInputChange()
  deleteFromUsersToSearch = (name) => {
    let usersObject = { ...this.state.usersToSearch };
    delete usersObject[name];
    this.setState({
      usersToSearch: usersObject,
    });
  };

  handleInuptChange = (event) => {
    const { name, value } = event.target;
    if (value === "") {
      this.deleteFromUsersToSearch(name);
    } else {
      this.setState({
        usersToSearch: { ...this.state.usersToSearch, [name]: value },
      });
    }
  };

  deleteUserInputLine = (event) => {
    const { name } = event.target;

    let deletedRowIndexPosition = Number(name.slice(name.length - 1));
    // for loop for replacing the text of all input fields with the text of the following input field, starting with the deleted row
    for (
      let i = deletedRowIndexPosition;
      i < this.state.additionalUsers - 1;
      i++
    ) {
      let deletedInputField = document.getElementById(`user${i}`);
      let nextInputField = document.getElementById(`user${i + 1}`);
      deletedInputField.value = nextInputField.value;
    }

    let removeAUser = this.state.additionalUsers;
    removeAUser--;
    this.setState({ additionalUsers: removeAUser });

    let newUsersToSearch = {};
    for (let i = 0; i < this.state.additionalUsers - 1; i++) {
      let currentInputField = document.getElementById(`user${i}`);
      newUsersToSearch[`user${i}`] = currentInputField.value;
    }
    this.setState({ usersToSearch: newUsersToSearch });
  };

  render() {
    // Following code causes an additional username input field
    // to render for each time the add user button is clicked
    // TODO: Display a message once 10 username input fields are reached
    const userInputs = [];
    for (let i = 0; i < this.state.additionalUsers; i++) {
      userInputs.push(
        <TextInput
          index={i}
          placeholder="Steam Vanity URL"
          name={"user" + i}
          value={this.state.users}
          onChange={this.handleInuptChange}
          onClick={this.deleteUserInputLine}
        />
      );
    }

    return (
      <>
        <div className="container">
          <h4 id="headline">
            {" "}
            Compare your Steam games library to the libraries of 1 or more
            friends{" "}
          </h4>

          <div id="user-input-section">{userInputs}</div>

          <div className="row">
            <div className="col">
              <Button
                text="Compare Games"
                id="compare-games-button"
                onClick={this.compareGames}
                type="submit"
              />
            </div>

            <div className="col">
              <Button
                text="Add User"
                id="add-user-button"
                onClick={this.addUser}
              />
            </div>
          </div>

          {this.state.usersNotFound && (
            <h3 id="user-not-found-warning">{`These user(s) were not found: ${this.state.usersNotFound.join(
              ", "
            )}`}</h3>
          )}

          {this.state.isLoading && (
            <LoadingWheel isLoading={this.state.isLoading} />
          )}
          {this.state.sharedGamesState && (
            <GamesTable
              sharedGames={this.state.sharedGamesState}
              searchedUsers={this.state.searchedUsers}
              foundUsers={this.state.foundUsers}
            />
          )}
        </div>
        {/* <footer>
          {" "}
          Icons made by{" "}
          <a href="https://www.flaticon.com/authors/freepik" title="Freepik">
            Freepik
          </a>{" "}
          from{" "}
          <a href="https://www.flaticon.com/" title="Flaticon">
            {" "}
            www.flaticon.com
          </a>
        </footer> */}
      </>
    );
  }
}

export default MainPage;
