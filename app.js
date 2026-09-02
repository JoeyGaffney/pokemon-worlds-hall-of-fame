let appearances = [];

const resultsElement = document.getElementById("results");
const searchElement = document.getElementById("search");
const yearFilter = document.getElementById("yearFilter");
const divisionFilter = document.getElementById("divisionFilter");
const countryFilter = document.getElementById("countryFilter");
const resultCount = document.getElementById("resultCount");


async function loadData() {

    try {

        const response = await fetch("data/appearances.json");

        if (!response.ok) {
            throw new Error("Could not load appearances.json");
        }

        appearances = await response.json();

        populateYearFilter();
        populateCountryFilter();

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


        return (
            matchesSearch &&
            matchesYear &&
            matchesDivision &&
            matchesCountry
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

        let playerName = escapeHTML(record.name);

        if (record.player_id) {
            playerName = `
                <a
                    class="player-link"
                    href="player.html?id=${encodeURIComponent(record.player_id)}"
                >
                    ${escapeHTML(record.name)}
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
