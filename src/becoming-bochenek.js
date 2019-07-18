import axios from "axios";
import MicroModal from "micromodal";

const apiUrl =
  "https://752ecxiu1i.execute-api.us-east-1.amazonaws.com/v1/guests";

async function getPeople() {
  const fetchPeoplePromise = new Promise((resolve, reject) => {
    axios
      .get(apiUrl)
      .then(response => {
        const guestList = {};
        const guests = response.data.Items;
        guests.forEach(guestEntry => {
          guestEntry["guest-names"].SS.forEach(name => {
            guestList[name] = {
              names: guestEntry["guest-names"].SS,
              id: guestEntry["guest-id"].S,
              maxPlates:
                parseInt(guestEntry["guest-count"].S, 10) +
                parseInt(guestEntry["kid-count"].S, 10)
            };
            if (guestEntry["rsvp"] !== undefined) {
              const rsvpInfo = {
                rsvp: guestEntry["rsvp"].BOOL,
                chiles: guestEntry["chile"].N,
                fowl: guestEntry["fowl"].N,
                kids: guestEntry["kids"].N
              };
              Object.assign(guestList[name], rsvpInfo);
            }
          });
        });

        console.log(guestList);

        resolve(guestList);
      })
      .catch(err => {
        reject(err);
      });
  });

  return fetchPeoplePromise;
}

function getSuggestionBox() {
  return document.querySelector(".suggestion-box");
}

function getNameErrorBox() {
  return document.querySelector(".rsvp-name.error");
}

function showNameError() {
  getNameErrorBox().style.visibility = "visible";
}

function hideNameError() {
  getNameErrorBox().style.visibility = "hidden";
}

function handleRsvp(guest) {
  const suggestionBox = getSuggestionBox();

  if (suggestionBox.querySelector(".error").textContent.length > 0) {
    showNameError();
    return;
  }

  const option = document.querySelector('input[name = "response"]:checked')
    .value;

  const rsvpDisplay = document.getElementsByClassName("rsvp-greeting");
  let guestString = "";
  if (guest.names.length === 1) {
    guestString = guest.names[0];
  } else {
    guest.names.forEach((name, i, nameArray) => {
      if (i === nameArray.length - 1) {
        if (nameArray.length > 2) {
          guestString += ",";
        }
        guestString += ` and `;
      } else if (i !== 0) {
        guestString += ", ";
      }
      guestString += guest.names[i];
    });
  }
  for (let i = 0; i < rsvpDisplay.length; i++) {
    rsvpDisplay[i].innerHTML = `Hi ${guestString}!`;
  }
  if (option === "not") {
    const notComingButton = document.getElementById("no-rsvp-confirm");
    notComingButton.onclick = function(e) {
      rejectRsvp(guest);
    };
    MicroModal.show("not-coming-modal");
  } else {
    const rsvpButton = document.getElementById("rsvp-confirm");
    rsvpButton.onclick = function(e) {
      confirmRsvp(guest);
    };
    MicroModal.show("rsvp-modal");
  }
}

async function confirmRsvp(guest) {
  const fowl = document.getElementById("hen").value;
  const chile = document.getElementById("chile").value;
  const kids = document.getElementById("kids").value;

  const totalPlates =
    parseInt(fowl, 10) + parseInt(chile, 10) + parseInt(kids, 10);
  if (totalPlates > guest.maxPlates) {
    document.querySelector(".rsvp-error").style.display = "block";
  } else {
    document.querySelector("#rsvp-modal .content").style.display = "none";
    document.querySelector("#rsvp-modal .lds-dual-ring").style.display =
      "inline-block";
    const confirmResponse = await sendPut({
      "guest-id": guest.id,
      rsvp: true,
      fowl: fowl,
      chile: chile,
      kids: kids,
      message: document.getElementById("rsvp-message").value
    });

    document.location = "thankyou.html";
  }
}

async function rejectRsvp(guest) {
  document.querySelector("#not-coming-modal .content").style.display = "none";
  document.querySelector("#not-coming-modal .lds-dual-ring").style.display =
    "inline-block";
  const rejectResponse = await sendPut({
    "guest-id": guest.id,
    rsvp: false,
    message: document.getElementById("no-rsvp-message").value
  });

  document.location = "regrets.html";
}

function sendPut(data) {
  const sendPutPromise = new Promise((resolve, reject) => {
    axios
      .put(apiUrl, data)
      .then(response => {
        resolve(response);
      })
      .catch(err => {
        reject(err);
      });
  });

  return sendPutPromise;
}

function init(guestList) {
  MicroModal.init({
    disableFocus: false,
    awaitCloseAnimation: false,
    debugMode: true
  });

  const input = document.getElementById("rsvp-input");
  input.value = "";
  const suggestionBox = getSuggestionBox();

  const submit = document.querySelector(".rsvp-submit-button");
  submit.onclick = function() {
    handleRsvp(guestList[input.suggestion]);
  };

  suggestionBox.onclick = function(event) {
    input.focus();
  };

  input.onkeyup = function(event) {
    suggestionBox.style.position = "absolute";
    suggestionBox.style.width = this.offsetWidth + "px";
    suggestionBox.style.height = this.offsetHeight + "px";
    suggestionBox.style.top = this.offsetTop + "px";
    suggestionBox.style.left = this.offsetLeft + "px";
    if (event.key === "Tab" || event.key === "Enter") {
      this.value = this.suggestion;
      handleRsvp(guestList[this.suggestion]);
      return;
    }

    let foundName = false;
    const typedLength = this.value.length;
    suggestionBox.querySelector(".error").textContent = "";

    if (typedLength === 0) {
      clearSuggestionBox();
      return;
    } else {
      const people = Object.keys(guestList);
      for (let i = 0; i < people.length; i++) {
        const name = people[i];
        const index = name.toLowerCase().indexOf(this.value.toLowerCase());
        if (index > -1) {
          this.suggestion = name;
          let suggestLeft = name.substr(0, index);
          let suggestionType = name.substr(index, typedLength);
          let suggestionRight = name.substring(index + typedLength);
          suggestionBox.querySelector(".left").textContent = suggestLeft;
          suggestionBox.querySelector(".typed").textContent = suggestionType;
          suggestionBox.querySelector(".right").textContent = suggestionRight;
          foundName = true;
          hideNameError();
          break;
        }
      }
    }

    if (!foundName) {
      clearSuggestionBox();
      suggestionBox.querySelector(".error").textContent = this.value;
      showNameError();
    }
  };
}

function clearSuggestionBox() {
  const suggestionBox = getSuggestionBox();
  suggestionBox.querySelector(".left").textContent = "";
  suggestionBox.querySelector(".typed").textContent = "";
  suggestionBox.querySelector(".right").textContent = "";
  suggestionBox.querySelector(".error").textContent = "";
}

getPeople().then(init);
