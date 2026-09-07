const SPREADSHEET_ID =
  "1PR65zalJsvaMQDW1i1NOUvAJxeVynGimKt6ZDFBnVcc";

/* =========================
   GET ENDPOINTS
========================= */

function doGet(e) {

  const action =
    e && e.parameter
      ? e.parameter.action
      : null;

  if (action === "stage") {

      return ContentService
        .createTextOutput(
          JSON.stringify({

            stage:
              getWorkshopStage()

          })
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }

    if (
      action === "unweighted"
    ) {

      return ContentService
        .createTextOutput(
          JSON.stringify(
            getUnweightedResults()
          )
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }
  
  if (action === "summary") {

    return ContentService
      .createTextOutput(
        JSON.stringify(getSummary())
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );
  }

  if (
    action === "count"
  ) {

    return ContentService
      .createTextOutput(
        JSON.stringify({

          responses:
            getParticipantCount()

        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

  if (
    action === "results"
  ) {

    return ContentService
      .createTextOutput(
        JSON.stringify(
          getAggregatedResults()
        )
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

  if (
    action === "weights"
  ) {

    return ContentService
      .createTextOutput(
        JSON.stringify(
          getAverageWeights()
        )
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

  if (
  action === "uncertainty"
  ) {

    return ContentService
      .createTextOutput(
        JSON.stringify(
          getUncertaintyResults()
        )
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

  if (
    action === "consensus"
  ) {

    return ContentService
      .createTextOutput(
        JSON.stringify(
          getConsensusResults()
        )
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

  if (
    action === "robustness"
  ) {

    return ContentService
      .createTextOutput(
        JSON.stringify(
          getRobustnessResults()
        )
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

  if (
  action === "mcmWeighted"
  ) {

    return ContentService
      .createTextOutput(
        JSON.stringify(
          getMCMChartData(
            true
          )
        )
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

  if (
  action === "mcmUnweighted"
  ) {

    return ContentService
      .createTextOutput(
        JSON.stringify(
          getMCMChartData(
            false
          )
        )
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

  const sheet =
    SpreadsheetApp
      .openById(
        SPREADSHEET_ID
      )
      .getSheetByName(
        "Settings"
      );

  const data =
    sheet
      .getRange(2, 2, 1, 7)
      .getValues()[0];

  const criteria =
    data.filter(item => item);

  return ContentService
    .createTextOutput(
      JSON.stringify({
        criteria: criteria
      })
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}

/* =========================
   POST ENDPOINT
========================= */

function doPost(e) {

  try {

    const data =
      JSON.parse(
        e.postData.contents
      );

      if (
        data.action ===
        "setStage"
      ) {

        const stage =
          setWorkshopStage(
            data.stage
           );

        return ContentService
          .createTextOutput(
            JSON.stringify({

              success: true,

              stage: stage

              })
            )
          .setMimeType(
            ContentService.MimeType.JSON
          );

      }

    const ss =
      SpreadsheetApp.openById(
        SPREADSHEET_ID
      );

    const responseSheet =
      ss.getSheetByName(
        "Responses"
      );

    const weightSheet =
      ss.getSheetByName(
        "Weights"
      );

    const resultSheet =
      ss.getSheetByName(
        "Results"
      );

    const timestamp =
      new Date();

    Object.keys(
      data.responses
    ).forEach(pathway => {

      Object.keys(
        data.responses[pathway]
      ).forEach(criterion => {

        const score =
          data.responses[pathway][criterion];

        responseSheet.appendRow([
          timestamp,
          data.participantId,
          pathway,
          criterion,
          score.min,
          score.max
        ]);

      });

    });

    Object.keys(
      data.weights
    ).forEach(criterion => {

      weightSheet.appendRow([
        timestamp,
        data.participantId,
        criterion,
        data.weights[criterion]
      ]);

    });

    Logger.log("RESULTS START");

    Object.keys(
      data.results
    ).forEach(pathway => {

      Logger.log(pathway);

      const result =
        data.results[pathway];

      Logger.log(JSON.stringify(result));

      resultSheet.appendRow([

        timestamp,

        data.participantId,

        pathway,

        result.unweighted,

        result.weighted,

        result.difference

      ]);

    });

    Logger.log("RESULTS END");

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: true
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

  catch (err) {

    Logger.log(err);

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: false,
          error: err.toString()
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

}

/* =========================
   SUMMARY CALCULATIONS
========================= */

function getSummary() {

  const ss =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );

  const sheet =
    ss.getSheetByName(
      "Responses"
    );

  const rows =
    sheet
      .getDataRange()
      .getValues();

  if (rows.length <= 1) {
    return {};
  }

  rows.shift();

  const participantPathways = {};

  rows.forEach(row => {

    const participant =
      row[1];

    const pathway =
      row[2];

    const min =
      Number(row[4]);

    const max =
      Number(row[5]);

    const midpoint =
      min + ((max - min) / 2);

    const key =
      participant + "||" + pathway;

    if (!participantPathways[key]) {

      participantPathways[key] = {
        mins: [],
        maxs: [],
        mids: []
      };

    }

    participantPathways[key]
      .mins
      .push(min);

    participantPathways[key]
      .maxs
      .push(max);

    participantPathways[key]
      .mids
      .push(midpoint);

  });

  const pathwayData = {};

  Object.keys(participantPathways)
    .forEach(key => {

      const pathway =
        key.split("||")[1];

      const p =
        participantPathways[key];

      const avgMin =
        p.mins.reduce((a,b)=>a+b,0)
        / p.mins.length;

      const avgMax =
        p.maxs.reduce((a,b)=>a+b,0)
        / p.maxs.length;

      const avgMid =
        p.mids.reduce((a,b)=>a+b,0)
        / p.mids.length;

      if (!pathwayData[pathway]) {

        pathwayData[pathway] = {
          mins: [],
          maxs: [],
          mids: []
        };

      }

      pathwayData[pathway]
        .mins
        .push(avgMin);

      pathwayData[pathway]
        .maxs
        .push(avgMax);

      pathwayData[pathway]
        .mids
        .push(avgMid);

    });

  const summary = {};

  Object.keys(pathwayData)
    .forEach(pathway => {

      const mins =
        pathwayData[pathway].mins;

      const maxs =
        pathwayData[pathway].maxs;

      const mids =
        pathwayData[pathway].mids;

      const meanMin =
        mins.reduce((a,b)=>a+b,0)
        / mins.length;

      const meanMax =
        maxs.reduce((a,b)=>a+b,0)
        / maxs.length;

      const meanMid =
        mids.reduce((a,b)=>a+b,0)
        / mids.length;

      summary[pathway] = {

        meanMin: meanMin,

        meanMid: meanMid,

        meanMax: meanMax,

        lowerWhisker:
          Math.min(...mins),

        upperWhisker:
          Math.max(...maxs)

      };

    });

  return summary;

}

function getWorkshopStage() {

  const sheet =
    SpreadsheetApp
      .openById(
        SPREADSHEET_ID
      )
      .getSheetByName(
        "Settings"
      );

  const values =
    sheet.getDataRange()
         .getValues();

  for (let i = 0; i < values.length; i++) {

    if (
      values[i][0] ===
      "WorkshopStage"
    ) {

      return values[i][1];

    }

  }

  return "SCORING";

}

function getUnweightedResults() {

  const sheet =
    SpreadsheetApp
      .openById(
        SPREADSHEET_ID
      )
      .getSheetByName(
        "Results"
      );

  const rows =
    sheet
      .getDataRange()
      .getValues();

  if (rows.length <= 1) {
    return {};
  }

  rows.shift();

  const pathwayData = {};

  rows.forEach(row => {

    const pathway =
      row[2];

    const score =
      Number(row[3]);

    if (!pathwayData[pathway]) {

      pathwayData[pathway] = [];

    }

    pathwayData[pathway]
      .push(score);

  });

  const results = {};

  Object.keys(pathwayData)
    .forEach(pathway => {

      const scores =
        pathwayData[pathway];

      const mean =
        scores.reduce(
          (a,b) => a+b,
          0
        ) / scores.length;

      const sorted =
        [...scores]
          .sort(
            (a,b) => a-b
          );

      const q1 =
        sorted[
          Math.floor(
            sorted.length * 0.25
          )
        ];

      const q3 =
        sorted[
          Math.floor(
            sorted.length * 0.75
          )
        ];

      results[pathway] = {

        mean: mean,

        min:
          Math.min(...scores),

        max:
          Math.max(...scores),

        q1: q1,

        q3: q3

      };

    });

  return results;

}

function getAggregatedResults() {

  const sheet =
    SpreadsheetApp
      .openById(
        SPREADSHEET_ID
      )
      .getSheetByName(
        "Results"
      );

  const rows =
    sheet
      .getDataRange()
      .getValues();

  if (rows.length <= 1) {
    return {};
  }

  rows.shift();

  const pathwayScores = {};

  rows.forEach(row => {

    const pathway =
      row[2];

    const weightedScore =
      Number(row[4]);

    if (!pathwayScores[pathway]) {

      pathwayScores[pathway] = [];

    }

    pathwayScores[pathway]
      .push(weightedScore);

  });

  const results = {};

  Object.keys(pathwayScores)
    .forEach(pathway => {

      const scores =
        pathwayScores[pathway];

      const average =
        scores.reduce(
          (a,b) => a+b,
          0
        ) / scores.length;

      results[pathway] =
        average;

    });

  return results;

}

function getUncertaintyResults() {

  const sheet =
    SpreadsheetApp
      .openById(
        SPREADSHEET_ID
      )
      .getSheetByName(
        "Results"
      );

  const rows =
    sheet
      .getDataRange()
      .getValues();

  if (rows.length <= 1) {
    return {};
  }

  rows.shift();

  const pathwayData = {};

  rows.forEach(row => {

    const pathway =
      row[2];

    const weightedScore =
      Number(row[4]);

    if (!pathwayData[pathway]) {

      pathwayData[pathway] = [];

    }

    pathwayData[pathway]
      .push(weightedScore);

  });

  const results = {};

  Object.keys(pathwayData)
    .forEach(pathway => {

      const scores =
        pathwayData[pathway];

      const mean =
        scores.reduce(
          (a,b) => a+b,
          0
        ) / scores.length;

      const sorted =
        [...scores]
          .sort(
            (a,b) => a-b
          );

      const q1 =
        sorted[
          Math.floor(
            sorted.length * 0.25
          )
        ];

      const q3 =
        sorted[
          Math.floor(
            sorted.length * 0.75
          )
        ];

      results[pathway] = {

        mean: mean,

        min:
          Math.min(...scores),

        max:
          Math.max(...scores),

        q1: q1,

        q3: q3

      };

    });

  return results;

}

function getMCMChartData(weighted = true) {

  const sheet =
    SpreadsheetApp
      .openById(
        SPREADSHEET_ID
      )
      .getSheetByName(
        "Results"
      );

  const rows =
    sheet
      .getDataRange()
      .getValues();

  if (rows.length <= 1) {
    return {};
  }

  rows.shift();

  const pathwayData = {};

  rows.forEach(row => {

    const pathway =
      row[2];

    const score =
      Number(
        weighted
          ? row[4]
          : row[3]
      );

    if (!pathwayData[pathway]) {

      pathwayData[pathway] = [];

    }

    pathwayData[pathway]
      .push(score);

  });

  const results = {};

  Object.keys(pathwayData)
    .forEach(pathway => {

      const scores =
        pathwayData[pathway]
          .sort(
            (a,b) => a-b
          );

      const min =
        scores[0];

      const max =
        scores[
          scores.length - 1
        ];

      const meanStart =
        scores[
          Math.floor(
            scores.length * 0.25
          )
        ];

      const meanEnd =
        scores[
          Math.floor(
            scores.length * 0.75
          )
        ];

      results[pathway] = {

        extremaStart:
          min,

        extremaLength:
          max - min,

        meansStart:
          meanStart,

        meansLength:
          meanEnd - meanStart

      };

    });

  return results;

}

function getConsensusResults() {

  const sheet =
    SpreadsheetApp
      .openById(
        SPREADSHEET_ID
      )
      .getSheetByName(
        "Results"
      );

  const rows =
    sheet
      .getDataRange()
      .getValues();

  if (rows.length <= 1) {
    return {};
  }

  rows.shift();

  const pathwayData = {};

  rows.forEach(row => {

    const pathway =
      row[2];

    const score =
      Number(row[4]);

    if (!pathwayData[pathway]) {

      pathwayData[pathway] = [];

    }

    pathwayData[pathway]
      .push(score);

  });

  const results = {};

  Object.keys(pathwayData)
    .forEach(pathway => {

      const scores =
        pathwayData[pathway];

      const min =
        Math.min(...scores);

      const max =
        Math.max(...scores);

      const spread =
        max - min;

      let rating =
        "High";

      if (spread > 20) {
        rating = "Medium";
      }

      if (spread > 40) {
        rating = "Low";
      }

      results[pathway] = {

        spread:
          spread,

        consensus:
          rating

      };

    });

  return results;

}

function getRobustnessResults() {

  const uncertainty =
    getUncertaintyResults();

  const consensus =
    getConsensusResults();

  const results = {};

  Object.keys(uncertainty)
    .forEach(pathway => {

      const mean =
        uncertainty[pathway].mean;

      const spread =
        consensus[pathway].spread;

      let robustness =
        "Moderate";

      if (
        mean >= 60 &&
        spread <= 20
      ) {

        robustness =
          "Strong";

      }

      if (
        mean < 50 &&
        spread > 30
      ) {

        robustness =
          "Weak";

      }

      results[pathway] = {

        mean:
          mean,

        spread:
          spread,

        consensus:
          consensus[pathway]
            .consensus,

        robustness:
          robustness

      };

    });

  return results;

}

function getAverageWeights() {

  const sheet =
    SpreadsheetApp
      .openById(
        SPREADSHEET_ID
      )
      .getSheetByName(
        "Weights"
      );

  const rows =
    sheet
      .getDataRange()
      .getValues();

  if (rows.length <= 1) {
    return {};
  }

  rows.shift();

  const weightData = {};

  rows.forEach(row => {

    const criterion =
      row[2];

    const weight =
      Number(row[3]);

    if (!weightData[criterion]) {

      weightData[criterion] = [];

    }

    weightData[criterion]
      .push(weight);

  });

  const averages = {};

  Object.keys(weightData)
    .forEach(criterion => {

      const values =
        weightData[criterion];

      averages[criterion] =
        values.reduce(
          (a,b) => a+b,
          0
        ) / values.length;

    });

  return averages;

}

function getParticipantCount() {

  const sheet =
    SpreadsheetApp
      .openById(
        SPREADSHEET_ID
      )
      .getSheetByName(
        "Results"
      );

  const rows =
    sheet
      .getDataRange()
      .getValues();

  if (rows.length <= 1) {
    return 0;
  }

  rows.shift();

  const participants =
    new Set();

  rows.forEach(row => {

    participants.add(
      row[1]
    );

  });

  return participants.size;

}

function setWorkshopStage(stage) {

  const sheet =
    SpreadsheetApp
      .openById(
        SPREADSHEET_ID
      )
      .getSheetByName(
        "Settings"
      );

  sheet
    .getRange("B4")
    .setValue(stage);

  return stage;

}
