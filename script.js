"use strict";

const stations = [
    {
        name: "Vividh Bharati Delhi",
        stream: "https://air.pc.cdn.bitgravity.com/air/live/pbaudio001/chunklist.m3u8",
        state: "Delhi",
        codec: "HLS / Internet Radio",
        bitrate: "Variable",
        source: "Our Tested Stations"
    },
    {
        name: "FM Gold Delhi",
        stream: "https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio005/hlspbaudio005_Auto.m3u8",
        state: "Delhi",
        codec: "HLS / Internet Radio",
        bitrate: "Variable",
        source: "Our Tested Stations"
    },
    {
        name: "FM Rainbow Delhi",
        stream: "https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio004/hlspbaudio004_Auto.m3u8",
        state: "Delhi",
        codec: "HLS / Internet Radio",
        bitrate: "Variable",
        source: "Our Tested Stations"
    },
    {
        name: "Indraprastha Delhi",
        stream: "https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio006/hlspbaudio006_Auto.m3u8",
        state: "Delhi",
        codec: "HLS / Internet Radio",
        bitrate: "Variable",
        source: "Our Tested Stations"
    },
    {
        name: "VBS Delhi",
        stream: "https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio238/hlspbaudio238_Auto.m3u8",
        state: "Delhi",
        codec: "HLS / Internet Radio",
        bitrate: "Variable",
        source: "Our Tested Stations"
    },
    {
        name: "BIG FM",
        stream: "https://stream-14.zeno.fm/r2gn1pgm4qruv",
        state: "India",
        codec: "Internet Radio",
        bitrate: "Variable",
        source: "Our Tested Stations"
    }
];

const stationCombo = document.getElementById("stationCombo");
const stationOptions = document.getElementById("stationOptions");
const playButton = document.getElementById("playButton");
const stopButton = document.getElementById("stopButton");
const muteButton = document.getElementById("muteButton");
const volumeControl = document.getElementById("volumeControl");

const radioPlayer = document.getElementById("radioPlayer");
const status = document.getElementById("status");

const searchResults = document.getElementById("searchResults");

const favouriteButton =
    document.getElementById("favouriteButton");
const favouritePanel =
    document.getElementById("favouritePanel");
const favourites = document.getElementById("favourites");
const addFavouriteButton =
    document.getElementById("addFavouriteButton");
const removeFavouriteButton =
    document.getElementById("removeFavouriteButton");
const closeFavouriteButton =
    document.getElementById("closeFavouriteButton");

const stationInfo = document.getElementById("stationInfo");
const helpButton = document.getElementById("helpButton");
const helpText = document.getElementById("helpText");


let hls = null;
let selectedStation = null;
let searchStations = [];
let favouriteStations = [];
let connectionTimer = null;
let activeStation = null;
let streamGeneration = 0;


let highlightedKnownIndex = -1;

function getKnownStationMatches() {
    const term = stationCombo.value.trim().toLowerCase();

    if (!term) {
        return stations;
    }

    return stations.filter(function(station) {
        return station.name.toLowerCase().includes(term);
    });
}

function closeStationOptions() {
    stationOptions.hidden = true;
    stationCombo.setAttribute("aria-expanded", "false");
    stationCombo.removeAttribute("aria-activedescendant");
    highlightedKnownIndex = -1;
}

function openStationOptions() {
    const matches = getKnownStationMatches();

    stationOptions.innerHTML = "";
    highlightedKnownIndex = -1;

    matches.forEach(function(station, index) {
        const option = document.createElement("div");

        option.id = "known-station-" + index;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");
        option.tabIndex = -1;
        option.textContent = station.name;

        option.addEventListener("mousedown", function(event) {
            event.preventDefault();
        });

        option.addEventListener("click", function() {
            selectKnownStation(station);
        });

        stationOptions.appendChild(option);
    });

    if (matches.length) {
        stationOptions.hidden = false;
        stationCombo.setAttribute("aria-expanded", "true");
    } else {
        closeStationOptions();
    }
}

function selectKnownStation(station) {
    stopCurrentStream();
    selectedStation = station;
    stationCombo.value = station.name;
    closeStationOptions();

    showStationInfo(selectedStation);

    status.textContent =
        selectedStation.name +
        " selected. Press Play to start.";
}

function highlightKnownStation(index) {
    const options = stationOptions.querySelectorAll('[role="option"]');

    if (!options.length) {
        return;
    }

    if (index < 0) {
        index = options.length - 1;
    }

    if (index >= options.length) {
        index = 0;
    }

    options.forEach(function(option, i) {
        const selected = i === index;
        option.setAttribute("aria-selected", String(selected));

        if (selected) {
            option.scrollIntoView({ block: "nearest" });
        }
    });

    highlightedKnownIndex = index;
    stationCombo.setAttribute(
        "aria-activedescendant",
        options[index].id
    );
}

