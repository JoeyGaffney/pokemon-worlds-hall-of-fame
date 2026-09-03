const sourcesElement =
    document.getElementById(
        "sources"
    );


const sourceNavigation =
    document.getElementById(
        "sourceNavigation"
    );



/* =========================================================
   LOAD SOURCES
   ========================================================= */

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


        const posts =
            await response.json();


        renderSources(
            posts
        );


    } catch (error) {

        console.error(error);


        sourcesElement.innerHTML = `

            <div class="source-error">

                <h2>
                    Sources could not be loaded
                </h2>

                <p>
                    Please try again later.
                </p>

            </div>

        `;

    }

}



/* =========================================================
   RENDER ALL POSTS
   ========================================================= */

function renderSources(posts) {

    if (
        !Array.isArray(posts) ||
        posts.length === 0
    ) {

        sourceNavigation.innerHTML =
            "";


        sourcesElement.innerHTML = `

            <div class="empty-sources">

                <h2>
                    Research notes coming soon
                </h2>

                <p>
                    Source documentation is currently being added.
                </p>

            </div>

        `;

        return;

    }


    const sortedPosts = [
        ...posts
    ].sort(
        (a, b) => {

            const yearA =
                Number(a.year) || 0;

            const yearB =
                Number(b.year) || 0;


            return yearB - yearA;

        }
    );


    renderNavigation(
        sortedPosts
    );


    sourcesElement.innerHTML =
        sortedPosts
            .map(
                post =>
                    renderPost(
                        post
                    )
            )
            .join("");

}



/* =========================================================
   YEAR NAVIGATION
   ========================================================= */

function renderNavigation(posts) {

    sourceNavigation.innerHTML = `

        <span class="source-navigation-label">
            Jump to:
        </span>

        ${posts
            .map(
                post => {

                    const id =
                        getPostId(
                            post
                        );


                    return `

                        <a href="#${id}">
                            ${escapeHTML(
                                post.year ||
                                post.title
                            )}
                        </a>

                    `;

                }
            )
            .join("")}

    `;

}



/* =========================================================
   RENDER ARTICLE
   ========================================================= */

function renderPost(post) {

    const id =
        getPostId(
            post
        );


    const title =
        escapeHTML(
            post.title ||
            "Research Notes"
        );


    const subtitle =
        post.subtitle

            ? `
                <p class="source-post-subtitle">
                    ${escapeHTML(post.subtitle)}
                </p>
            `

            : "";


    const year =
        post.year

            ? `
                <span class="source-post-year">
                    ${escapeHTML(post.year)}
                </span>
            `

            : "";


    const heroImage =
        post.heroImage

            ? renderImage(
                post.heroImage,
                true
            )

            : "";


    const content =
        Array.isArray(
            post.content
        )

            ? post.content
                .map(
                    block =>
                        renderContentBlock(
                            block
                        )
                )
                .join("")

            : "";


    const references =
        Array.isArray(
            post.sources
        ) &&
        post.sources.length > 0

            ? renderReferences(
                post.sources
            )

            : "";


    return `

        <article
            class="source-post"
            id="${id}"
        >

            <header class="source-post-header">

                ${year}

                <h2>
                    ${title}
                </h2>

                ${subtitle}

            </header>


            ${heroImage}


            <div class="source-post-body">

                ${content}

            </div>


            ${references}


            <div class="source-post-footer">

                <a href="#">
                    Back to top ↑
                </a>

            </div>

        </article>

    `;

}



/* =========================================================
   CONTENT BLOCKS
   ========================================================= */

function renderContentBlock(block) {

    if (
        !block ||
        !block.type
    ) {
        return "";
    }


    switch (
        block.type
    ) {

        case "heading":

            return `

                <h3 class="source-section-heading">
                    ${escapeHTML(
                        block.text
                    )}
                </h3>

            `;


        case "paragraph":

            return `

                <p>
                    ${renderInlineLinks(
                        block.text
                    )}
                </p>

            `;


        case "image":

            return renderImage(
                block,
                false
            );


        case "images":

            return renderImageGallery(
                block.images
            );


        case "note":

            return `

                <aside class="source-note">

                    ${
                        block.title

                            ? `
                                <strong>
                                    ${escapeHTML(
                                        block.title
                                    )}
                                </strong>
                            `

                            : ""
                    }

                    <p>
                        ${renderInlineLinks(
                            block.text
                        )}
                    </p>

                </aside>

            `;

        case "pdf":
            return renderPDF(
                block
            );
            
        case "quote":

            return `

                <blockquote class="source-quote">

                    <p>
                        ${escapeHTML(
                            block.text
                        )}
                    </p>

                    ${
                        block.attribution

                            ? `
                                <cite>
                                    ${escapeHTML(
                                        block.attribution
                                    )}
                                </cite>
                            `

                            : ""
                    }

                </blockquote>

            `;


        default:

            return "";

    }

}



