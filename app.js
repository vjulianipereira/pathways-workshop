const API_URL =
    "https://script.google.com/macros/s/AKfycbxyuIV5Z_4iSWnj_JM2dKLq6FW5U4glq5mSRXa3CQLy6JFjQDuXYUoxmFXyL06_x1WI/exec";

const pathways = [
    "Optimise Flexibility",
    "Monetise Flexibility",
    "Collectivise Flexibility",
    "Democratic Flexibility",
    "Alternative to Flexibility"
];

let criteria = [];

let currentPathway = 0;

const responses = {};

const weights = {};

const results = {};

const participantId =
    "P" + Date.now();
let taskCompleted = false;

window.onload = function () {

    showWelcomeScreen();

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
                During this exercise you will:
            </p>

            <ul>
                <li>Score 5 flexibility pathways</li>
                <li>Define uncertainty ranges</li>
                <li>Weight the importance of evaluation criteria</li>
            </ul>

            <p>
                Estimated completion time: 5 minutes.
            </p>

            <div class="button-row">

                <button id="startBtn">
                    Start Survey
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

                <div id="slider${index}"></div>

                <div class="scale-labels">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                </div>

                <p>
                    Min:
                    <span id="minValue${index}">20</span>

                    &nbsp;&nbsp;&nbsp;

                    Max:
                    <span id="maxValue${index}">80</span>
                </p>

            </div>
        `;

    });

    html += `
        <button id="nextBtn">
            ${currentPathway < pathways.length - 1 ? "Next" : "Weight Criteria"}
        </button>

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

            step: 5,

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

function saveAndNext() {

    const pathwayName = pathways[currentPathway];

    responses[pathwayName] = {};

    criteria.forEach((criterion, index) => {

        const slider =
            document.getElementById(`slider${index}`);

        const values =
            slider.noUiSlider.get();

        responses[pathwayName][criterion] = {
            min: Number(values[0]),
            max: Number(values[1])
        };

    });

    console.log(responses);

    currentPathway++;

    if (currentPathway < pathways.length) {
    
        renderPathway();
    
    } else {
    
        renderWaitingRoom();
    
    }

}

function startStagePolling() {

    checkStage();

    setInterval(
        checkStage,
        15000
    );

}

async function checkStage() {

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

    const survey =
        document.getElementById("survey");

    let html = `
        <div class="card">

            <h2>Criteria Importance</h2>
            
            <p>
                Allocate exactly 5 importance points.
            </p>
    `;

    criteria.forEach((criterion, index) => {

        if (!weights[criterion]) {
            weights[criterion] = 0;
        }

        html += `
            <div class="weight-row">

                <span>${criterion}</span>

                <div>

                    <button
                        class="minus-btn"
                        data-criterion="${criterion}">
                        -
                    </button>

                    <span
                        id="weight-${index}"
                        class="weight-value">
                        ${weights[criterion]}
                    </span>

                    <button
                        class="plus-btn"
                        data-criterion="${criterion}">
                        +
                    </button>

                </div>

            </div>
        `;

    });

    html += `

            <div class="allocation">

                Total Allocated:
                <span id="totalAllocated">
                    ${getTotalWeight()}
                </span>
                / 5

            </div>

            <div class="button-row">

                <button
                    id="submitBtn"
                    ${getTotalWeight() !== 5 ? "disabled" : ""}
                >
                    Complete Task
                </button>

            </div>

        </div>
    `;

    survey.innerHTML = html;

    attachWeightEvents();

}

function getTotalWeight() {

    return Object.values(weights)
        .reduce((sum, value) => sum + value, 0);

}

function attachWeightEvents() {

    document
        .querySelectorAll(".plus-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                const criterion =
                    button.dataset.criterion;

                if (getTotalWeight() < 5) {

                    weights[criterion]++;

                    renderWeightingPage();

                }

            });

        });

    document
        .querySelectorAll(".minus-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                const criterion =
                    button.dataset.criterion;

                if (weights[criterion] > 0) {

                    weights[criterion]--;

                    renderWeightingPage();

                }

            });

        });

    document
    .getElementById("submitBtn")
    .addEventListener("click", () => {

        if (getTotalWeight() !== 5) {

            alert(
                "Please allocate exactly 5 weighting points before submitting."
            );

            return;
        }

        submitSurvey();

    });

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

    let totalWeightedScore = 0;

    let totalWeight = 0;

    criteria.forEach(criterion => {

        const weight =
            weights[criterion];

        const score =
            responses[pathway][criterion];

        const midpoint =
            (
                score.min +
                score.max
            ) / 2;

        totalWeightedScore +=
            midpoint * weight;

        totalWeight += weight;

    });

    return totalWeightedScore / totalWeight;

}

async function submitSurvey() {

    const survey =
        document.getElementById("survey");

    survey.innerHTML = `
        <div class="card">
            <h2>Submitting...</h2>
        </div>
    `;

    try {

        pathways.forEach(pathway => {

            const unweighted =
                calculateUnweightedAverage(
                    pathway
                );
        
            const weighted =
                calculateWeightedAverage(
                    pathway
                );
        
            results[pathway] = {
        
                unweighted:
                    unweighted,
        
                weighted:
                    weighted,
        
                difference:
                    weighted - unweighted
        
            };
        
        });

        console.log("RESULTS BEING SENT");
        console.log(results);

        console.log(
            "RESULTS POPULATED"
        );
        
        console.log(
            JSON.stringify(
                results,
                null,
                2
            )
        );


        await fetch(API_URL, {

    method: "POST",

    mode: "no-cors",

    body: JSON.stringify({
    
        participantId,
    
        responses,
    
        weights,
    
        results
    
    })

});
        
        taskCompleted = true;
        
        // localStorage.setItem(
        //     "surveySubmitted",
        //     "true"
        // );
        survey.innerHTML = `
            <div class="card">
        
                <h2>
                    Task Complete
                </h2>
        
                <p>
                    Thank you for participating.
                </p>
        
                <p>
                    Please return your attention
                    to the workshop facilitator.
                </p>
        
            </div>
        `;

    }

    catch (error) {

        console.error(error);

        survey.innerHTML = `
            <div class="card">

                <h2>Submission Failed</h2>

                <p>
                    Please notify the facilitator.
                </p>

            </div>
        `;

    }

}