function selectExactKnownStation() {
    const value = stationCombo.value.trim().toLowerCase();

    if (!value) {
        return false;
    }

    const match = stations.find(function(station) {
        return station.name.toLowerCase() === value;
    });

    if (match) {
        selectKnownStation(match);
        return true;
    }

    return false;
}

stationCombo.addEventListener("focus", function() {
    openStationOptions();
});

stationCombo.addEventListener("input", function() {
    openStationOptions();
});

stationCombo.addEventListener("keydown", function(event) {
   if (event.key === "ArrowDown") {
        event.preventDefault();

        if (stationOptions.hidden) {
            openStationOptions();
        }

        highlightKnownStation(highlightedKnownIndex + 1);
        return;
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();

        if (stationOptions.hidden) {
            openStationOptions();
        }

        highlightKnownStation(highlightedKnownIndex - 1);
        return;
    }

    if (event.key === "Escape") {
        if (!stationOptions.hidden) {
            event.preventDefault();
            closeStationOptions();
        }
        return;
    }

    if (event.key === "Enter") {
        event.preventDefault();
        const options = stationOptions.querySelectorAll('[role="option"]');

        if (
            highlightedKnownIndex >= 0 &&
            highlightedKnownIndex < options.length
        ) {
            const matches = getKnownStationMatches();
            selectKnownStation(matches[highlightedKnownIndex]);
            return;
        }

        if (selectExactKnownStation()) {
            return;
        }

        searchRadioBrowser();
    }
});

stationCombo.addEventListener("blur", function() {
    setTimeout(function() {
        closeStationOptions();
    }, 150);
});

