const API_URL =
    "https://script.google.com/macros/s/AKfycbxyuIV5Z_4iSWnj_JM2dKLq6FW5U4glq5mSRXa3CQLy6JFjQDuXYUoxmFXyL06_x1WI/exec";

const pathways = [
    "Optimise Flexibility",
    "Monetise Flexibility",
    "Collectivise Flexibility",
    "Democratise Flexibility",
    "Sufficiency not Flexibility"
];

let workshopId = "";

let weightBudget = 0;

let participantId = "";

let criteria = [];

let currentPathway = 0;

const responses = {};

const weights = {};

let taskCompleted = false;

let pollingInterval = null;

let scoringSubmissionInProgress =
    false;

let scoringSubmitted =
    false;

let weightingSubmissionInProgress =
    false;

window.onload = function () {

    showWelcomeScreen();

        if (
        localStorage.getItem(
            "taskCompleted"
        )
    ) {
    
        taskCompleted = true;
    
    }

};

function showWelcomeScreen() {

    const survey =
        document.getElementById("survey");

    survey.innerHTML = `
        <div class="card">

            <h2>Welcome</h2>

            <p>
                Welcome to the Pathways to Flexibility workshop.
            </p>

            <p>
                During this exercise, you will score the 5 pathways to energy demand flexibility against the criteria you helped develop.
            </p>
            <p>
                Estimated completion time: 5 minutes.
            </p>

            <div class="button-row">

                <button
                    id="startBtn"
                    class="app-button app-button-primary"
                    type="button">
                    Start Survey
                    <span class="button-arrow" aria-hidden="true">→</span>
                </button>

            </div>

        </div>
    `;

    document
        .getElementById("startBtn")
        .addEventListener("click", loadCriteria);

}

async function loadCriteria() {

    const survey =
        document.getElementById("survey");

    survey.innerHTML =
        "<p>Loading workshop criteria...</p>";

    try {

        const response =
            await fetch(API_URL);

        const text =
            await response.text();

        const data =
            JSON.parse(text);

        criteria =
            data.criteria;

        workshopId =
            String(data.workshopId);

        const submissionKey =
            `surveySubmitted_${workshopId}`;
        
        if (
            localStorage.getItem(
                submissionKey
            )
        ) {
        
            survey.innerHTML = `
        
                <div class="card">
        
                    <h2>
                        Task Already Completed
                    </h2>
        
                    <p>
                        This device has already
                        submitted a response
                        for this workshop.
                    </p>
        
                    <p>
                        Please return your attention
                        to the workshop facilitator.
                    </p>
        
                </div>
        
            `;
        
            return;
        
        }
        
        weightBudget =
            Number(data.weightBudget);
        
        participantId =
            workshopId +
            "-P" +
            Date.now() +
            "-" +
            Math.floor(
                Math.random() * 100000
            );

            if (
                !workshopId ||
                !criteria.length ||
                weightBudget < 1
            ) {
            
                throw new Error(
                    "Workshop configuration is incomplete."
                );
            
            }

        renderPathway();

    }

    catch (error) {

        survey.innerHTML = `
            <p style="color:red">
                Failed to load criteria.
            </p>
        `;

        console.error(error);

    }

}

function renderPathway() {

    const survey = document.getElementById("survey");

    let html = `
        <div class="card">
            <h2>${pathways[currentPathway]}</h2>
    `;

    criteria.forEach((criterion, index) => {

        html += `
            <div class="criterion">

                <h3>${criterion}</h3>

                <div class="slider-wrapper">
                
                    <div id="slider${index}"></div>
                
                </div>
                
                <div class="scale-labels">
                
                    <span class="scale-start">0</span>
                
                    <span class="scale-middle">50</span>
                
                    <span class="scale-end">100</span>
                
                </div>

                <p>
                    Pessimistic Scenario:
                    <span id="minValue${index}">20</span>

                    &nbsp;&nbsp;&nbsp;

                    Optimistic Scenario:
                    <span id="maxValue${index}">80</span>
                </p>

            </div>
        `;

    });

        html += `
        
            <div class="survey-navigation">
        
                <div class="pathway-progress">
                    Pathway ${currentPathway + 1} of ${pathways.length}
                </div>
        
                <button
                    id="nextBtn"
                    class="app-button app-button-primary"
                    type="button">
        
                    ${
                        currentPathway < pathways.length - 1
                            ? "Next Pathway"
                            : "Finish Scoring"
                    }
        
                    <span
                        class="button-arrow"
                        aria-hidden="true">
                        →
                    </span>
        
                </button>
        
            </div>
        
            </div>
        `;

    survey.innerHTML = html;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    criteria.forEach((criterion, index) => {

        const slider = document.getElementById(`slider${index}`);

        noUiSlider.create(slider, {

            start: [20, 80],

            connect: true,

            step: 1,

            range: {
                min: 0,
                max: 100
            }

        });

        slider.noUiSlider.on("update", function (values) {

            document.getElementById(`minValue${index}`).textContent =
                Math.round(values[0]);

            document.getElementById(`maxValue${index}`).textContent =
                Math.round(values[1]);

        });

    });

    document
        .getElementById("nextBtn")
        .addEventListener("click", saveAndNext);

}

