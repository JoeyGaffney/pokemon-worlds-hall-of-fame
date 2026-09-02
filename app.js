let appearances = [];
let activePreset = "";


/* =========================================================
   PAGE ELEMENTS
   ========================================================= */

const resultsElement =
    document.getElementById("results");

const searchElement =
    document.getElementById("search");

const yearFilter =
    document.getElementById("yearFilter");

const divisionFilter =
    document.getElementById("divisionFilter");

const countryFilter =
    document.getElementById("countryFilter");

const resultCount =
    document.getElementById("resultCount");

const landingElement =
    document.getElementById("landing");

const resultsSection =
    document.getElementById("resultsSection");

const clearFiltersButton =
    document.getElementById("clearFilters");



/* =========================================================
   LOAD DATABASE
   ========================================================= */

async function loadData() {

    try {

        const response =
            await fetch("data/appearances.json");


        if (!response.ok) {

            throw new Error(
                "Could not load appearances.json"
            );

        }


        appearances =
            await response.json();


        populateYearFilter();
        populateCountryFilter();

        restoreFiltersFromURL();

        renderResults();


    } catch (error) {

        console.error(error);


        if (landingElement) {
            landingElement.hidden = true;
        }


        if (resultsSection) {
            resultsSection.hidden = false;
        }


        if (resultsElement) {

            resultsElement.innerHTML = `
                <tr>
                    <td colspan="5">
                        Error loading competitor data.
                    </td>
                </tr>
            `;

        }

    }

}



/* =========================================================
   BUILD FILTER OPTIONS
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
    ];


    years.sort(
        (a, b) => b - a
    );


    years.forEach(year => {

        const option =
            document.createElement("option");

        option.value =
            String(year);

        option.textContent =
            String(year);

        yearFilter.appendChild(option);

    });

}



function populateCountryFilter() {

    const countries = [
        ...new Set(
            appearances
                .map(record =>
                    String(record.country || "").trim()
                )
                .filter(Boolean)
        )
    ];


    countries.sort(
        (a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    sensitivity: "base"
                }
            )
    );


    countries.forEach(country => {

        const option =
            document.createElement("option");

        option.value =
            country;

        option.textContent =
            country;

        countryFilter.appendChild(option);

    });

}



/* =========================================================
   RESTORE FILTERS FROM URL
   ========================================================= */

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

    const savedPreset =
        params.get("preset");


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


    const hasFilters =
        Boolean(
            searchTerm ||
            selectedYear ||
            selectedDivision ||
            selectedCountry ||
            activePreset
        );


    /*
     * No search/filter = show landing page.
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
     * Count unique appearance years per player.
     *
     * Used by the Returning Players preset.
     */

    const appearanceYearsByPlayer =
        new Map();


    appearances.forEach(record => {

        if (!record.player_id) {
            return;
        }


        if (
            !appearanceYearsByPlayer.has(
                record.player_id
            )
        ) {

            appearanceYearsByPlayer.set(
                record.player_id,
                new Set()
            );

        }


        appearanceYearsByPlayer
            .get(record.player_id)
            .add(
                Number(record.year)
            );

    });



    /*
     * Filter individual appearance records first.
     */

    const filteredAppearances =
        appearances.filter(record => {

            const formattedName =
                formatPlayerName(
                    record.name
                ).toLowerCase();


            const country =
                String(
                    record.country || ""
                );


            const division =
                String(
                    record.division || ""
                );


            const year =
                String(
                    record.year || ""
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
                year === selectedYear;


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



            /*
             * Landing-page presets
             */

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

                const years =
                    appearanceYearsByPlayer.get(
                        record.player_id
                    );


                matchesPreset =
                    Boolean(
                        years &&
                        years.size >= 2
                    );

            }


            return (
                matchesSearch &&
                matchesYear &&
                matchesDivision &&
                matchesCountry &&
                matchesPreset
            );

        });



    /*
     * Convert appearance records into
     * one row per player.
     */

    const players =
        groupAppearancesByPlayer(
            filteredAppearances
        );



    /*
     * Best finish first, then alphabetical.
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



    players.forEach(player => {

        const profileParams =
            new URLSearchParams();



        /*
         * Player ID stays internal.
         * It appears only in the profile URL.
         */

        if (player.player_id) {

            profileParams.set(
                "id",
                player.player_id
            );

        }


        /*
         * Preserve active filters when
         * visiting the profile.
         */

        if (
            searchElement
                .value
                .trim()
        ) {

            profileParams.set(
                "search",
                searchElement
                    .value
                    .trim()
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



        /*
         * Display years.
         */

        let yearsDisplay =
            "";


        if (
            player.years.length === 1
        ) {

            yearsDisplay =
                escapeHTML(
                    player.years[0]
                );

        } else {

            yearsDisplay = `
                <strong>
                    ${player.years.length}
                </strong>

                <span class="year-list">
                    ${escapeHTML(
                        player.years.join(", ")
                    )}
                </span>
            `;

        }



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


        resultsElement.appendChild(
            row
        );

    });



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
   GROUP APPEARANCES INTO PLAYERS
   ========================================================= */

