const API_BASE =
    "https://script.google.com/macros/s/AKfycbxyuIV5Z_4iSWnj_JM2dKLq6FW5U4glq5mSRXa3CQLy6JFjQDuXYUoxmFXyL06_x1WI/exec";

let activeWorkshopConfig = null;

async function loadWorkshopConfig() {

    try {

        const response =
            await fetch(API_BASE);

        const config =
            await response.json();

        activeWorkshopConfig =
            config;

        const input =
            document.getElementById(
                "criteriaInput"
            );

        input.value =
            config.criteria.join("\n");

        updateCriteriaEditorCount();

        const activeId =
            document.getElementById(
                "activeWorkshopId"
            );

        if (activeId) {

            activeId.textContent =
                config.workshopId;

        }

        const safeMaximum =
    Math.max(
        config.weightBudget,
        1
    );

    document
        .getElementById(
            "weightsGrid"
        )
        .style
        .backgroundImage = `
    
            repeating-linear-gradient(
                to right,
                rgba(148, 163, 184, 0.32) 0,
                rgba(148, 163, 184, 0.32) 1px,
                transparent 1px,
                transparent ${
                    100 / safeMaximum
                }%
            )
    
        `;

        renderWeightsAxis(
            config.weightBudget
        );

    }

    catch (error) {

        console.error(
            "Configuration error:",
            error
        );

    }

}

function getCriteriaFromEditor() {

    const input =
        document.getElementById(
            "criteriaInput"
        );

    return input.value
        .split("\n")
        .map(value =>
            value.trim()
        )
        .filter(Boolean);

}

function updateCriteriaEditorCount() {

    const criteria =
        getCriteriaFromEditor();

    document
        .getElementById(
            "criteriaCount"
        )
        .textContent =
        `${criteria.length} criteria`;

    document
        .getElementById(
            "weightBudgetDisplay"
        )
        .textContent =
        `${criteria.length} weighting points`;

}

async function saveCriteria() {

    const criteria =
        getCriteriaFromEditor();

    if (criteria.length < 1) {

        alert(
            "Enter at least one criterion."
        );

        return;

    }

    const duplicateCount =
        criteria.length -
        new Set(criteria).size;

    if (duplicateCount > 0) {

        alert(
            "Remove duplicate criterion names."
        );

        return;

    }

    const status =
        document.getElementById(
            "criteriaSaveStatus"
        );

    status.textContent =
        "Saving criteria...";

    try {

        await fetch(API_BASE, {

            method: "POST",

            mode: "no-cors",

            body: JSON.stringify({

                action: "saveCriteria",

                criteria: criteria

            })

        });

        status.textContent =
            "Criteria saved.";

        setTimeout(
            () => {

                loadWorkshopConfig();

                loadWeights();

            },
            1200
        );

    }

    catch (error) {

        console.error(error);

        status.textContent =
            "Criteria could not be saved.";

    }

}

async function loadCount() {

    try {

        const response =
            await fetch(
                API_BASE + "?action=count"
            );

        const text =
            await response.text();

        const data =
            JSON.parse(text);
            console.log(data);

        document
            .getElementById("counter")
            .textContent =
            `Participants Completed: ${data.responses}`;

        document
            .getElementById("updated")
            .textContent =
            `Last Updated: ${new Date().toLocaleTimeString()}`;

    }

    catch (error) {

        console.error(
            "Count error:",
            error
        );

    }

}

document
    .getElementById("refreshBtn")
    .addEventListener(
        "click",
        () => {

            loadWorkshopConfig();
            loadStage();
            loadCount();
            loadUnweighted();
            loadWeights();
            loadConsensus();
            loadComparison();
            

        }
    );

loadWorkshopConfig();
loadStage();
loadCount();
loadUnweighted();
loadWeights();
loadConsensus();
loadComparison();


setInterval(() => {

    loadStage();
    loadCount();
    loadUnweighted();
    loadWeights();
    loadConsensus();
    loadComparison();

}, 30000);

async function loadWeights() {

    try {

        if (!activeWorkshopConfig) {
        
            await loadWorkshopConfig();
        
        }

        const response =
            await fetch(
                API_BASE +
                "?action=weights"
            );

        const data =
            await response.json();

        let html = "";

        Object.entries(data)
            .forEach(
                ([criterion, score]) => {

                html += `

                    <div class="comparison-row">

                        <div class="comparison-name">
                    
                            ${criterion}
                            (${score.toFixed(2)})
                    
                        </div>
                    
                        <div class="comparison-track">
                    
                            <div
                                class="criterion-marker"
                                style="
                                    left:${
                                        (
                                            score /
                                            Math.max(
                                                activeWorkshopConfig
                                                    .weightBudget,
                                                1
                                            )
                                        ) * 100
                                    }%;
                                ">
                            </div>
                    
                        </div>
                    
                    </div>
                `;

            });

        document
            .getElementById(
                "weightsChart"
            )
            .innerHTML = html;

    }

    catch (error) {

        console.error(error);

    }

}

