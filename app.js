const API_URL =
    "https://script.google.com/macros/s/AKfycbxyuIV5Z_4iSWnj_JM2dKLq6FW5U4glq5mSRXa3CQLy6JFjQDuXYUoxmFXyL06_x1WI/exec";

const urlParameters =
    new URLSearchParams(
        window.location.search
    );

const accessPhase =
    String(
        urlParameters.get("phase") ||
        "scoring"
    )
    .trim()
    .toLowerCase();

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

let scoringSubmissionInProgress =
    false;

let scoringSubmitted =
    false;

let weightingSubmissionInProgress =
    false;

window.onload = function () {

    if (
        accessPhase ===
        "weighting"
    ) {

        initialiseWeightingAccess();

        return;

    }

    initialiseScoringAccess();

};

function initialiseScoringAccess() {

    showWelcomeScreen();

}

async function initialiseWeightingAccess() {

    const survey =
        document.getElementById(
            "survey"
        );

    survey.innerHTML = `

        <div class="card">

            <p>
                Loading criteria weighting...
            </p>

        </div>

    `;

    try {

        const config =
            await loadWorkshopConfiguration();

        if (!participantId) {

            renderParticipantCodeEntry();
        
            return;
        
        }

        const completedSubmissionKey =
            `surveySubmitted_${workshopId}`;

        if (
            localStorage.getItem(
                completedSubmissionKey
            )
        ) {

            renderTaskAlreadyCompleted();

            return;

        }

        const scoringStatus =
            await getParticipantSubmissionStatus();

        if (
            scoringStatus.scoringPathwayCount <
            pathways.length
        ) {

            renderScoringRequired();

            return;

        }

        scoringSubmitted =
            true;

        if (
            String(
                config.stage
            ).trim() !==
            "WEIGHTING"
        ) {

            renderWeightingNotOpen();

            return;

        }

        renderWeightingPage();

    }

    catch (error) {

        console.error(
            "Weighting access error:",
            error
        );

        survey.innerHTML = `

            <div class="card">

                <h2>
                    Weighting Could Not Be Loaded
                </h2>

                <p>
                    ${error.message}
                </p>

                <div class="button-row">

                    <button
                        id="retryWeightingAccessBtn"
                        class="app-button app-button-primary"
                        type="button">

                        Try Again

                    </button>

                </div>

            </div>

        `;

        document
            .getElementById(
                "retryWeightingAccessBtn"
            )
            .addEventListener(
                "click",
                initialiseWeightingAccess
            );

    }

}

async function getParticipantSubmissionStatus() {

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
            "Participant submission status could not be checked."
        );

    }

    return response.json();

}

function renderScoringRequired() {

    const survey =
        document.getElementById(
            "survey"
        );

    survey.innerHTML = `

        <div class="card">

            <h2>
                Scoring Required
            </h2>

            <p>
                No completed pathway scoring
                was found for this device.
            </p>

            <p>
                Please scan the
                <strong>Pathway Scoring QR code</strong>
                and complete scoring first.
            </p>

            <div class="participant-recovery-form">

            <label for="participantCodeInput">
        
                If you completed scoring in another
                browser, enter your participant code:
        
            </label>
        
            <input
                id="participantCodeInput"
                type="text"
                autocomplete="off"
                placeholder="Participant code">
        
            <button
                id="recoverParticipantBtn"
                class="app-button app-button-primary"
                type="button">
        
                Continue
        
            </button>
        
            <p id="participantRecoveryStatus"></p>

        </div>

    `;

    document
    .getElementById(
        "recoverParticipantBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const input =
                document.getElementById(
                    "participantCodeInput"
                );

            const code =
                input.value.trim();

            if (!code) {

                return;

            }

            participantId =
                code;

            const status =
                await getParticipantSubmissionStatus();

            if (
                status.scoringPathwayCount <
                pathways.length
            ) {

                document
                    .getElementById(
                        "participantRecoveryStatus"
                    )
                    .textContent =
                    "No completed scoring was found for that code.";

                return;

            }

            localStorage.setItem(
                `participantId_${workshopId}`,
                participantId
            );

            initialiseWeightingAccess();

        }
    );

}

