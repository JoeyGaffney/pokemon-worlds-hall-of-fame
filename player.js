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

function calculateBadges(records) {

    const badges = [];

    const placements = records
        .map(record => getPlacementNumber(record.placement))
        .filter(value => value !== null);


    const bestFinish =
        placements.length > 0
            ? Math.min(...placements)
            : null;


    /*
     * MAJOR PLACEMENT BADGES
     */

    if (bestFinish === 1) {

        badges.push({
            name: "Champion",
            icon: "🏆",
            className: "badge-champion",
            description: "Won a Pokémon World Championship"
        });

    } else if (bestFinish === 2) {

        badges.push({
            name: "Finalist",
            icon: "🥈",
            className: "badge-finalist",
            description: "Reached a World Championship final"
        });

    } else if (bestFinish !== null && bestFinish <= 4) {

        badges.push({
            name: "Top 4",
            icon: "⭐",
            className: "badge-top4",
            description: "Finished in the Top 4 at Worlds"
        });

    } else if (bestFinish !== null && bestFinish <= 8) {

        badges.push({
            name: "Top 8",
            icon: "🎖️",
            className: "badge-top8",
            description: "Finished in the Top 8 at Worlds"
        });

    }


    /*
     * NUMBER OF WORLD CHAMPIONSHIP APPEARANCES
     */

    const uniqueYears = [
        ...new Set(
            records.map(record =>
                Number(record.year)
            )
        )
    ];


    if (uniqueYears.length >= 3) {

        badges.push({
            name: `${uniqueYears.length}x Worlds Competitor`,
            icon: "🌎",
            className: "badge-worlds",
            description:
                `Competed at Worlds in ${uniqueYears.length} different years`
        });

    }


    /*
     * QUALIFICATION STREAK
     */

    const qualifierStreak =
        getLongestQualifierStreak(records);


    if (qualifierStreak >= 2) {

        badges.push({
            name: `${qualifierStreak}x Qualifier Streak`,
            icon: "🔥",
            className: "badge-streak",
            description:
                `Qualified for Worlds ${qualifierStreak} consecutive years`
        });

    }


    /*
     * MULTIPLE DIVISIONS
     */

    const divisions = [
        ...new Set(
            records
                .map(record => record.division)
                .filter(Boolean)
        )
    ];


    if (divisions.length >= 2) {

        badges.push({
            name: "Multi-Division",
            icon: "🔀",
            className: "badge-division",
            description:
                `Competed in ${divisions.length} different age divisions`
        });

    }


    /*
     * MULTIPLE TOP 8 FINISHES
     */

    const top8Count =
        placements.filter(
            placement => placement <= 8
        ).length;


    if (top8Count >= 2) {

        badges.push({
            name: `${top8Count}x Top 8`,
            icon: "✨",
            className: "badge-top8",
            description:
                `Recorded ${top8Count} World Championship Top 8 finishes`
        });

    }


    /*
     * MULTIPLE CHAMPIONSHIPS
     */

    const championshipCount =
        placements.filter(
            placement => placement === 1
        ).length;


    if (championshipCount >= 2) {

        badges.push({
            name: `${championshipCount}x Champion`,
            icon: "👑",
            className: "badge-champion",
            description:
                `Won ${championshipCount} World Championships`
        });

    }


    return badges;
}

function getLongestQualifierStreak(records) {

    /*
     * Every Worlds appearance counts as qualifying.
     *
     * Multiple records in the same year still count
     * as only one qualification year.
     */

    const qualifiedYears = [
        ...new Set(
            records
                .map(record => Number(record.year))
                .filter(year => !isNaN(year))
        )
    ].sort((a, b) => a - b);


    if (qualifiedYears.length === 0) {
        return 0;
    }


    let longestStreak = 1;
    let currentStreak = 1;


    for (
        let i = 1;
        i < qualifiedYears.length;
        i++
    ) {

        if (
            qualifiedYears[i] ===
            qualifiedYears[i - 1] + 1
        ) {

            currentStreak++;

            longestStreak =
                Math.max(
                    longestStreak,
                    currentStreak
                );

        } else {

            currentStreak = 1;

        }

    }


    return longestStreak;
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
        formatPlayerName(records[0].name);

    const badges =
    calculateBadges(records);


    const badgesHTML =
        badges.length > 0
            ? `
                <div class="badge-container">

                    ${badges.map(badge => `
                        <span
                            class="achievement-badge ${badge.className}"
                            title="${escapeHTML(badge.description)}"
                        >
                            <span class="badge-icon">
                                ${badge.icon}
                            </span>

                            ${escapeHTML(badge.name)}
                        </span>
                    `).join("")}

                </div>
            `
            : "";

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

            ${badgesHTML}
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

loadPlayer();