async function loadStage() {

    try {

        const response =
            await fetch(
                API_BASE +
                "?action=stage"
            );

        const data =
            await response.json();

        document
            .getElementById(
                "currentStage"
            )
            .textContent =
            `Current Stage: ${data.stage}`

    }

    catch (error) {

        console.error(error);

    }

}

async function updateStage(stage) {

    try {

        await fetch(API_BASE, {

            method: "POST",

            mode: "no-cors",

            body: JSON.stringify({

                action: "setStage",

                stage: stage

            })

        });

        setTimeout(
            loadStage,
            1000
        );

    }

    catch (error) {

        console.error(error);

    }

}

async function loadConsensus() {

    try {

        const response =
            await fetch(
                API_BASE +
                "?action=consensus"
            );

        const data =
            await response.json();

        let html = "";

        Object.entries(data)
            .forEach(
                ([pathway, values]) => {

                html += `

                    <div class="consensus-row">

                        <div class="result-label">

                            ${pathway}

                        </div>

                        <div>

                            Consensus:
                            <strong>
                                ${values.consensus}
                            </strong>

                            |

                            Spread:
                            ${values.spread.toFixed(1)}

                        </div>

                    </div>

                `;

            });

        document
            .getElementById(
                "consensusChart"
            )
            .innerHTML = html;

    }

    catch (error) {

        console.error(error);

    }

}

function renderMcmPathwayRow(
    pathway,
    values
) {

    const extremaStart =
        Number(
            values.extremaStart
        );

    const extremaLength =
        Number(
            values.extremaLength
        );

    const meansStart =
        Number(
            values.meansStart
        );

    const meansLength =
        Number(
            values.meansLength
        );

    const extremaEnd =
        extremaStart +
        extremaLength;

    const meansCentre =
        meansStart +
        (
            meansLength / 2
        );

    const validValues = [

        extremaStart,

        extremaLength,

        extremaEnd,

        meansStart,

        meansLength,

        meansCentre

    ].every(
        value =>
            Number.isFinite(
                value
            )
    );

    if (!validValues) {

        console.error(
            "Invalid MCM chart data:",
            pathway,
            values
        );

        return "";
    }

    return `

        <div class="comparison-row">

            <div
                class="comparison-name"
                title="${pathway}">
                ${pathway}
            </div>

            <div class="comparison-track">

                <div
                    class="mcm-whisker-line"
                    style="
                        left:${extremaStart}%;
                        width:${extremaLength}%;
                    ">
                </div>

                <div
                    class="mcm-whisker-cap"
                    style="
                        left:${extremaStart}%;
                    ">
                </div>

                <div
                    class="mcm-whisker-cap"
                    style="
                        left:${extremaEnd}%;
                    ">
                </div>

                <div
                    class="mcm-means-box"
                    style="
                        left:${meansStart}%;
                        width:${meansLength}%;
                    ">
                </div>

                <div
                    class="mcm-centre-line"
                    style="
                        left:${meansCentre}%;
                    ">
                </div>

            </div>

        </div>

    `;

}

async function loadComparison() {

    const chart =
        document.getElementById(
            "comparisonChart"
        );

    try {

        const response =
            await fetch(
                API_BASE +
                "?action=mcmWeighted" +
                "&cacheBust=" +
                Date.now()
            );

        if (!response.ok) {

            throw new Error(
                "Weighted endpoint returned " +
                response.status
            );

        }

        const data =
            await response.json();

        console.log(
            "WEIGHTED MCM DATA:",
            data
        );

        const entries =
            Object.entries(
                data
            );

        if (!entries.length) {

            chart.innerHTML = `

                <p class="figure-empty-message">
                    No completed weighting
                    responses are available yet.
                </p>

            `;

            return;

        }

        chart.innerHTML =
            entries
                .map(
                    ([pathway, values]) =>

                        renderMcmPathwayRow(
                            pathway,
                            values
                        )

                )
                .join("");

    }

    catch (error) {

        console.error(
            "Weighted chart error:",
            error
        );

        chart.innerHTML = `

            <p class="figure-error-message">
                The weighted figure
                could not be loaded.
            </p>

        `;

    }

}