function renderParticipantCodeEntry() {

    const survey =
        document.getElementById(
            "survey"
        );

    survey.innerHTML = `

        <div class="card">

            <h2>
                Enter Your Initials
            </h2>

            <p>
                Enter the same full-name initials
                used for pathway scoring.
            </p>

            <p class="initials-guidance">

                For example, Vinicius Juliani Pereira
                would enter

                <strong>VJP</strong>.

            </p>

            <div class="participant-initials-form">

                <label
                    for="participantInitialsInput">

                    Full-name initials

                </label>

                <input
                    id="participantInitialsInput"
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    autocapitalize="characters"
                    maxlength="8"
                    placeholder="Example: VJP">

                <p
                    id="participantInitialsStatus"
                    class="participant-initials-status">
                </p>

                <div class="button-row">

                    <button
                        id="continueWeightingBtn"
                        class="app-button app-button-primary"
                        type="button">

                        Continue to Weighting

                    </button>

                </div>

            </div>

        </div>

    `;

    const input =
        document.getElementById(
            "participantInitialsInput"
        );

    input.focus();

    input.addEventListener(
        "input",
        () => {

            input.value =
                normaliseInitials(
                    input.value
                );

        }
    );

    document
        .getElementById(
            "continueWeightingBtn"
        )
        .addEventListener(
            "click",
            recoverParticipantByInitials
        );

}

async function recoverParticipantByInitials() {

    const input =
        document.getElementById(
            "participantInitialsInput"
        );

    const statusElement =
        document.getElementById(
            "participantInitialsStatus"
        );

    const button =
        document.getElementById(
            "continueWeightingBtn"
        );

    const initials =
        normaliseInitials(
            input.value
        );

    if (
        initials.length < 2
    ) {

        statusElement.textContent =
            "Enter the initials used during scoring.";

        return;

    }

    button.disabled =
        true;

    statusElement.textContent =
        "Checking scoring submission...";

    const recoveredParticipantId =
        buildParticipantIdFromInitials(
            initials
        );

    participantId =
        recoveredParticipantId;

    try {

        const status =
            await getParticipantSubmissionStatus();

        if (
            status.scoringPathwayCount <
            pathways.length
        ) {

            participantId =
                "";

            statusElement.textContent =
                "No completed scoring was found " +
                "for these initials.";

            button.disabled =
                false;

            return;

        }

        storeParticipantIdentity(
            initials
        );

        initialiseWeightingAccess();

    }

    catch (error) {

        participantId =
            "";

        console.error(
            "Initials recovery error:",
            error
        );

        statusElement.textContent =
            "The scoring submission could not be checked.";

        button.disabled =
            false;

    }

}

function renderWeightingNotOpen() {

    const survey =
        document.getElementById(
            "survey"
        );

    survey.innerHTML = `

        <div class="card">

            <h2>
                Criteria Weighting Not Open
            </h2>

            <p>
                Your pathway scores
                have been recorded.
            </p>

            <p>
                Please wait until the facilitator
                opens the criteria-weighting stage.
            </p>

            <div class="button-row">

                <button
                    id="checkWeightingStageBtn"
                    class="app-button app-button-primary"
                    type="button">

                    Check Again

                </button>

            </div>

        </div>

    `;

    document
        .getElementById(
            "checkWeightingStageBtn"
        )
        .addEventListener(
            "click",
            initialiseWeightingAccess
        );

}

function renderTaskAlreadyCompleted() {

    const survey =
        document.getElementById(
            "survey"
        );

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

}

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
        .getElementById(
            "startBtn"
        )
        .addEventListener(
            "click",
            beginScoringAccess
        );

}

async function beginScoringAccess() {

    const survey =
        document.getElementById(
            "survey"
        );

    survey.innerHTML = `

        <div class="card">

            <p>
                Loading workshop...
            </p>

        </div>

    `;

    try {

        await loadWorkshopConfiguration();

        const completedSubmissionKey =
            `surveySubmitted_${workshopId}`;

        if (
            localStorage.getItem(
                completedSubmissionKey
            )
        ) {

            renderTaskAlreadyCompleted();

            return;

        }

        const existingInitials =
            getStoredParticipantInitials();

        if (
            participantId &&
            existingInitials
        ) {

            const status =
                await getParticipantSubmissionStatus();

            if (
                status.scoringPathwayCount >=
                pathways.length
            ) {

                renderScoringComplete();

                return;

            }

            renderInitialsConfirmation(
                existingInitials
            );

            return;

        }

        renderInitialsEntry();

    }

    catch (error) {

        console.error(
            "Scoring access error:",
            error
        );

        survey.innerHTML = `

            <div class="card">

                <h2>
                    Workshop Could Not Be Loaded
                </h2>

                <p>
                    ${error.message}
                </p>

                <div class="button-row">

                    <button
                        id="retryScoringAccessBtn"
                        class="app-button app-button-primary"
                        type="button">

                        Try Again

                    </button>

                </div>

            </div>

        `;

        document
            .getElementById(
                "retryScoringAccessBtn"
            )
            .addEventListener(
                "click",
                beginScoringAccess
            );

    }

}

