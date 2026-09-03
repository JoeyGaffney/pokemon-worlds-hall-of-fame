const sourcesElement =
    document.getElementById(
        "sources"
    );


async function loadSources() {

    try {

        const response =
            await fetch(
                "data/sources.json"
            );


        if (!response.ok) {

            throw new Error(
                "Could not load sources.json"
            );

        }


        const sources =
            await response.json();


        renderSources(
            sources
        );


    } catch (error) {

        console.error(error);


        sourcesElement.innerHTML = `
            <p class="error-message">
                Sources could not be loaded.
            </p>
        `;

    }

}



function renderSources(sources) {

    if (
        !Array.isArray(sources) ||
        sources.length === 0
    ) {

        sourcesElement.innerHTML = `
            <p>
                Source information is currently being added.
            </p>
        `;

        return;

    }


    const sourcesByYear =
        new Map();


    sources.forEach(
        source => {

            const year =
                String(
                    source.year ||
                    "General"
                );


            if (
                !sourcesByYear.has(
                    year
                )
            ) {

                sourcesByYear.set(
                    year,
                    []
                );

            }


            sourcesByYear
                .get(year)
                .push(source);

        }
    );


    const years = [
        ...sourcesByYear.keys()
    ].sort(
        (a, b) => {

            if (
                a === "General"
            ) {
                return 1;
            }


            if (
                b === "General"
            ) {
                return -1;
            }


            return (
                Number(b) -
                Number(a)
            );

        }
    );


    sourcesElement.innerHTML =
        years
            .map(
                year => {

                    const yearSources =
                        sourcesByYear.get(
                            year
                        );


                    return `

                        <section class="source-year">

                            <h2>
                                ${escapeHTML(year)}
                            </h2>


                            <div class="source-cards">

                                ${yearSources
                                    .map(
                                        source =>
                                            renderSource(
                                                source
                                            )
                                    )
                                    .join("")}

                            </div>

                        </section>

                    `;

                }
            )
            .join("");

}



function renderSource(source) {

    const title =
        escapeHTML(
            source.title ||
            "Source"
        );


    const type =
        source.type

            ? `
                <span class="source-type">
                    ${escapeHTML(source.type)}
                </span>
            `

            : "";


    const notes =
        source.notes

            ? `
                <p class="source-notes">
                    ${escapeHTML(source.notes)}
                </p>
            `

            : "";


    const link =
        source.url

            ? `
                <a
                    href="${escapeAttribute(source.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="source-link"
                >
                    View Source ↗
                </a>
            `

            : "";


    return `

        <article class="source-card">

            <div class="source-card-heading">

                <h3>
                    ${title}
                </h3>

                ${type}

            </div>


            ${notes}


            ${link}

        </article>

    `;

}



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



function escapeAttribute(value) {

    return String(value || "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}



loadSources();