async function loadUnweighted() {

    const chart =
        document.getElementById(
            "unweightedChart"
        );

    try {

        const response =
            await fetch(
                API_BASE +
                "?action=mcmUnweighted" +
                "&cacheBust=" +
                Date.now()
            );

        if (!response.ok) {

            throw new Error(
                "Unweighted endpoint returned " +
                response.status
            );

        }

        const data =
            await response.json();

        console.log(
            "UNWEIGHTED MCM DATA:",
            data
        );

        const entries =
            Object.entries(
                data
            );

        if (!entries.length) {

            chart.innerHTML = `

                <p class="figure-empty-message">
                    No scoring responses
                    have been submitted yet.
                </p>

            `;

            return;

        }

        chart.innerHTML =
            entries
                .map(
                    ([pathway, values]) =>

                        renderMcmPathwayRow(
                            pathway,
                            values
                        )

                )
                .join("");

    }

    catch (error) {

        console.error(
            "Unweighted chart error:",
            error
        );

        chart.innerHTML = `

            <p class="figure-error-message">
                The unweighted figure
                could not be loaded.
            </p>

        `;

    }

}

function renderWeightsAxis(maximum) {

    const axis =
        document.getElementById(
            "weightsAxis"
        );

    const safeMaximum =
        Math.max(
            Number(maximum),
            1
        );

    let html = "";

    for (
        let value = 0;
        value <= safeMaximum;
        value++
    ) {

        const position =
            (
                value /
                safeMaximum
            ) * 100;

        html += `

            <span
                style="
                    left:${position}%;
                ">
                ${value}
            </span>

        `;

    }

    axis.innerHTML = html;

}

async function saveWorkshop() {

    const confirmed =
        window.confirm(
            "Save and close the current workshop?"
        );

    if (!confirmed) {
        return;
    }

    const status =
        document.getElementById(
            "workshopActionStatus"
        );

    status.textContent =
        "Saving workshop...";

    try {

        await fetch(API_BASE, {

            method: "POST",

            mode: "no-cors",

            body: JSON.stringify({

                action:
                    "saveWorkshop"

            })

        });

        status.textContent =
            "Workshop saved.";

        setTimeout(
            () => {

                loadStage();

                loadWorkshopConfig();

            },
            1200
        );

    }

    catch (error) {

        console.error(error);

        status.textContent =
            "Workshop could not be saved.";

    }

}

async function resetWorkshopFromDashboard() {

    const workshopName =
        window.prompt(
            "Enter a name for the new workshop:"
        );

    if (!workshopName) {
        return;
    }

    const confirmed =
        window.confirm(
            "Create a new workshop? " +
            "The current workshop data " +
            "will remain archived."
        );

    if (!confirmed) {
        return;
    }

    const status =
        document.getElementById(
            "workshopActionStatus"
        );

    status.textContent =
        "Creating new workshop...";

    try {

        await fetch(API_BASE, {

            method: "POST",

            mode: "no-cors",

            body: JSON.stringify({

                action:
                    "resetWorkshop",

                workshopName:
                    workshopName

            })

        });

        status.textContent =
            "New workshop created.";

        setTimeout(
            () => {

                loadWorkshopConfig();

                loadStage();

                loadCount();

                loadUnweighted();

                loadWeights();

                loadComparison();

                loadConsensus();

            },
            1500
        );

    }

    catch (error) {

        console.error(error);

        status.textContent =
            "New workshop could not be created.";

    }

}

document
    .getElementById(
        "scoringBtn"
    )
    .addEventListener(
        "click",
        () => updateStage(
            "SCORING"
        )
    );

document
    .getElementById(
        "weightingBtn"
    )
    .addEventListener(
        "click",
        () => updateStage(
            "WEIGHTING"
        )
    );

document
    .getElementById(
        "completeBtn"
    )
    .addEventListener(
        "click",
        () => updateStage(
            "COMPLETE"
        )
    );

document
    .getElementById(
        "criteriaInput"
    )
    .addEventListener(
        "input",
        updateCriteriaEditorCount
    );

document
    .getElementById(
        "saveCriteriaBtn"
    )
    .addEventListener(
        "click",
        saveCriteria
    );

document
    .getElementById(
        "saveWorkshopBtn"
    )
    .addEventListener(
        "click",
        saveWorkshop
    );

document
    .getElementById(
        "resetWorkshopBtn"
    )
    .addEventListener(
        "click",
        resetWorkshopFromDashboard
    );