function showStationInfo(station) {
   if (!station) {
        stationInfo.textContent = "No station selected.";
        return;
    }

    stationInfo.innerHTML =
        "<p><strong>Station:</strong> " +
        escapeHtml(station.name) +
        "</p>" +

        "<p><strong>Location:</strong> " +
        escapeHtml(station.state || "Not available") +
        "</p>" +

        "<p><strong>Codec:</strong> " +
        escapeHtml(station.codec || "Not available") +
        "</p>" +

        "<p><strong>Bitrate:</strong> " +
        escapeHtml(station.bitrate || "Not available") +
        "</p>" +

        "<p><strong>Source:</strong> " +
        escapeHtml(station.source || "Not available") +
        "</p>";
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function stopCurrentStream() {
   streamGeneration++;

    clearTimeout(connectionTimer);
    connectionTimer = null;

    if (hls) {
        hls.destroy();
        hls = null;
    }

    radioPlayer.pause();
    radioPlayer.removeAttribute("src");
    radioPlayer.load();
    activeStation = null;

    playButton.textContent = "Play";
}

function startRadio() {
   if (!selectedStation || !selectedStation.stream) {
       status.textContent =
            "Please select a station first.";

        return;
    }

    stopCurrentStream();
    activeStation = selectedStation;
    const myGeneration = streamGeneration;

    const stationName = selectedStation.name;

    status.textContent =
        stationName + " is connecting...";

    connectionTimer = setTimeout(function() {
       if (radioPlayer.paused) {
           status.textContent =
                stationName +
                " is taking longer to respond. Still trying...";
        }

    }, 8000);

    const stream = selectedStation.stream;

    if (stream.includes(".m3u8")) {
       if (window.Hls && Hls.isSupported()) {
           hls = new Hls();

            hls.loadSource(stream);
            hls.attachMedia(radioPlayer);

            hls.on(Hls.Events.MANIFEST_PARSED, function() {
               if (myGeneration !== streamGeneration || activeStation !== selectedStation) return;

                radioPlayer.play().catch(function() {
                   if (myGeneration !== streamGeneration || activeStation !== selectedStation) return;

                    status.textContent =
                        stationName +
                        " could not be started.";
                });
            });

            hls.on(Hls.Events.ERROR, function(event, data) {
               if (data.fatal) {
                   status.textContent =
                        stationName +
                        " is temporarily unavailable.";

                    if (hls) {
                        hls.destroy();
                        hls = null;
                    }

                    playButton.textContent = "Play";
                }
            });

        } else if (
            radioPlayer.canPlayType(
                "application/vnd.apple.mpegurl"
            )
        ) {
           radioPlayer.src = stream;

            radioPlayer.play().catch(function() {
               status.textContent =
                    stationName +
                    " could not be started.";
            });

        } else {
           status.textContent =
                stationName +
                " requires HLS support in this browser.";

            playButton.textContent = "Play";
        }

    } else {
       radioPlayer.src = stream;

        radioPlayer.play().catch(function() {
           status.textContent =
                stationName +
                " could not be started.";
        });
    }
}

playButton.addEventListener("click", function() {
   if (!selectedStation || !selectedStation.stream) {
       status.textContent =
            "Please select a station first.";

        return;
    }

    // Play must always start the currently selected station.
    // Never resume a stream belonging to an older selection.
    if (activeStation !== selectedStation) {
        startRadio();
        return;
    }

    if (!radioPlayer.src && !hls) {
        startRadio();
        return;
    }

    if (radioPlayer.paused) {
       radioPlayer.play().catch(function() {
           status.textContent =
                selectedStation.name +
                " could not be started.";
        });

    } else {
       radioPlayer.pause();

        playButton.textContent = "Play";

        status.textContent =
            selectedStation.name + " paused.";
    }
});

stopButton.addEventListener("click", function() {
   stopCurrentStream();

    if (selectedStation) {
       status.textContent =
            selectedStation.name + " stopped.";

    } else {
       status.textContent = "Radio stopped.";
    }
});

muteButton.addEventListener("click", function() {
   radioPlayer.muted = !radioPlayer.muted;

    if (radioPlayer.muted) {
       muteButton.textContent = "Unmute";
        status.textContent = "Muted.";

    } else {
       muteButton.textContent = "Mute";
        status.textContent = "Unmuted.";
    }
});


volumeControl.addEventListener("input", function() {
   const volume = Number(volumeControl.value);

    radioPlayer.volume = volume / 100;

    localStorage.setItem("radioVolume", volume);

    if (volume === 0) {
       radioPlayer.muted = true;
        muteButton.textContent = "Unmute";

        status.textContent =
            "Muted. Volume 0 percent";

    } else {
       radioPlayer.muted = false;
        muteButton.textContent = "Mute";

        status.textContent =
            "Volume " + volume + " percent";
    }
});

const savedVolume = localStorage.getItem("radioVolume");

if (savedVolume !== null) {
   const volume = Number(savedVolume);

    if (!Number.isNaN(volume)) {
       volumeControl.value = volume;
        radioPlayer.volume = volume / 100;

        if (volume === 0) {
           radioPlayer.muted = true;
            muteButton.textContent = "Unmute";
        }
    }
}

radioPlayer.addEventListener("playing", function() {
   clearTimeout(connectionTimer);
    connectionTimer = null;

    playButton.textContent = "Pause";

    if (activeStation) {
       status.textContent =
            activeStation.name + " is playing.";
    }
});

radioPlayer.addEventListener("pause", function() {
   playButton.textContent = "Play";
});

radioPlayer.addEventListener("waiting", function() {
   if (activeStation) {
       status.textContent =
            activeStation.name +
            " is buffering...";
    }
});

radioPlayer.addEventListener("error", function() {
   if (activeStation) {
       status.textContent =
            activeStation.name +
            " is temporarily unavailable.";

    }
});

async function searchRadioBrowser() {
   const name = stationCombo.value.trim();

    if (!name) {
       searchResults.textContent =
            "Please enter a station name.";

        return;
    }

    searchResults.textContent =
        "Searching for stations...";

    try {
       /*
         * Radio Browser's name search is substring-based when
         * nameExact=false. We explicitly set that here so that a
         * short search such as "mirchi" can find "Radio Mirchi".
         *
         * We first search India. If that gives no result, we repeat
         * the same partial-name search without the country filter.
         * This avoids requiring the user to type the complete station
         * name while still keeping the results relevant.
         */
        async function fetchStations(countryOnly) {
           let url =
                "https://de1.api.radio-browser.info/json/stations/search" +
                "?name=" + encodeURIComponent(name) +
                "&nameExact=false" +
                "&hidebroken=true" +
                "&order=votes" +
                "&limit=20";

            if (countryOnly) {
                url += "&countrycode=IN";
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Search failed");
            }

            return await response.json();
        }

        let results = await fetchStations(true);

        if (!results.length) {
            results = await fetchStations(false);
        }

        /*
         * Keep only stations whose name actually contains the
         * user's search text. This makes partial-name searching
         * predictable and avoids unrelated results.
         */
        const searchTerm = name.toLowerCase();

        results = results.filter(function(station) {
            const stationName =
                String(station.name || "").toLowerCase();

            return stationName.includes(searchTerm);
        });

        searchStations = results;

        displaySearchResults(results);

    } catch (error) {
       searchResults.textContent =
            "The station search could not be completed.";
    }
}


function displaySearchResults(results) {
   searchResults.innerHTML = "";

    if (!results.length) {
       searchResults.textContent =
            "No stations were found.";

        return;
    }

    const heading = document.createElement("p");

    heading.textContent =
        results.length +
        " station result(s) found. Select a station to use it.";

    searchResults.appendChild(heading);

    results.forEach(function(station, index) {
       const button = document.createElement("button");

        button.type = "button";
        button.className = "result-button";

        button.textContent =
            station.name || "Unnamed station";

        button.addEventListener("click", function() {
           const stream =
                station.url_resolved || station.url;

            if (!stream) {
               status.textContent =
                    "This station has no usable stream address.";

                return;
            }

            stopCurrentStream();

            selectedStation = {
               name: station.name || "Unnamed station",
                stream: stream,
                state: station.state || "India",
                codec: station.codec || "Not available",
                bitrate: station.bitrate
                    ? station.bitrate + " kbps"
                    : "Not available",
                source: "Radio Browser",
                uuid: station.stationuuid || ""
            };

            stationCombo.value = station.name || "";

            showStationInfo(selectedStation);

            status.textContent =
                selectedStation.name +
                " selected from Radio Browser. Press Play to start.";
        });

        searchResults.appendChild(button);
    });
}

function openFavouritePanel() {
    favouritePanel.hidden = false;
    favouriteButton.setAttribute("aria-expanded", "true");
    status.textContent = "Favourite Stations opened.";
    favouritePanel.focus();
}

function closeFavouritePanel() {
    favouritePanel.hidden = true;
    favouriteButton.setAttribute("aria-expanded", "false");
    status.textContent = "Favourite Stations closed.";
    favouriteButton.focus();
}

favouriteButton.addEventListener("click", function() {
    if (favouritePanel.hidden) {
        openFavouritePanel();
    } else {
        closeFavouritePanel();
    }
});

closeFavouriteButton.addEventListener("click", function() {
    closeFavouritePanel();
});

helpButton.addEventListener("click", function() {
    const isHidden = helpText.hidden;
    helpText.hidden = !isHidden;
    helpButton.setAttribute("aria-expanded", String(isHidden));

    if (isHidden) {
        helpText.focus();
    } else {
        helpButton.focus();
    }
});

function loadFavourites() {
   try {
       const saved =
            localStorage.getItem("radioFavourites");

        favouriteStations =
            saved ? JSON.parse(saved) : [];

    } catch (error) {
       favouriteStations = [];
    }

    displayFavourites();
}

function saveFavourites() {
   localStorage.setItem(
        "radioFavourites",
        JSON.stringify(favouriteStations)
    );
}

function displayFavourites() {
   favourites.innerHTML = "";

    const emptyOption = document.createElement("option");

    emptyOption.value = "";
    emptyOption.textContent =
        favouriteStations.length
            ? "-- Select a favourite --"
            : "-- No favourites saved --";

    favourites.appendChild(emptyOption);

    favouriteStations.forEach(function(station, index) {
       const option = document.createElement("option");

        option.value = index;
        option.textContent = station.name;

        favourites.appendChild(option);
    });
}

addFavouriteButton.addEventListener(
    "click",
    function() {
       if (!selectedStation) {
            status.textContent =
                "Please select a station first.";
            return;
        }

        const exists =
            favouriteStations.some(function(station) {
               return station.stream === selectedStation.stream;
            });

        if (exists) {
            status.textContent =
                selectedStation.name +
                " is already in Favourites.";
            return;
        }

        favouriteStations.push({
            name: selectedStation.name,
            stream: selectedStation.stream,
            state: selectedStation.state || "",
            codec: selectedStation.codec || "",
            bitrate: selectedStation.bitrate || "",
            source: selectedStation.source || "",
            uuid: selectedStation.uuid || ""
        });

        saveFavourites();
        displayFavourites();

        status.textContent =
            selectedStation.name +
            " added to Favourites.";
    }
);

favourites.addEventListener("change", function() {
    const value = favourites.value;

    if (value === "") {
        return;
    }
    // Selecting a favourite is also a station change.
    stopCurrentStream();
    selectedStation =
        favouriteStations[Number(value)];

    showStationInfo(selectedStation);

    status.textContent =
        selectedStation.name +
        " selected from Favourites. Press Play to start.";
});

removeFavouriteButton.addEventListener(
    "click",
    function() {
       const value = favourites.value;

        if (value === "") {
            status.textContent =
                "Please select a favourite to remove.";
            return;
        }

        const removed =
            favouriteStations.splice(
                Number(value),
                1
            )[0];

        saveFavourites();
        displayFavourites();

        status.textContent =
            removed.name +
            " removed from Favourites.";
    }
);

loadFavourites();

radioPlayer.volume =
    Number(volumeControl.value) / 100;