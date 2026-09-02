let appearances = [];

let activePreset = "";

let playerCareerMap =
    new Map();



/* =========================================================
   PAGE ELEMENTS
   ========================================================= */

const resultsElement =
    document.getElementById(
        "results"
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

        restoreFiltersFromURL();

        renderResults();


    } catch (error) {

        console.error(error);


        landingElement.hidden =
            true;

        resultsSection.hidden =
            false;


        resultsElement.innerHTML = `
            <tr>
                <td colspan="5">
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
   URL RESTORATION
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


    const hasAdvancedFilters =
        Boolean(
            yearFilter.value ||
            divisionFilter.value ||
            countryFilter.value ||
            getSelectedBadgeKeys().length
        );


    if (hasAdvancedFilters) {

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



    const hasFilters =
        Boolean(
            searchTerm ||
            selectedYear ||
            selectedDivision ||
            selectedCountry ||
            selectedBadgeKeys.length ||
            activePreset
        );


    /*
     * No filters means show the landing page
     * rather than every player.
     */

    if (!hasFilters) {

        landingElement.hidden =
            false;

        resultsSection.hidden =
            true;

        resultsElement.innerHTML =
            "";

        resultCount.textContent =
            "";

        updateURL();

        return;

    }



    /*
     * Determine which players match the basic
     * search / year / division / country /
     * landing-preset criteria.
     *
     * We then display that player's FULL career
     * information in the directory.
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
     * Apply career-wide badge filters.
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


                    /*
                     * ALL selected badges
                     * must be earned.
                     */

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
     * Build one directory row per player,
     * using full career records.
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



    /*
     * Best finish first, then name.
     */

    players.sort(
        (a, b) => {

            const placementA =
                a.bestPlacement ??
                Infinity;


            const placementB =
                b.bestPlacement ??
                Infinity;


            if (
                placementA !==
                placementB
            ) {

                return (
                    placementA -
                    placementB
                );

            }


            return (
                a.name.localeCompare(
                    b.name,
                    undefined,
                    {
                        sensitivity:
                            "base"
                    }
                )
            );

        }
    );



    resultsElement.innerHTML =
        "";



    players.forEach(
        player => {

            const profileParams =
                new URLSearchParams();



            /*
             * Internal player ID.
             */

            if (player.player_id) {

                profileParams.set(
                    "id",
                    player.player_id
                );

            }



            /*
             * Preserve current search/filter
             * state in the profile URL.
             */

            const search =
                searchElement
                    .value
                    .trim();


            if (search) {

                profileParams.set(
                    "search",
                    search
                );

            }


            if (yearFilter.value) {

                profileParams.set(
                    "year",
                    yearFilter.value
                );

            }


            if (
                divisionFilter.value
            ) {

                profileParams.set(
                    "division",
                    divisionFilter.value
                );

            }


            if (
                countryFilter.value
            ) {

                profileParams.set(
                    "country",
                    countryFilter.value
                );

            }


            if (activePreset) {

                profileParams.set(
                    "preset",
                    activePreset
                );

            }


            selectedBadgeKeys.forEach(
                badgeKey => {

                    profileParams.append(
                        "badge",
                        badgeKey
                    );

                }
            );



            let playerName =
                escapeHTML(
                    player.name
                );


            if (player.player_id) {

                playerName = `
                    <a
                        class="player-link"
                        href="player.html?${profileParams.toString()}"
                    >
                        ${escapeHTML(player.name)}
                    </a>
                `;

            }



            const divisions =
                sortDivisions(
                    player.divisions
                ).join(", ");



            const yearsDisplay = `
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
            `;



            const bestFinish =
                player.bestPlacement !==
                null

                    ? formatPlacement(
                        player.bestPlacement
                    )

                    : "—";



            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `
                <td>
                    ${playerName}
                </td>

                <td>
                    ${escapeHTML(
                        player.countries.join(
                            " / "
                        )
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        divisions
                    )}
                </td>

                <td class="years-cell">
                    ${yearsDisplay}
                </td>

                <td>
                    ${escapeHTML(
                        bestFinish
                    )}
                </td>
            `;


            resultsElement
                .appendChild(
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
            bestPlacement

    };

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

                    resetFilters(
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



                    /*
                     * If the suggestion changes one
                     * of the advanced filters, show
                     * that filter so the user can see
                     * what is active.
                     */

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
    "input",
    () => {

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

        resetFilters(
            true
        );

        renderResults();

    }
);



/* =========================================================
   RESET FILTERS
   ========================================================= */

function resetFilters(
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
   UPDATE PAGE URL
   ========================================================= */

function updateURL() {

    const params =
        new URLSearchParams();


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
