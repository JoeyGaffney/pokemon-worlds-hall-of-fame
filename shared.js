/* =========================================================
   WORLD CHAMPIONSHIP YEARS
   ========================================================= */

/*
 * List every year in which a Pokémon TCG
 * World Championship was actually held.
 *
 * Qualifier streaks are based on consecutive
 * entries in THIS list, not consecutive
 * calendar years.
 *
 * Example:
 *
 * 2019 -> 2022
 *
 * counts as consecutive because there were
 * no World Championships in 2020 or 2021.
 *
 * When adding future data, simply add the new
 * Worlds year to this list.
 *
 * If Worlds is ever skipped again, just do not
 * add that year.
 */

const WORLDS_YEARS = [
    2004,
    2005,
    2006,
    2007,
    2008,
    2009,
    2010,
    2011,
    2012,
    2013,
    2014,
    2015,
    2016,
    2017,
    2018,
    2019,
    2022,
    2023,
    2024,
    2025,
    2026
];



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
     * and lowercase letters, assume the
     * capitalization is intentional.
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

        return String(
            record.player_id
        );

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


    /*
     * Accepted examples:
     *
     * 1
     * 1st
     * 17
     * 17th
     * T17
     *
     * Something like "Top 32" is deliberately
     * NOT interpreted as exactly 32nd.
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
   WORLD CHAMPIONSHIP YEAR HELPERS
   ========================================================= */

function getWorldsYearIndex(year) {

    return WORLDS_YEARS.indexOf(
        Number(year)
    );

}



function areConsecutiveWorldsYears(
    previousYear,
    currentYear
) {

    const previousIndex =
        getWorldsYearIndex(
            previousYear
        );


    const currentIndex =
        getWorldsYearIndex(
            currentYear
        );


    /*
     * If either year isn't in our known event list,
     * do not assume they're consecutive.
     */

    if (
        previousIndex === -1 ||
        currentIndex === -1
    ) {
        return false;
    }


    return (
        currentIndex ===
        previousIndex + 1
    );

}



/* =========================================================
   QUALIFIER STREAK
   ========================================================= */

