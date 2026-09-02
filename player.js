const profileElement =
    document.getElementById("profile");


const params =
    new URLSearchParams(window.location.search);

const playerId =
    params.get("id");


async function loadPlayer() {

    if (!playerId) {

        showError("No player was specified.");

        return;
    }


    try {

        const response =
            await fetch("data/appearances.json");

        if (!response.ok) {
            throw new Error(
                "Could not load appearances.json"
            );
        }


        const appearances =
            await response.json();


        const playerAppearances =
            appearances.filter(record =>
                String(record.player_id) === playerId
            );


        if (playerAppearances.length === 0) {

            showError(
                `No results were found for player ${playerId}.`
            );

            return;
        }


        renderPlayer(playerAppearances);

    } catch (error) {

        console.error(error);

        showError(
            "There was an error loading this player."
        );

    }

}



function renderPlayer(records) {

    /*
     * Sort newest result first.
     */
    records.sort((a, b) =>
        Number(b.year) - Number(a.year)
    );


    /*
     * For now, use the player's most recently
     * recorded name as the display name.
     *
     * Later we'll connect this to canonical_name
     * from the PLAYERS sheet.
     */
    const displayName =
        records[0].name;


    document.title =
        `${displayName} | Pokémon World Championships Database`;


    /*
     * Collect placement numbers that we can
     * safely interpret.
     */
    const placements =
        records
            .map(record =>
                getPlacementNumber(record.placement)
            )
            .filter(value =>
                value !== null
            );


    const bestFinish =
        placements.length > 0
            ? Math.min(...placements)
            : null;


    const championships =
        placements.filter(
            placement => placement === 1
        ).length;


    const top8s =
        placements.filter(
            placement => placement <= 8
        ).length;


    const years =
        records
            .map(record => Number(record.year))
            .filter(year => !isNaN(year));


    const firstAppearance =
        years.length > 0
            ? Math.min(...years)
            : "";


    const latestAppearance =
        years.length > 0
            ? Math.max(...years)
            : "";


    const countries = [
        ...new Set(
            records
                .map(record => record.country)
                .filter(country => country)
        )
    ];


    /*
     * Build results rows.
     */
    const resultRows =
        records.map(record => {

            return `
                <tr>
                    <td>${escapeHTML(record.year)}</td>
                    <td>${escapeHTML(record.division)}</td>
                    <td>${escapeHTML(record.country)}</td>
                    <td>${escapeHTML(record.placement)}</td>
                    <td>${formatQual(record.qual)}</td>
                </tr>
            `;

        }).join("");


    profileElement.innerHTML = `

        <section class="player-header">

            <h1>
                ${escapeHTML(displayName)}
            </h1>

            <p class="player-meta">
                ${escapeHTML(countries.join(" / "))}
            </p>

            <p class="player-id">
                Player ID: ${escapeHTML(playerId)}
            </p>

        </section>


        <section class="stats-grid">

            <div class="stat-card">

                <div class="stat-value">
                    ${records.length}
                </div>

                <div class="stat-label">
                    Worlds Appearances
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-value">
                    ${bestFinish !== null
                        ? formatPlacement(bestFinish)
                        : "—"}
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
                            <th>Qual</th>
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



/*
 * Only treat normal numerical placements as
 * actual placement numbers.
 *
 * Examples accepted:
 *
 * 1
 * 17
 * T17
 * 1st
 * 22nd
 *
 * Something like "Top 32" will NOT silently
 * be interpreted as exactly 32nd.
 */
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



function formatPlacement(number) {

    const lastTwo =
        number % 100;

    if (
        lastTwo >= 11 &&
        lastTwo <= 13
    ) {
        return `${number}th`;
    }


    switch (number % 10) {

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



function formatQual(value) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return "—";
    }

    return escapeHTML(value);

}



function showError(message) {

    profileElement.innerHTML = `

        <div class="error-message">

            <h2>Player not found</h2>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;

}



function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent =
        value === null ||
        value === undefined
            ? ""
            : value;

    return element.innerHTML;

}



loadPlayer();