function renderInitialsEntry(
    message = ""
) {

    const survey =
        document.getElementById(
            "survey"
        );

    survey.innerHTML = `

        <div class="card">

            <h2>
                Participant Initials
            </h2>

            <p>
                Enter the initials of your full name.
            </p>

            <p class="initials-guidance">

                For example, Vinicius Juliani Pereira
                would enter

                <strong>VJP</strong>.

                You will use the same initials
                to access criteria weighting later.

            </p>

            <div class="participant-initials-form">

                <label
                    for="participantInitialsInput">

                    Full-name initials

                </label>

                <input
                    id="participantInitialsInput"
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    autocapitalize="characters"
                    maxlength="8"
                    placeholder="Example: VJP">

                <p
                    id="participantInitialsStatus"
                    class="participant-initials-status">

                    ${message}

                </p>

                <div class="button-row">

                    <button
                        id="continueToScoringBtn"
                        class="app-button app-button-primary"
                        type="button">

                        Continue to Scoring

                        <span
                            class="button-arrow"
                            aria-hidden="true">
                            →
                        </span>

                    </button>

                </div>

            </div>

        </div>

    `;

    const input =
        document.getElementById(
            "participantInitialsInput"
        );

    input.focus();

    input.addEventListener(
        "input",
        () => {

            input.value =
                normaliseInitials(
                    input.value
                );

        }
    );

    document
        .getElementById(
            "continueToScoringBtn"
        )
        .addEventListener(
            "click",
            checkInitialsAndStartScoring
        );

}

async function checkInitialsAndStartScoring() {

    const input =
        document.getElementById(
            "participantInitialsInput"
        );

    const statusElement =
        document.getElementById(
            "participantInitialsStatus"
        );

    const button =
        document.getElementById(
            "continueToScoringBtn"
        );

    const initials =
        normaliseInitials(
            input.value
        );

    if (
        initials.length < 2
    ) {

        statusElement.textContent =
            "Enter at least two initials.";

        return;

    }

    button.disabled =
        true;

    statusElement.textContent =
        "Checking initials...";

    const proposedParticipantId =
        buildParticipantIdFromInitials(
            initials
        );

    participantId =
        proposedParticipantId;

    try {

        const status =
            await getParticipantSubmissionStatus();

        if (
            status.scoringPathwayCount > 0
        ) {

            participantId =
                "";

            statusElement.textContent =
                "These initials have already been used " +
                "in this workshop. Add another letter, " +
                "such as the second letter of your surname.";

            button.disabled =
                false;

            return;

        }

        storeParticipantIdentity(
            initials
        );

        currentPathway =
            0;

        renderPathway();

    }

    catch (error) {

        participantId =
            "";

        console.error(
            "Initials check error:",
            error
        );

        statusElement.textContent =
            "Initials could not be checked. Try again.";

        button.disabled =
            false;

    }

}

function renderInitialsConfirmation(
    initials
) {

    const survey =
        document.getElementById(
            "survey"
        );

    survey.innerHTML = `

        <div class="card">

            <h2>
                Continue as ${initials}?
            </h2>

            <p>
                This device is currently linked
                to participant initials
                <strong>${initials}</strong>.
            </p>

            <div class="button-row">

                <button
                    id="confirmInitialsBtn"
                    class="app-button app-button-primary"
                    type="button">

                    Continue Scoring

                </button>

                <button
                    id="changeInitialsBtn"
                    class="app-button"
                    type="button">

                    Use Different Initials

                </button>

            </div>

        </div>

    `;

    document
        .getElementById(
            "confirmInitialsBtn"
        )
        .addEventListener(
            "click",
            renderPathway
        );

    document
        .getElementById(
            "changeInitialsBtn"
        )
        .addEventListener(
            "click",
            clearStoredParticipantIdentity
        );

}

function clearStoredParticipantIdentity() {

    localStorage.removeItem(
        `participantId_${workshopId}`
    );

    sessionStorage.removeItem(
        `participantId_${workshopId}`
    );

    localStorage.removeItem(
        `participantInitials_${workshopId}`
    );

    sessionStorage.removeItem(
        `participantInitials_${workshopId}`
    );

    participantId =
        "";

    renderInitialsEntry();

}

function normaliseInitials(value) {

    return String(
        value || ""
    )
        .toUpperCase()
        .replace(
            /[^A-Z]/g,
            ""
        )
        .slice(
            0,
            8
        );

}

function buildParticipantIdFromInitials(
    initials
) {

    return (
        workshopId +
        "-P-" +
        normaliseInitials(
            initials
        )
    );

}

