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

            loadStage();
            loadCount();
            loadUnweighted();
            loadResults();
            loadWeights();
            loadUncertainty();
            loadConsensus();
            loadRobustness();
            loadComparison();
            

        }
    );

loadStage();
loadCount();
loadUnweighted();
loadResults();
loadWeights();
loadUncertainty();
loadConsensus();
loadRobustness();
loadComparison();

async function loadUncertainty() {

    try {

        const response =
            await fetch(
                API_BASE +
                "?action=uncertainty"
            );

        const data =
            await response.json();

        let html = "";

        Object.entries(data)
            .forEach(
                ([pathway, values]) => {

                html += `

                    <div class="uncertainty-row">

                        <div class="result-label">

                            ${pathway}

                        </div>

                           <div class="uncertainty-track">

                            <div
                                class="whisker"
                                style="
                                    left:${values.min}%;
                            
                                    width:${
                                        values.max -
                                        values.min
                                    }%;
                                ">
                            </div>
                            
                            <div
                                class="whisker-cap"
                                style="
                                    left:${values.min}%;
                                ">
                            </div>
                            
                            <div
                                class="whisker-cap"
                                style="
                                    left:${values.max}%;
                                ">
                            </div>
                            
                                <div
                                    class="box"
                                    style="
                                        left:${values.q1}%;
                            
                                        width:${
                                            values.q3 -
                                            values.q1
                                        }%;
                                    ">
                                </div>
                            
                                <div
                                    class="mean-line"
                                    style="
                                        left:${values.mean}%;
                                    ">
                                </div>
                            
                            </div>

                        <div class="result-value">

                            ${values.mean.toFixed(1)}

                            (${values.min.toFixed(1)}

                            -

                            ${values.max.toFixed(1)})

                        </div>

                    </div>

                `;

            });

        document
            .getElementById(
                "uncertaintyChart"
            )
            .innerHTML = html;

    }

    catch (error) {

        console.error(error);

    }

}

setInterval(() => {

    loadStage();
    loadCount();
    loadUnweighted();
    loadResults();
    loadWeights();
    loadUncertainty();
    loadConsensus();
    loadRobustness();
    loadComparison();

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

                    <div class="comparison-row">

                        <div class="comparison-name">
                    
                            ${criterion}
                            (${score.toFixed(2)})
                    
                        </div>
                    
                        <div class="comparison-track">
                    
                            <div
                                class="mean-line"
                                style="
                                    left:${(score / 5) * 100}%;
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

async function loadRobustness() {

    try {

        const response =
            await fetch(
                API_BASE +
                "?action=robustness"
            );

        const data =
            await response.json();
        
        console.log("ROBUSTNESS");
        console.log(data);

        let html = "";

        Object.entries(data)
            .forEach(
                ([pathway, values]) => {

                html += `

                    <div class="profile-card">

                        <h3>
                            ${pathway}
                        </h3>

                        <p>
                            Mean Score:
                            ${values.mean.toFixed(1)}
                        </p>

                        <p>
                            Consensus:
                            ${values.consensus}
                        </p>

                        <p>
                            Spread:
                            ${values.spread.toFixed(1)}
                        </p>

                        <p>
                            Robustness:
                            <strong>
                                ${values.robustness}
                            </strong>
                        </p>

                    </div>

                `;

            });

        document
            .getElementById(
                "robustnessChart"
            )
            .innerHTML = html;

    }

    catch (error) {

        console.error(error);

    }

}

async function loadComparison() {

    try {

        const response =
            await fetch(
                API_BASE +
                "?action=uncertainty"
            );

        const data =
            await response.json();

        let html = "";

        Object.entries(data)
            .forEach(
                ([pathway, values]) => {

                    console.log(
                        pathway,
                        {
                            min: values.min,
                            q1: values.q1,
                            mean: values.mean,
                            q3: values.q3,
                            max: values.max
                        }
                    );

                    console.log(
                        pathway,
                        values
                    );

                html += `

                    <div class="comparison-row">

                        <div class="comparison-name">

                            ${pathway}

                        </div>

                        <div class="comparison-track">
                            
                                <div
                                    class="whisker"
                                    style="
                                        left:${values.min}%;
                            
                                        width:${values.max - values.min}%;
                                    ">
                                </div>
                        
                            
                                <div
                                    class="whisker-cap"
                                    style="
                                        left:${values.min}%;
                                    ">
                                </div>
                            
                            
                                <div
                                    class="whisker-cap"
                                    style="
                                        left:${values.max}%;
                                    ">
                                </div>
                            
                            
                                <div
                                    class="box"
                                    style="
                                        left:${values.q1}%;
                            
                                        width:${values.q3 - values.q1}%;
                                    ">
                                </div>
                            
                            
                                <div
                                    class="mean-line"
                                    style="
                                        left:${values.mean}%;
                                    ">
                                </div>
                            
                            </div>

                        </div>

                    </div>

                `;

            });

        document
            .getElementById(
                "comparisonChart"
            )
            .innerHTML = html;

    }

    catch (error) {

        console.error(error);

    }
}

async function loadUnweighted() {

    try {

        const response =
            await fetch(
                API_BASE +
                "?action=unweighted"
            );

        const data =
            await response.json();

        let html = "";

        Object.entries(data)
            .forEach(
                ([pathway, score]) => {

                    console.log(
                    pathway,
                    {
                        min: score.min,
                        q1: score.q1,
                        mean: score.mean,
                        q3: score.q3,
                        max: score.max
                    }
                );

                console.log(
                    pathway,
                    score
                );
                
                html += `
                
                    <div class="comparison-row">
                
                        <div class="comparison-name">
                
                            ${pathway}
                
                        </div>
                
                        <div class="comparison-track">

                
                            <div
                                class="whisker"
                                style="
                                    left:${score.min}%;
                
                                    width:${
                                        score.max -
                                        score.min
                                    }%;
                                ">
                            </div>
                            
                
                            <div
                                class="whisker-cap"
                                style="
                                    left:${score.min}%;
                                ">
                            </div>
                
                            <div
                                class="whisker-cap"
                                style="
                                    left:${score.max}%;
                                ">
                            </div>
                
                            <div
                                class="box"
                                style="
                                    left:${score.q1}%;
                
                                    width:${
                                        score.q3 -
                                        score.q1
                                    }%;
                                ">
                            </div>
                
                            <div
                                class="mean-line"
                                style="
                                    left:${score.mean}%;
                                ">
                            </div>
                
                        </div>
                
                    </div>
                
                `;

            });

        document
            .getElementById(
                "unweightedChart"
            )
            .innerHTML = html;

    }

    catch (error) {

        console.error(error);

    }

}

let presentationMode =
    false;

function togglePresentationMode() {

    presentationMode =
        !presentationMode;

    document.body
        .classList
        .toggle(
            "presentation-mode"
        );

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
        "presentationBtn"
    )
    .addEventListener(
        "click",
        togglePresentationMode
    );