async function waitForSubmissionStatus(
    phase
) {

    const maximumAttempts =
        20;

    for (
        let attempt = 1;
        attempt <= maximumAttempts;
        attempt++
    ) {

        await new Promise(
            resolve => {

                setTimeout(
                    resolve,
                    1000
                );

            }
        );

        const statusUrl =
            API_URL +
            "?action=submissionStatus" +
            "&workshopId=" +
            encodeURIComponent(
                workshopId
            ) +
            "&participantId=" +
            encodeURIComponent(
                participantId
            ) +
            "&cacheBust=" +
            Date.now();

        const response =
            await fetch(
                statusUrl
            );

        if (!response.ok) {

            throw new Error(
                "Could not check submission status."
            );

        }

        const status =
            await response.json();

        console.log(
            "Submission status:",
            phase,
            status
        );

        if (
            phase === "SCORING" &&
            status.scoringPathwayCount >=
                pathways.length
        ) {

            return status;

        }

        if (
            phase === "WEIGHTING" &&
            status.weightedPathwayCount >=
                pathways.length &&
            status.weightCount >=
                criteria.length
        ) {

            return status;

        }

    }

    throw new Error(
        phase +
        " submission was not confirmed " +
        "within 20 seconds."
    );

}

function buildUnweightedResults() {

    const unweightedResults =
        {};

    pathways.forEach(pathway => {

        unweightedResults[pathway] =
            calculateUnweightedAverage(
                pathway
            );

    });

    return unweightedResults;

}

async function submitScoringPhase() {

    if (
        scoringSubmissionInProgress ||
        scoringSubmitted
    ) {

        return;

    }

    scoringSubmissionInProgress =
        true;

    const survey =
        document.getElementById(
            "survey"
        );

    survey.innerHTML = `

        <div class="card">

            <h2>
                Saving Scores...
            </h2>

            <p>
                Please wait while your
                pathway scores are recorded.
            </p>

        </div>

    `;

    try {

        const unweightedResults =
            buildUnweightedResults();

        const payload = {

            action:
                "submitScoring",

            workshopId:
                workshopId,

            participantId:
                participantId,

            responses:
                responses,

            unweightedResults:
                unweightedResults

        };

        console.log(
            "Submitting scoring payload:",
            payload
        );

        await fetch(API_URL, {

            method: "POST",

            mode: "no-cors",

            body:
                JSON.stringify(
                    payload
                )

        });

        console.log(
            "Scoring POST request sent."
        );

        const status =
            await waitForSubmissionStatus(
                "SCORING"
            );

        console.log(
            "Scoring submission confirmed:",
            status
        );

        scoringSubmitted =
            true;

        renderWaitingRoom();

    }

    catch (error) {

        console.error(
            "Scoring submission error:",
            error
        );

        survey.innerHTML = `

            <div class="card">

                <h2>
                    Scores Could Not Be Saved
                </h2>

                <p>
                    ${error.message}
                </p>

                <p>
                    Check your connection
                    and try again.
                </p>

                <div class="button-row">

                    <button
                        id="retryScoringBtn"
                        class="app-button app-button-primary"
                        type="button">
                        Try Again
                    </button>

                </div>

            </div>

        `;

        document
            .getElementById(
                "retryScoringBtn"
            )
            .addEventListener(
                "click",
                submitScoringPhase
            );

    }

    finally {

        scoringSubmissionInProgress =
            false;

    }

}