function getStoredParticipantInitials() {

    const participantInitialsKey =
        `participantInitials_${workshopId}`;

    return normaliseInitials(

        localStorage.getItem(
            participantInitialsKey
        ) ||

        sessionStorage.getItem(
            participantInitialsKey
        ) ||

        ""

    );

}

function storeParticipantIdentity(
    initials
) {

    const cleanInitials =
        normaliseInitials(
            initials
        );

    const newParticipantId =
        buildParticipantIdFromInitials(
            cleanInitials
        );

    const participantIdKey =
        `participantId_${workshopId}`;

    const participantInitialsKey =
        `participantInitials_${workshopId}`;

    participantId =
        newParticipantId;

    localStorage.setItem(
        participantIdKey,
        participantId
    );

    sessionStorage.setItem(
        participantIdKey,
        participantId
    );

    localStorage.setItem(
        participantInitialsKey,
        cleanInitials
    );

    sessionStorage.setItem(
        participantInitialsKey,
        cleanInitials
    );

    return participantId;

}

async function loadWorkshopConfiguration() {

    const response =
        await fetch(
            API_URL +
            "?cacheBust=" +
            Date.now()
        );

    if (!response.ok) {

        throw new Error(
            "Workshop configuration could not be loaded."
        );

    }

    const data =
        await response.json();

    criteria =
        Array.isArray(
            data.criteria
        )
            ? data.criteria
            : [];

    workshopId =
        String(
            data.workshopId || ""
        ).trim();

    weightBudget =
        Number(
            data.weightBudget
        );

    if (
        !workshopId ||
        !criteria.length ||
        !Number.isFinite(
            weightBudget
        ) ||
        weightBudget < 1
    ) {

        throw new Error(
            "Workshop configuration is incomplete."
        );

    }

        const participantIdKey =
            `participantId_${workshopId}`;
        
        const storedParticipantId =
        
            localStorage.getItem(
                participantIdKey
            ) ||
        
            sessionStorage.getItem(
                participantIdKey
            );
        
        if (storedParticipantId) {
        
            participantId =
                storedParticipantId;
        
        } else {
        
            participantId =
                "";
        
        }

    return data;

}

async function loadCriteria() {

    const survey =
        document.getElementById(
            "survey"
        );

    survey.innerHTML = `

        <div class="card">

            <p>
                Loading workshop criteria...
            </p>

        </div>

    `;

    try {

        await loadWorkshopConfiguration();

        const scoringSubmissionKey =
            `scoringSubmitted_${workshopId}`;

        const completedSubmissionKey =
            `surveySubmitted_${workshopId}`;

        if (
            localStorage.getItem(
                completedSubmissionKey
            )
        ) {

            renderTaskAlreadyCompleted();

            return;

        }

        if (
            localStorage.getItem(
                scoringSubmissionKey
            )
        ) {

            renderScoringComplete();

            return;

        }

        renderPathway();

    }

    catch (error) {

        console.error(
            "Scoring configuration error:",
            error
        );

        survey.innerHTML = `

            <div class="card">

                <h2>
                    Workshop Could Not Be Loaded
                </h2>

                <p>
                    ${error.message}
                </p>

                <div class="button-row">

                    <button
                        id="retryConfigBtn"
                        class="app-button app-button-primary"
                        type="button">

                        Try Again

                    </button>

                </div>

            </div>

        `;

        document
            .getElementById(
                "retryConfigBtn"
            )
            .addEventListener(
                "click",
                loadCriteria
            );

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
        
        localStorage.setItem(
            `scoringSubmitted_${workshopId}`,
            "true"
        );
        
        renderScoringComplete();

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

function renderScoringComplete() {

    const survey =
        document.getElementById(
            "survey"
        );

    const participantInitials =
        getStoredParticipantInitials() ||
        participantId
            .split("-P-")
            .pop();

    survey.innerHTML = `

        <div class="card">

            <h2>
                Scoring Complete
            </h2>

            <p>
                Your pathway scores
                have been recorded.
            </p>

            <div class="participant-code-card">

                <p>
                    Your initials for
                    criteria weighting are:
                </p>

                <strong class="participant-code">

                    ${participantInitials}

                </strong>

                <p class="participant-code-note">

                    Enter these same initials
                    if the weighting page asks
                    for participant identification.

                </p>

            </div>

            <p>
                Please return your attention
                to the workshop facilitator.
            </p>

            <p>
                When instructed, scan the
                <strong>Criteria Weighting QR code</strong>
                to continue.
            </p>

        </div>

    `;

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
        
                const payload = {
                
                    action:
                        "submitWeighting",
                
                    workshopId:
                        workshopId,
                
                    participantId:
                        participantId,
                
                    weights:
                        weights
                
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