function getLongestQualifierStreak(records) {

    /*
     * Presence in the database means the player
     * qualified for Worlds that year.
     *
     * Streaks are based on consecutive World
     * Championships rather than consecutive
     * calendar years.
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

        const previousYear =
            years[i - 1];


        const currentYear =
            years[i];


        if (
            areConsecutiveWorldsYears(
                previousYear,
                currentYear
            )
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


    /*
     * -----------------------------------------------------
     * BEST PLACEMENT FOR EACH WORLD CHAMPIONSHIP YEAR
     * -----------------------------------------------------
     *
     * Placement badges are classified per year.
     *
     * This prevents a single Championship win from
     * automatically granting:
     *
     * Champion
     * Finalist
     * Top 4
     * Top 8
     *
     * But if those accomplishments happened in DIFFERENT
     * years, the badges can stack.
     */

    const yearBestPlacements =
        new Map();


    records.forEach(record => {

        const year =
            Number(record.year);


        const placement =
            getPlacementNumber(
                record.placement
            );


        if (
            isNaN(year) ||
            placement === null
        ) {
            return;
        }


        if (
            !yearBestPlacements.has(year) ||
            placement <
                yearBestPlacements.get(year)
        ) {

            yearBestPlacements.set(
                year,
                placement
            );

        }

    });


    const yearlyPlacements = [
        ...yearBestPlacements.values()
    ];



    /*
     * -----------------------------------------------------
     * PLACEMENT ACHIEVEMENT TYPES
     * -----------------------------------------------------
     */

    let hasChampion =
        false;

    let hasFinalist =
        false;

    let hasTop4 =
        false;

    let hasTop8 =
        false;


    yearlyPlacements.forEach(
        placement => {

            if (placement === 1) {

                hasChampion =
                    true;

            }

            else if (placement === 2) {

                hasFinalist =
                    true;

            }

            else if (
                placement >= 3 &&
                placement <= 4
            ) {

                hasTop4 =
                    true;

            }

            else if (
                placement >= 5 &&
                placement <= 8
            ) {

                hasTop8 =
                    true;

            }

        }
    );



    /*
     * CHAMPION
     */

    if (hasChampion) {

        badges.push({

            key:
                "champion",

            label:
                "Champion",

            icon:
                "🏆",

            className:
                "badge-champion",

            description:
                "Won a Pokémon World Championship",

            sortGroup:
                10,

            sortValue:
                0

        });

    }



    /*
     * FINALIST
     *
     * Only earned from a separate 2nd-place year.
     */

    if (hasFinalist) {

        badges.push({

            key:
                "finalist",

            label:
                "Finalist",

            icon:
                "🥈",

            className:
                "badge-finalist",

            description:
                "Finished second at a Pokémon World Championship",

            sortGroup:
                20,

            sortValue:
                0

        });

    }



    /*
     * TOP 4
     *
     * Requires a separate 3rd or 4th-place result.
     */

    if (hasTop4) {

        badges.push({

            key:
                "top4",

            label:
                "Top 4",

            icon:
                "⭐",

            className:
                "badge-top4",

            description:
                "Finished 3rd or 4th at a Pokémon World Championship",

            sortGroup:
                30,

            sortValue:
                0

        });

    }



    /*
     * TOP 8
     *
     * Requires a separate 5th-8th-place result.
     */

    if (hasTop8) {

        badges.push({

            key:
                "top8",

            label:
                "Top 8",

            icon:
                "🎖️",

            className:
                "badge-top8",

            description:
                "Finished between 5th and 8th at a Pokémon World Championship",

            sortGroup:
                40,

            sortValue:
                0

        });

    }



    /*
     * -----------------------------------------------------
     * MULTIPLE CHAMPIONSHIPS
     * -----------------------------------------------------
     */

    const championshipCount =
        yearlyPlacements.filter(
            placement =>
                placement === 1
        ).length;


    /*
     * Exactly two Championships.
     */

    if (
        championshipCount === 2
    ) {

        badges.push({

            key:
                "double-champion",

            label:
                "Double Champion",

            icon:
                "👑",

            className:
                "badge-champion",

            description:
                "Won two Pokémon World Championships",

            sortGroup:
                50,

            sortValue:
                2

        });

    }



    /*
     * Three or more Championships.
     *
     * Someone who reaches three Championships
     * receives Triple Crown instead of
     * Double Champion.
     */

    if (
        championshipCount >= 3
    ) {

        badges.push({

            key:
                "triple-crown",

            label:
                "Triple Crown",

            icon:
                "🐐",

            className:
                "badge-champion",

            description:
                "Won at least three Pokémon World Championships",

            sortGroup:
                50,

            sortValue:
                3

        });

    }



    /*
     * -----------------------------------------------------
     * MULTIPLE TOP 8
     * -----------------------------------------------------
     *
     * Any finish from 1st through 8th counts.
     *
     * This replaces:
     *
     * 2x Top 8
     * 3x Top 8
     * 4x Top 8
     * etc.
     */

    const top8Count =
        yearlyPlacements.filter(
            placement =>
                placement <= 8
        ).length;


    if (
        top8Count >= 2
    ) {

        badges.push({

            key:
                "multiple-top8",

            label:
                "Multiple Top 8",

            icon:
                "✨",

            className:
                "badge-top8",

            description:
                "Recorded multiple World Championship Top 8 finishes",

            sortGroup:
                60,

            sortValue:
                top8Count

        });

    }



    /*
     * -----------------------------------------------------
     * QUALIFIER STREAK
     * -----------------------------------------------------
     */

    const qualifierStreak =
        getLongestQualifierStreak(
            records
        );


    if (
        qualifierStreak >= 2
    ) {

        badges.push({

            key:
                `qualifier-streak-${qualifierStreak}`,

            label:
                `${qualifierStreak}x Qualifier Streak`,

            icon:
                "🔥",

            className:
                "badge-streak",

            description:
                `Qualified for ${qualifierStreak} consecutive World Championships`,

            sortGroup:
                70,

            sortValue:
                qualifierStreak

        });

    }



    /*
     * -----------------------------------------------------
     * WORLDS APPEARANCE MILESTONES
     * -----------------------------------------------------
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


    /*
     * Cumulative milestones.
     */

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
     * -----------------------------------------------------
     * AGE DIVISIONS
     * -----------------------------------------------------
     */

    const divisions =
        new Set(
            records
                .map(record =>
                    record.division
                )
                .filter(Boolean)
        );


    const competedJuniors =
        divisions.has(
            "Juniors"
        );


    const competedSeniors =
        divisions.has(
            "Seniors"
        );


    const competedMasters =
        divisions.has(
            "Masters"
        );


    const competedAllDivisions =
        (
            competedJuniors &&
            competedSeniors &&
            competedMasters
        );


    /*
     * Two age divisions.
     *
     * If they've competed in all three, we give
     * them the more prestigious All Age Divisions
     * badge instead of both.
     */

    if (
        divisions.size >= 2 &&
        !competedAllDivisions
    ) {

        badges.push({

            key:
                "multi-division",

            label:
                "Multi-Division",

            icon:
                "🔀",

            className:
                "badge-division",

            description:
                "Competed in multiple age divisions",

            sortGroup:
                90,

            sortValue:
                divisions.size

        });

    }



    /*
     * JUNIORS + SENIORS + MASTERS
     */

    if (
        competedAllDivisions
    ) {

        badges.push({

            key:
                "all-age-divisions",

            label:
                "All Age Divisions",

            icon:
                "🌟",

            className:
                "badge-division",

            description:
                "Competed at Worlds in Juniors, Seniors, and Masters",

            sortGroup:
                90,

            sortValue:
                3

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

        "Juniors":
            1,

        "Seniors":
            2,

        "Masters":
            3

    };


    return [
        ...divisions
    ].sort(
        (a, b) =>
            (order[a] || 99) -
            (order[b] || 99)
    );

}