async function saveAndNext() {

    const nextButton =
        document.getElementById(
            "nextBtn"
        );

    if (nextButton) {

        nextButton.disabled =
            true;

    }

    const pathwayName =
        pathways[
            currentPathway
        ];

    responses[pathwayName] =
        {};

    criteria.forEach(
        (criterion, index) => {

            const slider =
                document.getElementById(
                    `slider${index}`
                );

            const values =
                slider
                    .noUiSlider
                    .get();

            responses[pathwayName][criterion] = {

                min:
                    Number(
                        values[0]
                    ),

                max:
                    Number(
                        values[1]
                    )

            };

        }
    );

    console.log(
        "Stored pathway responses:",
        pathwayName,
        responses[pathwayName]
    );

    currentPathway++;

    if (
        currentPathway <
        pathways.length
    ) {

        renderPathway();

        return;

    }

    await submitScoringPhase();

}

function startStagePolling() {

    checkStage();

    if (pollingInterval) {

        clearInterval(
            pollingInterval
        );

    }

    pollingInterval =
        setInterval(
            checkStage,
            15000
        );

}

async function checkStage() {
    if (taskCompleted) {
    
        return;
    
    }
    try {

        const response =
            await fetch(
                API_URL +
                "?action=stage"
            );

        const data =
            await response.json();

        const status =
            document.getElementById(
                "stageStatus"
            );

        if (status) {

            status.textContent =
                "Current stage: " +
                data.stage;

        }

        if (
            data.stage ===
            "WEIGHTING"
            &&
            !taskCompleted
        ) {
        
            if (pollingInterval) {
        
                clearInterval(
                    pollingInterval
                );
        
                pollingInterval = null;
        
            }
        
            renderWeightingPage();
        
        }

    }

    catch (error) {

        console.error(error);

    }

}

function renderWaitingRoom() {

    const survey =
        document.getElementById(
            "survey"
        );

    survey.innerHTML = `

        <div class="card">

            <h2>
                Assessment Complete
            </h2>

            <p>
                Thank you for completing
                the pathway assessment.
            </p>

            <p>
                Please wait for
                instructions from the
                facilitator.
            </p>

            <h3 id="stageStatus">
                Current stage:
                SCORING
            </h3>

        </div>

    `;

    startStagePolling();

}

