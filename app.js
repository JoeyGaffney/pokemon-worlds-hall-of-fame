let appearances = [];
let activePreset = "";

let playerCareerMap =
    new Map();


let sortColumn =
    "bestFinish";

let sortDirection =
    "asc";


/* =========================================================
   COLUMN DEFINITIONS
   ========================================================= */

const COLUMN_DEFINITIONS = [

    {
        key: "name",
        label: "Player Name",
        defaultVisible: true,
        defaultSort: "asc",
        locked: true
    },

    {
        key: "countries",
        label: "Country",
        defaultVisible: true,
        defaultSort: "asc"
    },

    {
        key: "divisions",
        label: "Divisions Competed",
        defaultVisible: true,
        defaultSort: "asc"
    },

    {
        key: "years",
        label: "Years Competed",
        defaultVisible: true,
        defaultSort: "desc"
    },

    {
        key: "bestFinish",
        label: "Best Finish",
        defaultVisible: true,
        defaultSort: "asc"
    },

    {
        key: "b3fs",
        label: "B3FS",
        defaultVisible: false,
        defaultSort: "asc"
    },

    {
        key: "top8s",
        label: "Top 8s",
        defaultVisible: false,
        defaultSort: "desc"
    },

    {
        key: "top32s",
        label: "Top 32s",
        defaultVisible: false,
        defaultSort: "desc"
    },

    {
        key: "streak",
        label: "Invite Streak",
        defaultVisible: false,
        defaultSort: "desc"
    }

];



/* =========================================================
   PAGE ELEMENTS
   ========================================================= */

const resultsElement =
    document.getElementById(
        "results"
    );

const resultsHeader =
    document.getElementById(
        "resultsHeader"
    );

const searchElement =
    document.getElementById(
        "search"
    );

const yearFilter =
    document.getElementById(
        "yearFilter"
    );

const divisionFilter =
    document.getElementById(
        "divisionFilter"
    );

const countryFilter =
    document.getElementById(
        "countryFilter"
    );

const badgeFiltersElement =
    document.getElementById(
        "badgeFilters"
    );

const columnFiltersElement =
    document.getElementById(
        "columnFilters"
    );

const resultCount =
    document.getElementById(
        "resultCount"
    );

const landingElement =
    document.getElementById(
        "landing"
    );

const resultsSection =
    document.getElementById(
        "resultsSection"
    );

const clearFiltersButton =
    document.getElementById(
        "clearFilters"
    );

const advancedFiltersButton =
    document.getElementById(
        "advancedFiltersButton"
    );

const advancedFilters =
    document.getElementById(
        "advancedFilters"
    );



/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadData() {

    try {

        const response =
            await fetch(
                "data/appearances.json"
            );


        if (!response.ok) {

            throw new Error(
                "Could not load appearances.json"
            );

        }


        appearances =
            await response.json();


        buildPlayerCareerMap();

        populateYearFilter();

        populateCountryFilter();

        populateBadgeFilters();

        populateColumnFilters();

        restoreFiltersFromURL();

        ensureValidSortColumn();

        renderResults();


    } catch (error) {

        console.error(error);


        landingElement.hidden =
            true;

        resultsSection.hidden =
            false;


        resultsElement.innerHTML = `
            <tr>
                <td>
                    Error loading competitor data.
                </td>
            </tr>
        `;

    }

}



/* =========================================================
   CAREER MAP
   ========================================================= */

function buildPlayerCareerMap() {

    playerCareerMap =
        new Map();


    appearances.forEach(
        record => {

            const key =
                getPlayerKey(
                    record
                );


            if (
                !playerCareerMap.has(
                    key
                )
            ) {

                playerCareerMap.set(
                    key,
                    []
                );

            }


            playerCareerMap
                .get(key)
                .push(record);

        }
    );

}



/* =========================================================
   FILTER OPTIONS
   ========================================================= */

function populateYearFilter() {

    const years = [
        ...new Set(
            appearances
                .map(record =>
                    Number(record.year)
                )
                .filter(year =>
                    !isNaN(year)
                )
        )
    ].sort(
        (a, b) =>
            b - a
    );


    years.forEach(
        year => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(year);

            option.textContent =
                String(year);


            yearFilter.appendChild(
                option
            );

        }
    );

}



