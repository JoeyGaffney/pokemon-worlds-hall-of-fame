let appearances = [];

const resultsElement = document.getElementById("results");
const searchElement = document.getElementById("search");
const yearFilter = document.getElementById("yearFilter");
const divisionFilter = document.getElementById("divisionFilter");
const countryFilter = document.getElementById("countryFilter");
const resultCount = document.getElementById("resultCount");
const landingElement =
    document.getElementById("landing");

const resultsSection =
    document.getElementById("resultsSection");

const clearFiltersButton =
    document.getElementById("clearFilters");

document
    .querySelectorAll(".suggestion-card")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                /*
                 * Start with clean filters.
                 */

                searchElement.value = "";
                yearFilter.value = "";
                divisionFilter.value = "";
                countryFilter.value = "";

                activePreset = "";


                /*
                 * Preset button
                 */

                if (button.dataset.preset) {

                    activePreset =
                        button.dataset.preset;

                }


                /*
                 * Year button
                 */

                if (button.dataset.year) {

                    yearFilter.value =
                        button.dataset.year;

                }


                /*
                 * Division button
                 */

                if (button.dataset.division) {

                    divisionFilter.value =
                        button.dataset.division;

                }


                renderResults();

            }
        );

    });

clearFiltersButton.addEventListener(
    "click",
    () => {

        searchElement.value = "";
        yearFilter.value = "";
        divisionFilter.value = "";
        countryFilter.value = "";

        activePreset = "";

        renderResults();

        /*
         * Remove query parameters from the URL.
         */
        window.history.replaceState(
            {},
            "",
            "index.html"
        );

    }
);

let activePreset = "";

async function loadData() {

    try {

        const response = await fetch("data/appearances.json");

        if (!response.ok) {
            throw new Error("Could not load appearances.json");
        }

        appearances = await response.json();

        populateYearFilter();
        populateCountryFilter();

        restoreFiltersFromURL();

        renderResults();

    } catch (error) {

        console.error(error);

        resultsElement.innerHTML = `
            <tr>
                <td colspan="5">
                    Error loading competitor data.
                </td>
            </tr>
        `;

    }

}


function populateYearFilter() {

    // Get all unique years from the JSON file
    const years = [
        ...new Set(
            appearances
                .map(record => record.year)
                .filter(year => year !== "" && year !== null && year !== undefined)
        )
    ];

    // Sort newest year first
    years.sort((a, b) => Number(b) - Number(a));

    years.forEach(year => {

        const option = document.createElement("option");

        option.value = String(year);
        option.textContent = String(year);

        yearFilter.appendChild(option);

    });

}


function populateCountryFilter() {

    const countries = [
        ...new Set(
            appearances
                .map(record => record.country)
                .filter(country => country)
        )
    ].sort();

    countries.forEach(country => {

        const option = document.createElement("option");

        option.value = country;
        option.textContent = country;

        countryFilter.appendChild(option);

    });

}