function renderWeightingPage() {

    if (taskCompleted) {

        return;

    }

    const survey =
        document.getElementById(
            "survey"
        );

    const totalAllocated =
        getTotalWeight();

    const remainingVotes =
        weightBudget -
        totalAllocated;

    let html = `

        <div class="card">

            <h2>
                Criteria Importance
            </h2>

            <p>
                Allocate your
                <strong>${weightBudget} votes</strong>
                across the criteria.
            </p>

            <p class="weighting-instructions">

                Select circles to allocate votes.

                You may give several votes to one
                criterion and no votes to another.

                Criteria receiving no additional votes
                retain their baseline influence.

            </p>

            <div class="vote-budget-summary">

                <div>

                    Votes allocated:

                    <strong>
                        ${totalAllocated}
                    </strong>

                    of

                    <strong>
                        ${weightBudget}
                    </strong>

                </div>

                <div>

                    Votes remaining:

                    <strong
                        class="${
                            remainingVotes === 0
                                ? "vote-budget-complete"
                                : ""
                        }">

                        ${remainingVotes}

                    </strong>

                </div>

            </div>

    `;

    criteria.forEach(
        (criterion, criterionIndex) => {

            if (
                weights[criterion] ===
                undefined
            ) {

                weights[criterion] = 0;

            }

            const allocatedVotes =
                Number(
                    weights[criterion]
                );

            let voteCircles = "";

            for (
                let voteNumber = 1;
                voteNumber <= weightBudget;
                voteNumber++
            ) {

                const isFilled =
                    voteNumber <=
                    allocatedVotes;

                const additionalVotesRequired =
                    Math.max(
                        voteNumber -
                        allocatedVotes,
                        0
                    );

                const exceedsRemainingBudget =
                    additionalVotesRequired >
                    remainingVotes;

                voteCircles += `

                    <button
                        class="
                            vote-circle
                            ${
                                isFilled
                                    ? "vote-circle-filled"
                                    : ""
                            }
                        "
                        type="button"

                        data-criterion-index="${criterionIndex}"

                        data-vote-number="${voteNumber}"

                        aria-label="${criterion}: allocate ${voteNumber} ${
                            voteNumber === 1
                                ? "vote"
                                : "votes"
                        }"

                        aria-pressed="${
                            voteNumber ===
                            allocatedVotes
                        }"

                        ${
                            exceedsRemainingBudget
                                ? "disabled"
                                : ""
                        }>

                        <span aria-hidden="true">

                            ${
                                isFilled
                                    ? "✓"
                                    : ""
                            }

                        </span>

                    </button>

                `;

            }

            html += `

                <div class="criterion-vote-row">

                    <div class="criterion-vote-header">

                        <span class="criterion-vote-name">

                            ${criterion}

                        </span>

                        <span class="criterion-vote-value">

                            ${allocatedVotes}

                            ${
                                allocatedVotes === 1
                                    ? "vote"
                                    : "votes"
                            }

                        </span>

                    </div>

                    <div class="vote-control-row">

                        <div
                            class="vote-circles"
                            role="group"
                            aria-label="Votes allocated to ${criterion}">

                            ${voteCircles}

                        </div>

                        <button
                            class="clear-criterion-votes"
                            type="button"
                            data-criterion-index="${criterionIndex}"

                            ${
                                allocatedVotes === 0
                                    ? "disabled"
                                    : ""
                            }>

                            Clear

                        </button>

                    </div>

                </div>

            `;

        }
    );

    html += `

            <div class="allocation">

                Total allocated:

                <strong id="totalAllocated">

                    ${totalAllocated}

                </strong>

                /

                <strong>

                    ${weightBudget}

                </strong>

            </div>

            <div class="button-row">

                <button
                    id="submitBtn"
                    class="app-button app-button-primary"
                    type="button"

                    ${
                        totalAllocated !==
                        weightBudget
                            ? "disabled"
                            : ""
                    }>

                    Complete Task

                    <span
                        class="button-arrow"
                        aria-hidden="true">
                        →
                    </span>

                </button>

            </div>

        </div>

    `;

    survey.innerHTML =
        html;

    attachWeightEvents();

}

function getTotalWeight() {

    return Object.values(
        weights
    ).reduce(
        (sum, value) =>
            sum +
            Number(value || 0),
        0
    );

}

function attachWeightEvents() {

    document
        .querySelectorAll(
            ".vote-circle"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const criterionIndex =
                        Number(
                            button.dataset
                                .criterionIndex
                        );

                    const selectedVotes =
                        Number(
                            button.dataset
                                .voteNumber
                        );

                    const criterion =
                        criteria[
                            criterionIndex
                        ];

                    if (
                        !criterion ||
                        !Number.isFinite(
                            selectedVotes
                        )
                    ) {

                        return;

                    }

                    const currentVotes =
                        Number(
                            weights[criterion] ||
                            0
                        );

                    /*
                     * Clicking the currently selected
                     * value removes all votes from
                     * that criterion.
                     */

                    const proposedVotes =
                        selectedVotes ===
                        currentVotes
                            ? 0
                            : selectedVotes;

                    const proposedTotal =
                        getTotalWeight() -
                        currentVotes +
                        proposedVotes;

                    if (
                        proposedTotal >
                        weightBudget
                    ) {

                        alert(
                            `You only have ${weightBudget} votes to allocate.`
                        );

                        return;

                    }

                    weights[criterion] =
                        proposedVotes;

                    renderWeightingPage();

                }
            );

        });

    document
        .querySelectorAll(
            ".clear-criterion-votes"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const criterionIndex =
                        Number(
                            button.dataset
                                .criterionIndex
                        );

                    const criterion =
                        criteria[
                            criterionIndex
                        ];

                    if (!criterion) {

                        return;

                    }

                    weights[criterion] =
                        0;

                    renderWeightingPage();

                }
            );

        });

    const submitButton =
        document.getElementById(
            "submitBtn"
        );

    submitButton.addEventListener(
        "click",
        () => {

            if (
                getTotalWeight() !==
                weightBudget
            ) {

                alert(
                    `Please allocate all ${weightBudget} votes before submitting.`
                );

                return;

            }

            submitSurvey();

        }
    );

}