function populateCountryFilter() {

    const countries = [
        ...new Set(
            appearances
                .map(record =>
                    String(
                        record.country ||
                        ""
                    ).trim()
                )
                .filter(Boolean)
        )
    ].sort(
        (a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    sensitivity:
                        "base"
                }
            )
    );


    countries.forEach(
        country => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                country;

            option.textContent =
                country;


            countryFilter.appendChild(
                option
            );

        }
    );

}



/* =========================================================
   BADGE FILTER OPTIONS
   ========================================================= */

function populateBadgeFilters() {

    const badgeCatalog =
        new Map();


    playerCareerMap.forEach(
        records => {

            const badges =
                calculatePlayerBadges(
                    records
                );


            badges.forEach(
                badge => {

                    if (
                        !badgeCatalog.has(
                            badge.key
                        )
                    ) {

                        badgeCatalog.set(
                            badge.key,
                            badge
                        );

                    }

                }
            );

        }
    );


    const badges = [
        ...badgeCatalog.values()
    ].sort(
        compareBadges
    );


    badgeFiltersElement.innerHTML =
        "";


    badges.forEach(
        badge => {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "badge-filter-option";


            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";

            checkbox.value =
                badge.key;

            checkbox.className =
                "badge-filter-checkbox";


            const text =
                document.createElement(
                    "span"
                );


            text.textContent =
                `${badge.icon} ${badge.label}`;


            label.appendChild(
                checkbox
            );

            label.appendChild(
                text
            );


            badgeFiltersElement
                .appendChild(
                    label
                );


            checkbox.addEventListener(
                "change",
                () => {

                    activePreset =
                        "";

                    renderResults();

                }
            );

        }
    );

}



function getSelectedBadgeKeys() {

    return [
        ...document.querySelectorAll(
            ".badge-filter-checkbox:checked"
        )
    ].map(
        checkbox =>
            checkbox.value
    );

}



/* =========================================================
   COLUMN OPTIONS
   ========================================================= */

function populateColumnFilters() {

    columnFiltersElement.innerHTML =
        "";


    COLUMN_DEFINITIONS.forEach(
        column => {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "column-filter-option";


            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";

            checkbox.value =
                column.key;

            checkbox.className =
                "column-filter-checkbox";

            checkbox.checked =
                column.defaultVisible;


            if (column.locked) {

                checkbox.disabled =
                    true;

            }


            const text =
                document.createElement(
                    "span"
                );


            text.textContent =
                column.label;


            label.appendChild(
                checkbox
            );

            label.appendChild(
                text
            );


            columnFiltersElement
                .appendChild(
                    label
                );


            checkbox.addEventListener(
                "change",
                () => {

                    ensureValidSortColumn();

                    renderResults();

                }
            );

        }
    );

}



function getVisibleColumns() {

    const checked =
        new Set(
            [
                ...document.querySelectorAll(
                    ".column-filter-checkbox:checked"
                )
            ].map(
                checkbox =>
                    checkbox.value
            )
        );


    return COLUMN_DEFINITIONS.filter(
        column =>
            checked.has(
                column.key
            )
    );

}



function getDefaultVisibleColumnKeys() {

    return COLUMN_DEFINITIONS
        .filter(
            column =>
                column.defaultVisible
        )
        .map(
            column =>
                column.key
        );

}



function columnsDifferFromDefault() {

    const visible =
        getVisibleColumns()
            .map(
                column =>
                    column.key
            );


    const defaults =
        getDefaultVisibleColumnKeys();


    if (
        visible.length !==
        defaults.length
    ) {
        return true;
    }


    return visible.some(
        (key, index) =>
            key !== defaults[index]
    );

}



function ensureValidSortColumn() {

    const visibleKeys =
        getVisibleColumns()
            .map(
                column =>
                    column.key
            );


    if (
        visibleKeys.includes(
            sortColumn
        )
    ) {
        return;
    }


    if (
        visibleKeys.includes(
            "bestFinish"
        )
    ) {

        sortColumn =
            "bestFinish";

        sortDirection =
            "asc";

        return;

    }


    sortColumn =
        visibleKeys[0] ||
        "name";


    const definition =
        getColumnDefinition(
            sortColumn
        );


    sortDirection =
        definition
            ? definition.defaultSort
            : "asc";

}