function renderResults() {

    const searchTerm =
        searchElement.value.trim().toLowerCase();

    const selectedYear =
        yearFilter.value;

    const selectedDivision =
        divisionFilter.value;

    const selectedCountry =
        countryFilter.value;

    const hasFilters =
        searchTerm ||
        selectedYear ||
        selectedDivision ||
        selectedCountry ||
        activePreset;
    if (!hasFilters) {

        landingElement.hidden = false;
        resultsSection.hidden = true;

        return;
    }

    const appearanceCounts =
        new Map();


    appearances.forEach(record => {

        if (!record.player_id) {
            return;
        }


        if (!appearanceCounts.has(record.player_id)) {

            appearanceCounts.set(
                record.player_id,
                new Set()
            );

        }


        appearanceCounts
            .get(record.player_id)
            .add(record.year);

    });
    
    const filtered = appearances.filter(record => {

        const name =
            String(record.name || "").toLowerCase();

        const country =
            String(record.country || "");

        const division =
            String(record.division || "");

        const year =
            String(record.year || "");


        const matchesSearch =
            !searchTerm ||
            name.includes(searchTerm);

        const matchesYear =
            !selectedYear ||
            year === selectedYear;

        const matchesDivision =
            !selectedDivision ||
            division === selectedDivision;

        const matchesCountry =
            !selectedCountry ||
            country === selectedCountry;
        const placement =
            getPlacementNumber(record.placement);


        let matchesPreset = true;


        if (activePreset === "champions") {

            matchesPreset =
                placement === 1;

        }
        

        if (activePreset === "finalists") {

            matchesPreset =
                placement !== null &&
                placement <= 2;

        }


        if (activePreset === "top8") {

            matchesPreset =
                placement !== null &&
                placement <= 8;

        }

        if (activePreset === "returning") {

            const years =
                appearanceCounts.get(
                    record.player_id
                );

            matchesPreset =
                years &&
                years.size >= 2;

        }

        return (
            matchesSearch &&
            matchesYear &&
            matchesDivision &&
            matchesCountry &&
            matchesPreset
        );

    });


    filtered.sort((a, b) => {

        // Newest year first
        const yearDifference =
            Number(b.year) - Number(a.year);

        if (yearDifference !== 0) {
            return yearDifference;
        }

        // Division order
        const divisionOrder = {
            "Juniors": 1,
            "Seniors": 2,
            "Masters": 3
        };

        const divisionDifference =
            (divisionOrder[a.division] || 99) -
            (divisionOrder[b.division] || 99);

        if (divisionDifference !== 0) {
            return divisionDifference;
        }

        // Placement
        return Number(a.placement) - Number(b.placement);

    });


    resultsElement.innerHTML = "";


    filtered.forEach(record => {

        const row = document.createElement("tr");

        const formattedName =
            formatPlayerName(record.name);

        let playerName =
            escapeHTML(formattedName);

        if (record.player_id) {

            const profileParams = new URLSearchParams();

            profileParams.set(
                "id",
                record.player_id
            );

            if (searchElement.value.trim()) {
                profileParams.set(
                    "search",
                    searchElement.value.trim()
                );
            }

            if (yearFilter.value) {
                profileParams.set(
                    "year",
                    yearFilter.value
                );
            }

            if (divisionFilter.value) {
                profileParams.set(
                    "division",
                    divisionFilter.value
                );
            }

            if (countryFilter.value) {
                profileParams.set(
                    "country",
                    countryFilter.value
                );
            }

            playerName = `
                <a
                    class="player-link"
                    href="player.html?${profileParams.toString()}"
                >
                    ${escapeHTML(formattedName)}
                </a>
            `;
        }

        row.innerHTML = `
            <td>${escapeHTML(record.placement)}</td>
            <td>${playerName}</td>
            <td>${escapeHTML(record.country)}</td>
            <td>${escapeHTML(record.division)}</td>
            <td>${escapeHTML(record.year)}</td>
        `;

        resultsElement.appendChild(row);

    });

    landingElement.hidden = true;
    resultsSection.hidden = false;
    
    resultCount.textContent =
        `${filtered.length} competitor records`;

}


function escapeHTML(value) {

    const element = document.createElement("div");

    element.textContent =
        value === null || value === undefined
            ? ""
            : value;

    return element.innerHTML;

}

function formatPlayerName(name) {

    const text = String(name || "").trim();

    if (!text) {
        return "";
    }

    /*
     * If the name already contains both uppercase
     * and lowercase letters, assume the capitalization
     * was intentionally entered and leave it alone.
     */
    const hasUppercase = /[A-Z]/.test(text);
    const hasLowercase = /[a-z]/.test(text);

    if (hasUppercase && hasLowercase) {
        return text;
    }


    /*
     * Otherwise convert ALL CAPS or all lowercase
     * names into title case.
     */
    return text
        .toLowerCase()
        .replace(
            /(^|[\s\-'])\p{L}/gu,
            character => character.toUpperCase()
        );
}

function restoreFiltersFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const savedSearch =
        params.get("search");

    const savedYear =
        params.get("year");

    const savedDivision =
        params.get("division");

    const savedCountry =
        params.get("country");


    if (savedSearch) {
        searchElement.value =
            savedSearch;
    }


    /*
     * Year and country options are generated
     * dynamically, so this function must run
     * AFTER populateYearFilter() and
     * populateCountryFilter().
     */

    if (
        savedYear &&
        [...yearFilter.options].some(
            option =>
                option.value === savedYear
        )
    ) {

        yearFilter.value =
            savedYear;

    }


    if (
        savedDivision &&
        [...divisionFilter.options].some(
            option =>
                option.value === savedDivision
        )
    ) {

        divisionFilter.value =
            savedDivision;

    }


    if (
        savedCountry &&
        [...countryFilter.options].some(
            option =>
                option.value === savedCountry
        )
    ) {

        countryFilter.value =
            savedCountry;

    }

}

function getPlacementNumber(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }


    const text =
        String(value).trim();


    const match =
        text.match(
            /^T?(\d+)(?:st|nd|rd|th)?$/i
        );


    if (!match) {
        return null;
    }


    return Number(match[1]);
}

// Filters

searchElement.addEventListener(
    "input",
    renderResults
);

yearFilter.addEventListener(
    "change",
    renderResults
);

divisionFilter.addEventListener(
    "change",
    renderResults
);

countryFilter.addEventListener(
    "change",
    renderResults
);


// Start the website

loadData();
