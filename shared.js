/* =========================================================
   PLAYER NAME HELPERS
   ========================================================= */

function formatPlayerName(name) {

    const text =
        String(name || "")
            .trim();


    if (!text) {
        return "";
    }


    /*
     * If the name already contains both uppercase
     * and lowercase letters, assume the capitalization
     * is intentional.
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
     * Convert ALL CAPS or all lowercase names
     * into title case.
     */

    return text
        .toLocaleLowerCase()
        .replace(
            /(^|[\s\-'])\p{L}/gu,
            character =>
                character.toLocaleUpperCase()
        );

}



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
   PLAYER IDENTITY
   ========================================================= */

function getPlayerKey(record) {

    if (record.player_id) {
        return String(record.player_id);
    }


    return (
        normalizePlayerName(
            record.name
        ) +
        "||" +
        String(
            record.country || ""
        )
            .trim()
            .toUpperCase()
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

    if (
        number === null ||
        number === undefined ||
        isNaN(number)
    ) {
        return "—";
    }


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



/* =========================================================
   QUALIFIER STREAK
   ========================================================= */

function getLongestQualifierStreak(records) {

    /*
     * Presence in the database means that player
     * qualified for Worlds that year.
     */

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


    if (years.length === 0) {
        return 0;
    }


    let longestStreak = 1;
    let currentStreak = 1;


    for (
        let i = 1;
        i < years.length;
        i++
    ) {

        if (
            years[i] ===
            years[i - 1] + 1
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



/* =========================================================
   BADGES
   ========================================================= */

function calculatePlayerBadges(records) {

    const badges = [];


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
            ? Math.min(...placements)
            : null;



    /*
     * BEST FINISH
     *
     * These are intentionally hierarchical.
     * A Champion gets Champion rather than
     * Champion + Finalist + Top 4 + Top 8.
     */

    if (bestFinish === 1) {

        badges.push({
            key: "champion",
            label: "Champion",
            icon: "🏆",
            className: "badge-champion",
            description:
                "Won a Pokémon World Championship",
            sortGroup: 10,
            sortValue: 0
        });

    }

    else if (bestFinish === 2) {

        badges.push({
            key: "finalist",
            label: "Finalist",
            icon: "🥈",
            className: "badge-finalist",
            description:
                "Finished second at a Pokémon World Championship",
            sortGroup: 20,
            sortValue: 0
        });

    }

    else if (
        bestFinish !== null &&
        bestFinish <= 4
    ) {

        badges.push({
            key: "top4",
            label: "Top 4",
            icon: "⭐",
            className: "badge-top4",
            description:
                "Finished in the Top 4 at Worlds",
            sortGroup: 30,
            sortValue: 0
        });

    }

    else if (
        bestFinish !== null &&
        bestFinish <= 8
    ) {

        badges.push({
            key: "top8",
            label: "Top 8",
            icon: "🎖️",
            className: "badge-top8",
            description:
                "Finished in the Top 8 at Worlds",
            sortGroup: 40,
            sortValue: 0
        });

    }



    /*
     * MULTIPLE CHAMPIONSHIPS
     */

    const championshipCount =
        placements.filter(
            placement =>
                placement === 1
        ).length;


    if (championshipCount >= 2) {

        badges.push({
            key:
                `champion-count-${championshipCount}`,

            label:
                `${championshipCount}x Champion`,

            icon: "👑",

            className:
                "badge-champion",

            description:
                `Won ${championshipCount} World Championships`,

            sortGroup: 50,

            sortValue:
                championshipCount
        });

    }



    /*
     * MULTIPLE TOP 8 FINISHES
     */

    const top8Count =
        placements.filter(
            placement =>
                placement <= 8
        ).length;


    if (top8Count >= 2) {

        badges.push({
            key:
                `top8-count-${top8Count}`,

            label:
                `${top8Count}x Top 8`,

            icon: "✨",

            className:
                "badge-top8",

            description:
                `Recorded ${top8Count} World Championship Top 8 finishes`,

            sortGroup: 60,

            sortValue:
                top8Count
        });

    }



    /*
     * QUALIFIER STREAK
     */

    const qualifierStreak =
        getLongestQualifierStreak(
            records
        );


    if (qualifierStreak >= 2) {

        badges.push({
            key:
                `qualifier-streak-${qualifierStreak}`,

            label:
                `${qualifierStreak}x Qualifier Streak`,

            icon: "🔥",

            className:
                "badge-streak",

            description:
                `Qualified for Worlds ${qualifierStreak} consecutive years`,

            sortGroup: 70,

            sortValue:
                qualifierStreak
        });

    }



    /*
     * WORLDS APPEARANCES
     */

    /*
 * WORLDS APPEARANCE MILESTONES
 *
 * These badges are cumulative.
 *
 * Example:
 * 12 appearances earns both
 * 5x and 10x Worlds Competitor.
 */

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
];


const worldsMilestones = [
    5,
    10,
    15,
    20
];


worldsMilestones.forEach(
    milestone => {

        if (
            years.length >= milestone
        ) {

            badges.push({

                key:
                    `worlds-count-${milestone}`,

                label:
                    `${milestone}x Worlds Competitor`,

                icon:
                    "🌎",

                className:
                    "badge-worlds",

                description:
                    `Competed at Worlds in at least ${milestone} different years`,

                sortGroup:
                    80,

                sortValue:
                    milestone
            });

        }

    }
);



    /*
     * MULTIPLE DIVISIONS
     */

    const divisions = [
        ...new Set(
            records
                .map(record =>
                    record.division
                )
                .filter(Boolean)
        )
    ];


    if (divisions.length >= 2) {

        badges.push({
            key:
                "multi-division",

            label:
                "Multi-Division",

            icon: "🔀",

            className:
                "badge-division",

            description:
                `Competed in ${divisions.length} different age divisions`,

            sortGroup: 90,

            sortValue:
                divisions.length
        });

    }


    return badges;

}



/* =========================================================
   BADGE SORTING
   ========================================================= */

function compareBadges(a, b) {

    if (
        a.sortGroup !==
        b.sortGroup
    ) {

        return (
            a.sortGroup -
            b.sortGroup
        );

    }


    if (
        a.sortValue !==
        b.sortValue
    ) {

        return (
            a.sortValue -
            b.sortValue
        );

    }


    return a.label.localeCompare(
        b.label,
        undefined,
        {
            numeric: true,
            sensitivity: "base"
        }
    );

}



/* =========================================================
   DIVISION SORTING
   ========================================================= */

function sortDivisions(divisions) {

    const order = {
        "Juniors": 1,
        "Seniors": 2,
        "Masters": 3
    };


    return [
        ...divisions
    ].sort(
        (a, b) =>
            (order[a] || 99) -
            (order[b] || 99)
    );

}