/* =========================================================
   IMAGE
   ========================================================= */

function renderImage(
    image,
    isHero
) {

    if (
        !image ||
        !image.src
    ) {
        return "";
    }


    const caption =
        image.caption

            ? `
                <figcaption>
                    ${escapeHTML(
                        image.caption
                    )}
                </figcaption>
            `

            : "";


    const sourceLink =
        image.sourceUrl

            ? `
                <div class="source-image-link">

                    <a
                        href="${escapeAttribute(
                            image.sourceUrl
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View original on the Wayback Machine ↗
                    </a>

                </div>
            `

            : "";


    const className =
        isHero
            ? "source-hero-image"
            : "source-content-image";


    return `

        <figure class="${className}">

            <a
                href="${escapeAttribute(
                    image.src
                )}"
                target="_blank"
            >

                <img
                    src="${escapeAttribute(
                        image.src
                    )}"
                    alt="${escapeAttribute(
                        image.alt ||
                        image.caption ||
                        ""
                    )}"
                    loading="lazy"
                >

            </a>

            ${caption}

            ${sourceLink}

        </figure>

    `;

}



/* =========================================================
   IMAGE GALLERY
   ========================================================= */

function renderImageGallery(images) {

    if (
        !Array.isArray(images) ||
        images.length === 0
    ) {
        return "";
    }


    return `

        <div class="source-image-gallery">

            ${images
                .map(
                    image =>
                        renderImage(
                            image,
                            false
                        )
                )
                .join("")}

        </div>

    `;

}



/* =========================================================
   REFERENCES
   ========================================================= */

function renderReferences(sources) {

    return `

        <section class="source-reference-section">

            <h3>
                Sources
            </h3>

            <ol class="source-reference-list">

                ${sources
                    .map(
                        source => {

                            const title =
                                escapeHTML(
                                    source.title ||
                                    "Source"
                                );


                            const type =
                                source.type

                                    ? `
                                        <span class="reference-type">
                                            ${escapeHTML(
                                                source.type
                                            )}
                                        </span>
                                    `

                                    : "";


                            const notes =
                                source.notes

                                    ? `
                                        <div class="reference-notes">
                                            ${escapeHTML(
                                                source.notes
                                            )}
                                        </div>
                                    `

                                    : "";


                            const linkedTitle =
                                source.url

                                    ? `
                                        <a
                                            href="${escapeAttribute(
                                                source.url
                                            )}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            ${title}
                                        </a>
                                    `

                                    : title;


                            return `

                                <li>

                                    <div class="reference-heading">

                                        ${linkedTitle}

                                        ${type}

                                    </div>

                                    ${notes}

                                </li>

                            `;

                        }
                    )
                    .join("")}

            </ol>

        </section>

    `;

}



/* =========================================================
   OPTIONAL INLINE LINKS
   ========================================================= */

/*
 * Allows links inside paragraph text using:
 *
 * [link text](https://example.com)
 */

function renderInlineLinks(text) {

    const escaped =
        escapeHTML(
            text || ""
        );


    return escaped.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        (
            match,
            label,
            url
        ) => {

            return `
                <a
                    href="${escapeAttribute(url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${label}
                </a>
            `;

        }
    );

}

/* =========================================================
   PDF
   ========================================================= */

function renderPDF(pdf) {

    if (
        !pdf ||
        !pdf.src
    ) {
        return "";
    }


    const title =
        escapeHTML(
            pdf.title ||
            "PDF Document"
        );


    const description =
        pdf.description

            ? `
                <p class="source-pdf-description">
                    ${escapeHTML(
                        pdf.description
                    )}
                </p>
            `

            : "";


    return `

        <div class="source-pdf-card">

            <div class="source-pdf-icon">
                📄
            </div>


            <div class="source-pdf-content">

                <h4>
                    ${title}
                </h4>

                ${description}


                <a
                    href="${escapeAttribute(
                        pdf.src
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="source-pdf-link"
                >
                    View PDF ↗
                </a>

            </div>

        </div>

    `;

}

/* =========================================================
   ARTICLE ID
   ========================================================= */

function getPostId(post) {

    if (post.id) {

        return String(
            post.id
        );

    }


    return String(
        post.year ||
        post.title ||
        "source"
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-|-$/g,
            ""
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



/* =========================================================
   START
   ========================================================= */

loadSources();