function groupAppearancesByPlayer(
    records
) {

    const players =
        new Map();


    records.forEach(record => {

        /*
         * player_id should always exist.
         *
         * Fallback keeps old records usable.
         */

        const key =
            record.player_id ||
            (
                normalizePlayerName(
                    record.name
                ) +
                "||" +
                String(
                    record.country || ""
                ).toUpperCase()
            );


        if (!players.has(key)) {

            players.set(
                key,
                {
                    player_id:
                        record.player_id,

                    names: [],

                    countries:
                        new Set(),

                    divisions:
                        new Set(),

                    years:
                        new Set(),

                    placements: []
                }
            );

        }


        const player =
            players.get(key);



        if (record.name) {

            player.names.push(
                {
                    name:
                        record.name,

                    year:
                        Number(
                            record.year
                        ) || 0
                }
            );

        }



        if (record.country) {

            player.countries.add(
                String(
                    record.country
                ).trim()
            );

        }



        if (record.division) {

            player.divisions.add(
                record.division
            );

        }



        if (record.year) {

            const year =
                Number(
                    record.year
                );


            if (!isNaN(year)) {

                player.years.add(
                    year
                );

            }

        }



        const placement =
            getPlacementNumber(
                record.placement
            );


        if (placement !== null) {

            player.placements.push(
                placement
            );

        }

    });



    return [
        ...players.values()
    ].map(player => {

        /*
         * Use the newest recorded name
         * until players.json/canonical_name
         * is added later.
         */

        player.names.sort(
            (a, b) =>
                b.year - a.year
        );


        const latestName =
            player.names.length > 0
                ? player.names[0].name
                : "";


        const displayName =
            formatPlayerName(
                latestName
            );


        const bestPlacement =
            player.placements.length > 0

                ? Math.min(
                    ...player.placements
                )

                : null;


        return {

            player_id:
                player.player_id,

            name:
                displayName,

            countries: [
                ...player.countries
            ],

            divisions: [
                ...player.divisions
            ],

            years: [
                ...player.years
            ].sort(
                (a, b) =>
                    a - b
            ),

            bestPlacement:
                bestPlacement

        };

    });

}



/* =========================================================
   LANDING-PAGE SUGGESTION BUTTONS
   ========================================================= */

document
    .querySelectorAll(
        ".suggestion-card"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                /*
                 * Start each suggestion
                 * from a clean filter state.
                 */

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



                if (
                    button.dataset.preset
                ) {

                    activePreset =
                        button.dataset.preset;

                }



                if (
                    button.dataset.year
                ) {

                    if (
                        optionExists(
                            yearFilter,
                            button.dataset.year
                        )
                    ) {

                        yearFilter.value =
                            button.dataset.year;

                    }

                }



                if (
                    button.dataset.division
                ) {

                    if (
                        optionExists(
                            divisionFilter,
                            button.dataset.division
                        )
                    ) {

                        divisionFilter.value =
                            button.dataset.division;

                    }

                }



                if (
                    button.dataset.country
                ) {

                    if (
                        optionExists(
                            countryFilter,
                            button.dataset.country
                        )
                    ) {

                        countryFilter.value =
                            button.dataset.country;

                    }

                }


                renderResults();

            }
        );

    });



/* =========================================================
   FILTER EVENTS
   ========================================================= */

searchElement.addEventListener(
    "input",
    () => {

        /*
         * Manually searching exits a special
         * preset such as Champions.
         */

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


        window.history.replaceState(
            {},
            "",
            window.location.pathname
        );


        renderResults();

    }
);



/* =========================================================
   KEEP CURRENT FILTERS IN URL
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
   PLAYER NAME FORMATTING
   ========================================================= */

function formatPlayerName(name) {

    const text =
        String(name || "")
            .trim();


    if (!text) {
        return "";
    }


    /*
     * If capitalization already looks intentional,
     * preserve it.
     *
     * Examples:
     * Sean McDonald
     * João Silva
     */

    const hasUppercase =
        /\p{Lu}/u.test(text);


    const hasLowercase =
        /\p{Ll}/u.test(text);


    if (
        hasUppercase &&
        hasLowercase
    ) {

        return text;

    }


    /*
     * Convert ALL CAPS or all lowercase
     * to title case.
     */

    return text
        .toLocaleLowerCase()
        .replace(
            /(^|[\s\-'])\p{L}/gu,
            character =>
                character.toLocaleUpperCase()
        );

}



/*
 * Used only for fallback identity matching.
 */

function normalizePlayerName(name) {

    return String(name || "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .replace(
            /[’‘]/g,
            "'"
        )

        .trim()

        .replace(
            /\s+/g,
            " "
        )

        .toLowerCase();

}



/* =========================================================
   DIVISION ORDER
   ========================================================= */

function sortDivisions(
    divisions
) {

    const order = {
        "Juniors": 1,
        "Seniors": 2,
        "Masters": 3
    };


    return [
        ...divisions
    ].sort(
        (a, b) => {

            return (
                (order[a] || 99) -
                (order[b] || 99)
            );

        }
    );

}



/* =========================================================
   PLACEMENT HELPERS
   ========================================================= */

function getPlacementNumber(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return null;

    }


    const text =
        String(value)
            .trim();


    /*
     * Accepted:
     *
     * 1
     * 1st
     * 17
     * 17th
     * T17
     *
     * "Top 32" is intentionally not
     * treated as exactly 32nd.
     */

    const match =
        text.match(
            /^T?(\d+)(?:st|nd|rd|th)?$/i
        );


    if (!match) {

        return null;

    }


    return Number(
        match[1]
    );

}



function formatPlacement(number) {

    const lastTwo =
        number % 100;


    if (
        lastTwo >= 11 &&
        lastTwo <= 13
    ) {

        return `${number}th`;

    }


    switch (
        number % 10
    ) {

        case 1:
            return `${number}st`;

        case 2:
            return `${number}nd`;

        case 3:
            return `${number}rd`;

        default:
            return `${number}th`;

    }

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
   START SITE
   ========================================================= */

loadData();