function getColumnDefinition(key) {

    return COLUMN_DEFINITIONS.find(
        column =>
            column.key === key
    );

}



/* =========================================================
   RESTORE URL STATE
   ========================================================= */

function restoreFiltersFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const savedSearch =
        params.get(
            "search"
        );

    const savedYear =
        params.get(
            "year"
        );

    const savedDivision =
        params.get(
            "division"
        );

    const savedCountry =
        params.get(
            "country"
        );

    const savedPreset =
        params.get(
            "preset"
        );

    const savedBadges =
        params.getAll(
            "badge"
        );

    const savedColumns =
        params.getAll(
            "col"
        );

    const savedSort =
        params.get(
            "sort"
        );

    const savedDirection =
        params.get(
            "dir"
        );


    if (savedSearch) {

        searchElement.value =
            savedSearch;

    }


    if (
        savedYear &&
        optionExists(
            yearFilter,
            savedYear
        )
    ) {

        yearFilter.value =
            savedYear;

    }


    if (
        savedDivision &&
        optionExists(
            divisionFilter,
            savedDivision
        )
    ) {

        divisionFilter.value =
            savedDivision;

    }


    if (
        savedCountry &&
        optionExists(
            countryFilter,
            savedCountry
        )
    ) {

        countryFilter.value =
            savedCountry;

    }


    if (savedPreset) {

        activePreset =
            savedPreset;

    }


    if (
        savedBadges.length > 0
    ) {

        document
            .querySelectorAll(
                ".badge-filter-checkbox"
            )
            .forEach(
                checkbox => {

                    checkbox.checked =
                        savedBadges.includes(
                            checkbox.value
                        );

                }
            );

    }


    /*
     * If col= parameters exist, restore them.
     *
     * Player Name remains visible regardless.
     */

    if (
        savedColumns.length > 0
    ) {

        const validKeys =
            new Set(
                COLUMN_DEFINITIONS.map(
                    column =>
                        column.key
                )
            );


        document
            .querySelectorAll(
                ".column-filter-checkbox"
            )
            .forEach(
                checkbox => {

                    const definition =
                        getColumnDefinition(
                            checkbox.value
                        );


                    checkbox.checked =
                        Boolean(
                            definition &&
                            (
                                definition.locked ||
                                (
                                    validKeys.has(
                                        checkbox.value
                                    ) &&
                                    savedColumns.includes(
                                        checkbox.value
                                    )
                                )
                            )
                        );

                }
            );

    }


    if (
        savedSort &&
        getColumnDefinition(
            savedSort
        )
    ) {

        sortColumn =
            savedSort;

    }


    if (
        savedDirection === "asc" ||
        savedDirection === "desc"
    ) {

        sortDirection =
            savedDirection;

    }


    const hasAdvancedState =
        Boolean(
            yearFilter.value ||
            divisionFilter.value ||
            countryFilter.value ||
            getSelectedBadgeKeys().length ||
            columnsDifferFromDefault()
        );


    if (hasAdvancedState) {

        setAdvancedFiltersOpen(
            true
        );

    }

}



function optionExists(
    selectElement,
    value
) {

    return [
        ...selectElement.options
    ].some(
        option =>
            option.value === value
    );

}



/* =========================================================
   ADVANCED FILTER PANEL
   ========================================================= */

function setAdvancedFiltersOpen(
    isOpen
) {

    advancedFilters.hidden =
        !isOpen;


    advancedFiltersButton
        .setAttribute(
            "aria-expanded",
            String(isOpen)
        );


    advancedFiltersButton.textContent =
        isOpen
            ? "Hide Filters"
            : "Advanced Filters";

}



advancedFiltersButton
    .addEventListener(
        "click",
        () => {

            setAdvancedFiltersOpen(
                advancedFilters.hidden
            );

        }
    );



/* =========================================================
   MAIN RESULTS
   ========================================================= */

