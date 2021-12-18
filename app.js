const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let database = null;
// Initialize Database And Server

const InitializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started at 3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
InitializeDBAndServer();

const getDbValuesToResponseValues = (dbValues) => {
  return {
    playerId: dbValues.player_id,
    playerName: dbValues.player_name,
  };
};

//GET Players

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT * FROM player_details;`;
  const player_details = await database.all(getPlayerQuery);
  response.send(
    player_details.map((eachPlayer) => getDbValuesToResponseValues(eachPlayer))
  );
});

//GET player

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details
    WHERE player_id LIKE ${playerId};`;
  const player_details = await database.get(getPlayerQuery);
  response.send(getDbValuesToResponseValues(player_details));
});

//PUT player

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id LIKE ${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//GET Specific Match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE match_id LIKE ${matchId};`;
  const matchDetails = await database.get(getMatchQuery);
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});

//GET Player Of Matches

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT match_details.match_id,
    match_details.match,
    match_details.year
    FROM match_details INNER JOIN player_match_score
    ON player_match_score.match_id = match_details.match_id
    WHERE player_match_score.player_id LIKE ${playerId};`;
  const playerMatchesDetails = await database.all(getPlayerMatchesQuery);
  response.send(
    playerMatchesDetails.map((eachMatch) => {
      return {
        matchId: eachMatch.match_id,
        match: eachMatch.match,
        year: eachMatch.year,
      };
    })
  );
});

//GET Matches Of Players

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT player_details.player_id,
    player_details.player_name
    FROM player_details INNER JOIN player_match_score
    ON player_match_score.player_id = player_details.player_id
    WHERE player_match_score.match_id LIKE ${matchId};`;
  const matchPlayersDetails = await database.all(getMatchPlayersQuery);
  response.send(
    matchPlayersDetails.map((eachPlayer) => {
      return {
        playerId: eachPlayer.player_id,
        playerName: eachPlayer.player_name,
      };
    })
  );
});

// GET Statistics Of Players

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticsOfPlayersQuery = `
    SELECT player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM player_details INNER JOIN player_match_score
    ON player_match_score.player_id = player_details.player_id
    WHERE player_match_score.player_id LIKE ${playerId}
    GROUP BY player_match_score.player_id`;
  const statisticsOfPlayersDetails = await database.get(
    getStatisticsOfPlayersQuery
  );
  response.send(statisticsOfPlayersDetails);
});

module.exports = app;
