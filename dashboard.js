const API_BASE =
    "https://script.google.com/macros/s/AKfycbxyuIV5Z_4iSWnj_JM2dKLq6FW5U4glq5mSRXa3CQLy6JFjQDuXYUoxmFXyL06_x1WI/exec";

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
            `Responses Received: ${data.responses}`;

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

async function loadSummary() {

    try {

        const response =
            await fetch(
                API_BASE + "?action=summary"
            );

        const text =
            await response.text();

        const data =
            JSON.parse(text);
        console.log("SUMMARY DATA");
        console.log(data);


        let html = "";

        Object.keys(data).forEach(pathway => {

            const p = data[pathway];

            const leftWhisker =
                p.extremeMin;

            const boxStart =
                p.meanMin;
            
            const median =
                p.meanMid;
            
            const boxEnd =
                p.meanMax;
            
            const rightWhisker =
                p.extremeMax;
            
           html += `
                <div class="summary-row">
                
                    <div class="pathway-name">
                        ${pathway}
                    </div>
                
                    <div class="chart-container">
                
                        <div
                            class="box-range"
                            style="
                                left:${p.meanMin}%;
                                width:${p.meanMax - p.meanMin}%;
                            ">
                        </div>
                
                        <div
                            class="median-line"
                            style="
                                left:${p.meanMid}%;
                            ">
                        </div>
                
                    </div>
                
                </div>
                `;

        });

        console.log(html);
        document
            .getElementById("summaryChart")
            .innerHTML = html;

    }

    catch (error) {

        console.error(
            "Summary error:",
            error
        );

    }

}

document
    .getElementById("refreshBtn")
    .addEventListener(
        "click",
        () => {

            loadCount();
            loadResults();

        }
    );

LoadStage();
loadCount();
loadResults();
loadWeights();

setInterval(() => {

    LoadStage();
    loadCount();
    loadResults();
    loadWeights();

}, 30000);

async function loadResults() {

    try {

        const response =
            await fetch(
                API_BASE +
                "?action=results"
            );

        const data =
            await response.json();

        let html = "";

        Object.entries(data)
            .forEach(
                ([pathway, score]) => {

                html += `

                    <div class="result-row">

                        <div class="result-label">

                            ${pathway}

                        </div>

                        <div class="result-track">

                            <div
                                class="result-bar"
                                style="
                                width:${score}%;
                                ">
                            </div>

                        </div>

                        <div class="result-value">

                            ${score.toFixed(1)}

                        </div>

                    </div>

                `;

            });

        document
            .getElementById(
                "resultsChart"
            )
            .innerHTML = html;

    }

    catch (error) {

        console.error(error);

    }

}

async function loadWeights() {

    try {

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

                const width =
                    (score / 5) * 100;

                html += `

                    <div class="result-row">

                        <div class="result-label">

                            ${criterion}

                        </div>

                        <div class="result-track">

                            <div
                                class="result-bar"
                                style="
                                width:${width}%;
                                ">
                            </div>

                        </div>

                        <div class="result-value">

                            ${score.toFixed(2)}

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
            "Current Stage: " +
            data.stage;

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