function calculateUnweightedAverage(pathway) {

    let total = 0;

    let count = 0;

    criteria.forEach(criterion => {

        const score =
            responses[pathway][criterion];

        const midpoint =
            (
                score.min +
                score.max
            ) / 2;

        total += midpoint;

        count++;

    });

    return total / count;

}

function calculateWeightedAverage(pathway) {

    let totalWeightedScore =
        0;

    let totalEffectiveWeight =
        0;

    criteria.forEach(criterion => {

        const allocatedVotes =
            Number(
                weights[criterion] ||
                0
            );

        /*
         * Every criterion has a baseline
         * weight of 1.
         *
         * Allocated votes increase that
         * influence.
         */

        const effectiveWeight =
            1 +
            allocatedVotes;

        const score =
            responses[pathway][criterion];

        const midpoint =
            (
                score.min +
                score.max
            ) / 2;

        totalWeightedScore +=
            midpoint *
            effectiveWeight;

        totalEffectiveWeight +=
            effectiveWeight;

    });

    return (
        totalWeightedScore /
        totalEffectiveWeight
    );

}

function buildWeightedResults() {

    const weightedResults =
        {};

    pathways.forEach(pathway => {

        const unweighted =
            calculateUnweightedAverage(
                pathway
            );

        const weighted =
            calculateWeightedAverage(
                pathway
            );

        weightedResults[pathway] = {

            weighted:
                weighted,

            difference:
                weighted -
                unweighted

        };

    });

    return weightedResults;

}

async function submitSurvey() {

    if (
        weightingSubmissionInProgress ||
        taskCompleted
    ) {

        return;

    }

    weightingSubmissionInProgress =
        true;

    const survey =
        document.getElementById(
            "survey"
        );

    taskCompleted =
        true;

    if (pollingInterval) {

        clearInterval(
            pollingInterval
        );

        pollingInterval =
            null;

    }

    survey.innerHTML = `

        <div class="card">

            <h2>
                Submitting...
            </h2>

            <p>
                Please wait while your
                criterion weights are recorded.
            </p>

        </div>

    `;

    try {

        if (!scoringSubmitted) {

            await waitForSubmissionStatus(
                "SCORING"
            );

            scoringSubmitted =
                true;

        }

        const weightedResults =
            buildWeightedResults();

        const payload = {

            action:
                "submitWeighting",

            workshopId:
                workshopId,

            participantId:
                participantId,

            weights:
                weights,

            weightedResults:
                weightedResults

        };

        console.log(
            "Submitting weighting payload:",
            payload
        );

        await fetch(API_URL, {

            method: "POST",

            mode: "no-cors",

            body:
                JSON.stringify(
                    payload
                )

        });

        console.log(
            "Weighting POST request sent."
        );

        const status =
            await waitForSubmissionStatus(
                "WEIGHTING"
            );

        console.log(
            "Weighting submission confirmed:",
            status
        );

        localStorage.setItem(
            `surveySubmitted_${workshopId}`,
            "true"
        );

        survey.innerHTML = `

            <div class="card">

                <h2>
                    Task Complete
                </h2>

                <p>
                    Thank you for participating.
                </p>

                <p>
                    Your responses have been recorded.
                </p>

                <p>
                    Please return your attention
                    to the workshop facilitator.
                </p>

            </div>

        `;

    }

    catch (error) {

        console.error(
            "Weighting submission error:",
            error
        );

        taskCompleted =
            false;

        survey.innerHTML = `

            <div class="card">

                <h2>
                    Submission Failed
                </h2>

                <p>
                    ${error.message}
                </p>

                <p>
                    Check your connection
                    and try again.
                </p>

                <div class="button-row">

                    <button
                        id="retryWeightingBtn"
                        class="app-button app-button-primary"
                        type="button">
                        Try Again
                    </button>

                </div>

            </div>

        `;

        document
            .getElementById(
                "retryWeightingBtn"
            )
            .addEventListener(
                "click",
                submitSurvey
            );

    }

    finally {

        weightingSubmissionInProgress =
            false;

    }

}