function renderResults() {

    ensureValidSortColumn();


    const searchTerm =
        searchElement
            .value
            .trim()
            .toLowerCase();


    const selectedYear =
        yearFilter.value;


    const selectedDivision =
        divisionFilter.value;


    const selectedCountry =
        countryFilter.value;


    const selectedBadgeKeys =
        getSelectedBadgeKeys();



    /*
     * Column selections and sorting do NOT
     * make the full database appear.
     *
     * The landing page remains until the user
     * searches or applies an actual filter/preset.
     */

    const hasFilters =
        Boolean(
            searchTerm ||
            selectedYear ||
            selectedDivision ||
            selectedCountry ||
            selectedBadgeKeys.length ||
            activePreset
        );


    if (!hasFilters) {

        landingElement.hidden =
            false;

        resultsSection.hidden =
            true;

        resultsElement.innerHTML =
            "";

        resultsHeader.innerHTML =
            "";

        resultCount.textContent =
            "";

        updateURL();

        return;

    }



    /*
     * First determine which players match the
     * search/year/division/country/preset.
     */

    const matchingPlayerKeys =
        new Set();



    appearances.forEach(
        record => {

            const playerKey =
                getPlayerKey(
                    record
                );


            const formattedName =
                formatPlayerName(
                    record.name
                ).toLowerCase();


            const year =
                String(
                    record.year || ""
                );


            const division =
                String(
                    record.division || ""
                );


            const country =
                String(
                    record.country || ""
                );


            const placement =
                getPlacementNumber(
                    record.placement
                );


            const matchesSearch =
                !searchTerm ||
                formattedName.includes(
                    searchTerm
                );


            const matchesYear =
                !selectedYear ||
                year ===
                    selectedYear;


            const matchesDivision =
                !selectedDivision ||
                division ===
                    selectedDivision;


            const matchesCountry =
                !selectedCountry ||
                country ===
                    selectedCountry;


            let matchesPreset =
                true;



            if (
                activePreset ===
                "champions"
            ) {

                matchesPreset =
                    placement === 1;

            }


            else if (
                activePreset ===
                "finalists"
            ) {

                matchesPreset =
                    placement !== null &&
                    placement <= 2;

            }


            else if (
                activePreset ===
                "top8"
            ) {

                matchesPreset =
                    placement !== null &&
                    placement <= 8;

            }


            else if (
                activePreset ===
                "returning"
            ) {

                const careerRecords =
                    playerCareerMap.get(
                        playerKey
                    ) || [];


                const careerYears =
                    new Set(
                        careerRecords
                            .map(item =>
                                Number(
                                    item.year
                                )
                            )
                            .filter(year =>
                                !isNaN(year)
                            )
                    );


                matchesPreset =
                    careerYears.size >= 2;

            }



            if (
                matchesSearch &&
                matchesYear &&
                matchesDivision &&
                matchesCountry &&
                matchesPreset
            ) {

                matchingPlayerKeys.add(
                    playerKey
                );

            }

        }
    );



    /*
     * Apply career-wide badge filtering.
     */

    let finalPlayerKeys = [
        ...matchingPlayerKeys
    ];


    if (
        selectedBadgeKeys.length > 0
    ) {

        finalPlayerKeys =
            finalPlayerKeys.filter(
                playerKey => {

                    const careerRecords =
                        playerCareerMap.get(
                            playerKey
                        ) || [];


                    const earnedBadges =
                        new Set(
                            calculatePlayerBadges(
                                careerRecords
                            ).map(
                                badge =>
                                    badge.key
                            )
                        );


                    return selectedBadgeKeys
                        .every(
                            badgeKey =>
                                earnedBadges.has(
                                    badgeKey
                                )
                        );

                }
            );

    }



    /*
     * Build full-career summaries.
     */

    const players =
        finalPlayerKeys.map(
            playerKey =>
                summarizePlayer(
                    playerCareerMap.get(
                        playerKey
                    ) || []
                )
        );



    sortPlayers(
        players
    );


    renderTableHeader();


    const visibleColumns =
        getVisibleColumns();


    resultsElement.innerHTML =
        "";



    players.forEach(
        player => {

            const profileParams =
                new URLSearchParams();


            if (player.player_id) {

                profileParams.set(
                    "id",
                    player.player_id
                );

            }


            appendCurrentViewState(
                profileParams
            );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML =
                visibleColumns
                    .map(
                        column =>
                            renderPlayerCell(
                                player,
                                column.key,
                                profileParams
                            )
                    )
                    .join("");


            resultsElement.appendChild(
                row
            );

        }
    );


    landingElement.hidden =
        true;

    resultsSection.hidden =
        false;


    resultCount.textContent =
        players.length === 1
            ? "1 player"
            : `${players.length} players`;


    updateURL();

}



