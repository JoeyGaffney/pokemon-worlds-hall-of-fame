let appearances = [];

const resultsElement = document.getElementById("results");
const searchElement = document.getElementById("search");
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

        populateCountryFilter();

        renderResults();

    } catch (error) {

        console.error(error);

        resultsElement.innerHTML = `
            <tr>
                <td colspan="6">
                    Error loading competitor data.
                </td>
            </tr>
        `;

    }

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


        const matchesSearch =
            !searchTerm ||
            name.includes(searchTerm);

        const matchesDivision =
            !selectedDivision ||
            division === selectedDivision;

        const matchesCountry =
            !selectedCountry ||
            country === selectedCountry;


        return (
            matchesSearch &&
            matchesDivision &&
            matchesCountry
        );

    });


    filtered.sort((a, b) => {

        // First sort divisions
        const divisionOrder = {
            "Juniors": 1,
            "Seniors": 2,
            "Masters": 3
        };

        const divisionDifference =
            divisionOrder[a.division] -
            divisionOrder[b.division];

        if (divisionDifference !== 0) {
            return divisionDifference;
        }

        // Then placement
        return Number(a.placement) - Number(b.placement);

    });


    resultsElement.innerHTML = "";


    filtered.forEach(record => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(record.placement)}</td>
            <td>${escapeHTML(record.name)}</td>
            <td>${escapeHTML(record.country)}</td>
            <td>${escapeHTML(record.division)}</td>
            <td>${escapeHTML(record.year)}</td>
            <td>${escapeHTML(record.qual)}</td>
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


searchElement.addEventListener(
    "input",
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


loadData();
