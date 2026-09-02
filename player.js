const profileElement =
    document.getElementById(
        "profile"
    );

const backLink =
    document.getElementById(
        "backLink"
    );


const params =
    new URLSearchParams(
        window.location.search
    );


const playerId =
    params.get(
        "id"
    );



/* =========================================================
   BACK LINK
   ========================================================= */

buildBackLink();



function buildBackLink() {

    const backParams =
        new URLSearchParams();


    const simpleParams = [
        "search",
        "year",
        "division",
        "country",
        "preset"
    ];


    simpleParams.forEach(
        name => {

            const value =
                params.get(name);


            if (value) {

                backParams.set(
                    name,
                    value
                );

            }

        }
    );


    params
        .getAll("badge")
        .forEach(
            badgeKey => {

                backParams.append(
                    "badge",
                    badgeKey
                );

            }
        );


    const query =
        backParams.toString();


    backLink.href =
        query
            ? `index.html?${query}`
            : "index.html";

}



/* =========================================================
   LOAD PLAYER
   ========================================================= */

async function loadPlayer() {

    if (!playerId) {

        showError(
            "No player was specified."
        );

        return;

    }


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


        const appearances =
            await response.json();


        const playerAppearances =
            appearances.filter(
                record =>
                    String(
                        record.player_id
                    ) ===
                    playerId
            );


        if (
            playerAppearances.length === 0
        ) {

            showError(
                "No results were found for this player."
            );

            return;

        }


        renderPlayer(
            playerAppearances
        );


    } catch (error) {

        console.error(error);


        showError(
            "There was an error loading this player."
        );

    }

}



/* =========================================================
   PLAYER PROFILE
   ========================================================= */

function renderPlayer(records) {

    records.sort(
        (a, b) => {

            const yearDifference =
                Number(b.year) -
                Number(a.year);


            if (yearDifference !== 0) {

                return yearDifference;

            }


            const divisionOrder = {
                "Juniors": 1,
                "Seniors": 2,
                "Masters": 3
            };


            return (
                (divisionOrder[a.division] || 99) -
                (divisionOrder[b.division] || 99)
            );

        }
    );



    /*
     * For now, use the newest recorded version
     * of the player's name.
     */

    const displayName =
        formatPlayerName(
            records[0].name
        );


    document.title =
        `${displayName} | Pokémon World Championships Database`;



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


    const bestFinish =
        placements.length > 0
            ? Math.min(
                ...placements
            )
            : null;


    const championships =
        placements.filter(
            placement =>
                placement === 1
        ).length;


    const top8s =
        placements.filter(
            placement =>
                placement <= 8
        ).length;



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


    const firstAppearance =
        years.length > 0
            ? years[0]
            : "—";


    const latestAppearance =
        years.length > 0
            ? years[
                years.length - 1
            ]
            : "—";



    const countries = [
        ...new Set(
            records
                .map(record =>
                    String(
                        record.country ||
                        ""
                    ).trim()
                )
                .filter(Boolean)
        )
    ];



    /*
     * BADGES
     */

    const badges =
        calculatePlayerBadges(
            records
        ).sort(
            compareBadges
        );


    const badgesHTML =
        badges.length > 0

            ? `
                <div class="badge-container">

                    ${badges
                        .map(
                            badge => `
                                <span
                                    class="achievement-badge ${badge.className}"
                                    title="${escapeHTML(badge.description)}"
                                >
                                    <span class="badge-icon">
                                        ${badge.icon}
                                    </span>

                                    ${escapeHTML(badge.label)}
                                </span>
                            `
                        )
                        .join("")}

                </div>
            `

            : "";



    /*
     * RESULTS
     *
     * Qual is deliberately not shown yet.
     */

    const resultRows =
        records
            .map(
                record => `
                    <tr>

                        <td>
                            ${escapeHTML(record.year)}
                        </td>

                        <td>
                            ${escapeHTML(record.division)}
                        </td>

                        <td>
                            ${escapeHTML(record.country)}
                        </td>

                        <td>
                            ${escapeHTML(record.placement)}
                        </td>

                    </tr>
                `
            )
            .join("");



    profileElement.innerHTML = `

        <section class="player-header">

            <h1>
                ${escapeHTML(displayName)}
            </h1>


            <p class="player-meta">
                ${escapeHTML(
                    countries.join(" / ")
                )}
            </p>


            ${badgesHTML}

        </section>


        <section class="stats-grid">

            <div class="stat-card">

                <div class="stat-value">
                    ${years.length}
                </div>

                <div class="stat-label">
                    Worlds Appearances
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-value">

                    ${
                        bestFinish !== null
                            ? formatPlacement(
                                bestFinish
                            )
                            : "—"
                    }

                </div>

                <div class="stat-label">
                    Best Finish
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-value">
                    ${championships}
                </div>

                <div class="stat-label">
                    World Championships
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-value">
                    ${top8s}
                </div>

                <div class="stat-label">
                    Top 8 Finishes
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-value">
                    ${escapeHTML(firstAppearance)}
                </div>

                <div class="stat-label">
                    First Appearance
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-value">
                    ${escapeHTML(latestAppearance)}
                </div>

                <div class="stat-label">
                    Most Recent
                </div>

            </div>

        </section>


        <section class="player-results">

            <h2>
                World Championship Results
            </h2>


            <div class="table-wrapper">

                <table>

                    <thead>

                        <tr>
                            <th>Year</th>
                            <th>Division</th>
                            <th>Country</th>
                            <th>Placement</th>
                        </tr>

                    </thead>


                    <tbody>
                        ${resultRows}
                    </tbody>

                </table>

            </div>

        </section>

    `;

}



/* =========================================================
   ERROR
   ========================================================= */

function showError(message) {

    profileElement.innerHTML = `

        <div class="error-message">

            <h2>
                Player not found
            </h2>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;

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

loadPlayer();