/* =========================================================
   PLAYER SUMMARY
   ========================================================= */

function summarizePlayer(records) {

    const sortedRecords = [
        ...records
    ].sort(
        (a, b) =>
            Number(b.year) -
            Number(a.year)
    );


    const newestRecord =
        sortedRecords[0] || {};


    const name =
        formatPlayerName(
            newestRecord.name || ""
        );


    const countries = [
        ...new Set(
            sortedRecords
                .map(record =>
                    String(
                        record.country ||
                        ""
                    ).trim()
                )
                .filter(Boolean)
        )
    ];


    const divisions = [
        ...new Set(
            records
                .map(record =>
                    record.division
                )
                .filter(Boolean)
        )
    ];


    const years = [
        ...new Set(
            records
                .map(record =>
                    Number(record.year)
                )
                .filter(year =>
                    !isNaN(year)
                )
        )
    ].sort(
        (a, b) =>
            a - b
    );


    const placements =
        records
            .map(record =>
                getPlacementNumber(
                    record.placement
                )
            )
            .filter(
                placement =>
                    placement !== null
            );


    const bestPlacement =
        placements.length > 0
            ? Math.min(
                ...placements
            )
            : null;



    const sortedPlacements = [
        ...placements
    ].sort(
        (a, b) =>
            a - b
    );


    const bestThreeFinishSum =
        sortedPlacements.length >= 3

            ? sortedPlacements
                .slice(0, 3)
                .reduce(
                    (total, placement) =>
                        total + placement,
                    0
                )

            : null;



    const top8Count =
        placements.filter(
            placement =>
                placement <= 8
        ).length;



    const top32Count =
        records.filter(
            record =>
                isTop32FinishForDirectory(
                    record.placement
                )
        ).length;



    const longestInviteStreak =
        getLongestQualifierStreak(
            records
        );


    return {

        player_id:
            newestRecord.player_id ||
            "",

        name:
            name,

        countries:
            countries,

        divisions:
            divisions,

        years:
            years,

        bestPlacement:
            bestPlacement,

        bestThreeFinishSum:
            bestThreeFinishSum,

        top8Count:
            top8Count,

        top32Count:
            top32Count,

        longestInviteStreak:
            longestInviteStreak

    };

}



/* =========================================================
   TOP 32
   ========================================================= */

function isTop32FinishForDirectory(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return false;
    }


    const exactPlacement =
        getPlacementNumber(
            value
        );


    if (
        exactPlacement !== null
    ) {

        return (
            exactPlacement <= 32
        );

    }


    const text =
        String(value)
            .trim();


    const match =
        text.match(
            /^top\s*(\d+)$/i
        );


    if (!match) {
        return false;
    }


    return (
        Number(match[1]) <= 32
    );

}



/* =========================================================
   SORTING
   ========================================================= */

function sortPlayers(players) {

    players.sort(
        (a, b) => {

            const valueA =
                getPlayerSortValue(
                    a,
                    sortColumn
                );


            const valueB =
                getPlayerSortValue(
                    b,
                    sortColumn
                );


            /*
             * Missing data always goes last,
             * regardless of sort direction.
             */

            const missingA =
                valueA === null ||
                valueA === undefined ||
                valueA === "";


            const missingB =
                valueB === null ||
                valueB === undefined ||
                valueB === "";


            if (
                missingA &&
                missingB
            ) {

                return a.name.localeCompare(
                    b.name,
                    undefined,
                    {
                        sensitivity:
                            "base"
                    }
                );

            }


            if (missingA) {
                return 1;
            }


            if (missingB) {
                return -1;
            }


            let comparison;


            if (
                typeof valueA ===
                    "number" &&
                typeof valueB ===
                    "number"
            ) {

                comparison =
                    valueA - valueB;

            } else {

                comparison =
                    String(valueA)
                        .localeCompare(
                            String(valueB),
                            undefined,
                            {
                                numeric: true,
                                sensitivity:
                                    "base"
                            }
                        );

            }


            if (comparison === 0) {

                comparison =
                    a.name.localeCompare(
                        b.name,
                        undefined,
                        {
                            sensitivity:
                                "base"
                        }
                    );

            }


            return (
                sortDirection === "asc"
                    ? comparison
                    : -comparison
            );

        }
    );

}



