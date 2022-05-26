const mongoClient = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectId;
const bodyParser = require("body-parser");
const express = require("express");
const server = express();
require('dotenv').config()
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'POST, GET');
        return res.status(200).json({});
    }
    next();
})

const connectionString = `${process.env.LOCALMONGODB}`;

/* 
Method for getting a questionSet
*/
server.get('/api/v1/questionSet', async (req, res) => {
    const client = await mongoClient.connect(connectionString);
    const db = client.db('quizIT');
    const collection = db.collection('questions');
    var n = 5
    var r = Math.floor(Math.random() * n);
    const result = await collection.find({ questionSet: 1 }).toArray();
    console.log("/api/v1/questionSet called -> result: ")
    result.forEach(r => console.log(r))
    if (result) {
        res.send(result);
    } else {
        res.status(404);
    }
    res.end();
});

/* 
Method for getting the leaderboard.
*/
server.get('/api/v1/leaderboard', async (req, res) => {
    const client = await mongoClient.connect(connectionString);
    const db = client.db('quizIT');
    const collection = db.collection('leaderboard');
    const leaderboard = await collection.findOne({ status: "ok" })
    if (leaderboard) {
        res.send(leaderboard.topTenScores);
    } else {
        res.status(404);
    }
    res.end();
});


/* 
Method for posting a new Score.
Checks if the score is among the 10 best.
First it looks at the score-points and then at the time.
The higher the points and the lower the time -> the higher is the rank.
*/
server.post('/api/v1/score', async (req, res) => {
    console.log("new score received: " + req.body.score)
    const client = await mongoClient.connect(connectionString);
    const db = client.db('quizIT');
    const collection = db.collection('leaderboard');
    const leaderboard = await collection.findOne({ status: "ok" })

    var newScore = req.body
    var i = 0
    var flagNewHighScoreDetected = false

    // if Leaderboard is empty -> just add it
    if (leaderboard.topTenScores.length == 0) {
        leaderboard.topTenScores[0] = newScore
    }
    else {
        // if leaderboard is not empty, iterate over each score in array
        leaderboard.topTenScores.forEach(scoreFromDB => {
            // check if newScore should be placed over scoreFromDB
            if ((newScore.score > scoreFromDB.score && !flagNewHighScoreDetected) || (newScore.score >= scoreFromDB.score && newScore.timeInMilliseconds < scoreFromDB.timeInMilliseconds && !flagNewHighScoreDetected)) {
                console.log(scoreFromDB)
                console.log(i)
                mapEachScoreOneDown(leaderboard, i, newScore)
                i++
                flagNewHighScoreDetected = true
                return
            } else if (i + 1 == leaderboard.topTenScores.length && i < 10 && !flagNewHighScoreDetected) {
                leaderboard.topTenScores[i + 1] = newScore
            }
            else {
                i++
            }
        });
    }

    // rotates all entries down by one and removes a Score if more than 10 entries in array
    function mapEachScoreOneDown(leaderboard, i, newScore) {
        console.log("i: " + i)
        console.log("length of array before " + leaderboard.topTenScores.length)
        leaderboard.topTenScores.splice((i), 0, newScore)
        console.log("length of array " + leaderboard.topTenScores.length)
        leaderboard.topTenScores.splice(10, 1)
    }

    // update leaderboard in MongoDB
    const result = await collection.updateOne({ status: "ok" }, { $set: leaderboard });
    if (result) {
        res.send(await collection.findOne({ status: "ok" }));
    } else {
        res.status(404);
    }
    res.end();
});

// starting server
var listener = server.listen(8085);
console.log("Server running at port " + listener.address().port)