function getPlayerSortValue(
    player,
    column
) {

    switch (column) {

        case "name":

            return player.name;


        case "countries":

            return player.countries
                .join(" / ");


        case "divisions":

            return sortDivisions(
                player.divisions
            ).join(", ");


        case "years":

            return player.years.length;


        case "bestFinish":

            return player.bestPlacement;


        case "b3fs":

            return player.bestThreeFinishSum;


        case "top8s":

            return player.top8Count;


        case "top32s":

            return player.top32Count;


        case "streak":

            return player.longestInviteStreak;


        default:

            return player.name;

    }

}



/* =========================================================
   TABLE HEADER
   ========================================================= */

function renderTableHeader() {

    const columns =
        getVisibleColumns();


    resultsHeader.innerHTML =
        "";


    columns.forEach(
        column => {

            const th =
                document.createElement(
                    "th"
                );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.className =
                "table-sort-button";


            let indicator =
                "";


            if (
                sortColumn ===
                column.key
            ) {

                indicator =
                    sortDirection === "asc"
                        ? " ▲"
                        : " ▼";


                th.setAttribute(
                    "aria-sort",
                    sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                );

            }


            button.textContent =
                column.label +
                indicator;


            button.addEventListener(
                "click",
                () => {

                    if (
                        sortColumn ===
                        column.key
                    ) {

                        sortDirection =
                            sortDirection === "asc"
                                ? "desc"
                                : "asc";

                    } else {

                        sortColumn =
                            column.key;

                        sortDirection =
                            column.defaultSort;

                    }


                    renderResults();

                }
            );


            th.appendChild(
                button
            );


            resultsHeader.appendChild(
                th
            );

        }
    );

}



/* =========================================================
   TABLE CELLS
   ========================================================= */

function renderPlayerCell(
    player,
    column,
    profileParams
) {

    switch (column) {

        case "name": {

            const playerName =
                player.player_id

                    ? `
                        <a
                            class="player-link"
                            href="player.html?${profileParams.toString()}"
                        >
                            ${escapeHTML(player.name)}
                        </a>
                    `

                    : escapeHTML(
                        player.name
                    );


            return `
                <td>
                    ${playerName}
                </td>
            `;

        }


        case "countries":

            return `
                <td>
                    ${escapeHTML(
                        player.countries.join(
                            " / "
                        )
                    )}
                </td>
            `;


        case "divisions":

            return `
                <td>
                    ${escapeHTML(
                        sortDivisions(
                            player.divisions
                        ).join(", ")
                    )}
                </td>
            `;


        case "years":

            return `
                <td class="years-cell">

                    <strong>
                        ${player.years.length}
                    </strong>

                    <span class="year-list">
                        ${escapeHTML(
                            player.years.join(
                                ", "
                            )
                        )}
                    </span>

                </td>
            `;


        case "bestFinish":

            return `
                <td>
                    ${
                        player.bestPlacement !==
                        null

                            ? escapeHTML(
                                formatPlacement(
                                    player.bestPlacement
                                )
                            )

                            : "—"
                    }
                </td>
            `;


        case "b3fs":

            return `
                <td>
                    ${
                        player.bestThreeFinishSum !==
                        null

                            ? escapeHTML(
                                player.bestThreeFinishSum
                            )

                            : "—"
                    }
                </td>
            `;


        case "top8s":

            return `
                <td>
                    ${player.top8Count}
                </td>
            `;


        case "top32s":

            return `
                <td>
                    ${player.top32Count}
                </td>
            `;


        case "streak":

            return `
                <td>
                    ${player.longestInviteStreak}
                </td>
            `;


        default:

            return "";

    }

}



/* =========================================================
   LANDING SUGGESTIONS
   ========================================================= */

document
    .querySelectorAll(
        ".suggestion-card"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    resetSearchFilters(
                        false
                    );


                    if (
                        button.dataset.preset
                    ) {

                        activePreset =
                            button.dataset.preset;

                    }


                    if (
                        button.dataset.year &&
                        optionExists(
                            yearFilter,
                            button.dataset.year
                        )
                    ) {

                        yearFilter.value =
                            button.dataset.year;

                    }


                    if (
                        button.dataset.division &&
                        optionExists(
                            divisionFilter,
                            button.dataset.division
                        )
                    ) {

                        divisionFilter.value =
                            button.dataset.division;

                    }


                    if (
                        button.dataset.country &&
                        optionExists(
                            countryFilter,
                            button.dataset.country
                        )
                    ) {

                        countryFilter.value =
                            button.dataset.country;

                    }


                    if (
                        button.dataset.year ||
                        button.dataset.division ||
                        button.dataset.country
                    ) {

                        setAdvancedFiltersOpen(
                            true
                        );

                    }


                    renderResults();

                }
            );

        }
    );



/* =========================================================
   FILTER EVENTS
   ========================================================= */

searchElement.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Enter"
        ) {
            return;
        }


        activePreset =
            "";

        renderResults();

    }
);



yearFilter.addEventListener(
    "change",
    () => {

        activePreset =
            "";

        renderResults();

    }
);



divisionFilter.addEventListener(
    "change",
    () => {

        activePreset =
            "";

        renderResults();

    }
);



countryFilter.addEventListener(
    "change",
    () => {

        activePreset =
            "";

        renderResults();

    }
);



clearFiltersButton.addEventListener(
    "click",
    () => {

        /*
         * Clear search/filter conditions,
         * but keep the user's chosen columns
         * and sort preference.
         */

        resetSearchFilters(
            true
        );

        renderResults();

    }
);



/* =========================================================
   RESET SEARCH FILTERS
   ========================================================= */

function resetSearchFilters(
    closeAdvancedFilters
) {

    searchElement.value =
        "";

    yearFilter.value =
        "";

    divisionFilter.value =
        "";

    countryFilter.value =
        "";

    activePreset =
        "";


    document
        .querySelectorAll(
            ".badge-filter-checkbox"
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    false;

            }
        );


    if (
        closeAdvancedFilters
    ) {

        setAdvancedFiltersOpen(
            false
        );

    }

}



/* =========================================================
   URL STATE
   ========================================================= */

function appendCurrentViewState(
    params
) {

    const search =
        searchElement
            .value
            .trim();


    if (search) {

        params.set(
            "search",
            search
        );

    }


    if (yearFilter.value) {

        params.set(
            "year",
            yearFilter.value
        );

    }


    if (
        divisionFilter.value
    ) {

        params.set(
            "division",
            divisionFilter.value
        );

    }


    if (
        countryFilter.value
    ) {

        params.set(
            "country",
            countryFilter.value
        );

    }


    if (activePreset) {

        params.set(
            "preset",
            activePreset
        );

    }


    getSelectedBadgeKeys()
        .forEach(
            badgeKey => {

                params.append(
                    "badge",
                    badgeKey
                );

            }
        );


    /*
     * Only put column configuration in the
     * URL if it differs from the default.
     */

    if (
        columnsDifferFromDefault()
    ) {

        getVisibleColumns()
            .forEach(
                column => {

                    params.append(
                        "col",
                        column.key
                    );

                }
            );

    }


    /*
     * Default sorting is:
     *
     * Best Finish ascending
     */

    if (
        sortColumn !== "bestFinish" ||
        sortDirection !== "asc"
    ) {

        params.set(
            "sort",
            sortColumn
        );

        params.set(
            "dir",
            sortDirection
        );

    }

}



function updateURL() {

    const params =
        new URLSearchParams();


    appendCurrentViewState(
        params
    );


    const query =
        params.toString();


    const newURL =
        query
            ? `${window.location.pathname}?${query}`
            : window.location.pathname;


    window.history.replaceState(
        {},
        "",
        newURL
    );

}



/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHTML(value) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value === null ||
        value === undefined
            ? ""
            : String(value);


    return element.innerHTML;

}



/* =========================================================
   START
   ========================================================= */

loadData();
