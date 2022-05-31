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
var lastQuestionSet = 0
var randomNumberForSet = 0
server.get('/api/v1/questionSet', async (req, res) => {
    const client = await mongoClient.connect(connectionString);
    const db = client.db('quizIT');
    const collection = db.collection('questions');
    var questionSetCount = 5
    while (randomNumberForSet == lastQuestionSet) {
        randomNumberForSet = Math.floor(Math.random() * questionSetCount) + 1;
    }
    lastQuestionSet = randomNumberForSet
    console.log(randomNumberForSet)
    const result = await collection.find({ questionSet: randomNumberForSet }).toArray();
    console.log("/api/v1/questionSet called -> result: ")
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
    console.log("new score received: " + JSON.stringify(req.body))
    const client = await mongoClient.connect(connectionString);
    const db = client.db('quizIT');
    const collection = db.collection('leaderboard');
    const leaderboard = await collection.findOne({ status: "ok" })

    var newScore = req.body
    if (typeof(newScore.score) == 'undefined') {
        res.status(404);
        res.end();
        return
    }
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
            if ((newScore.score > scoreFromDB.score && !flagNewHighScoreDetected) ||
                (newScore.score >= scoreFromDB.score && newScore.timeInMilliseconds < scoreFromDB.timeInMilliseconds && !flagNewHighScoreDetected)) {
                mapEachScoreOneDown(leaderboard, i, newScore)
                i++
                flagNewHighScoreDetected = true
                return
            } else if (i + 1 == leaderboard.topTenScores.length && i < 9 && !flagNewHighScoreDetected) {
                leaderboard.topTenScores[i + 1] = newScore
            }
            else {
                i++
            }
        });
    }

    // rotates all entries down by one and removes a Score if more than 10 entries in array
    function mapEachScoreOneDown(leaderboard, i, newScore) {
        console.log("length of array before " + leaderboard.topTenScores.length)
        leaderboard.topTenScores.splice((i), 0, newScore)
        console.log("length of array " + leaderboard.topTenScores.length)
        leaderboard.topTenScores.splice(10, 1)
    }

    // update leaderboard in MongoDB
    const result = await collection.updateOne({ status: "ok" }, { $set: leaderboard });
    if (result) {
        var newLeaderboard = await collection.findOne({ status: "ok" })
        res.send(newLeaderboard.topTenScores);
    } else {
        res.status(404);
    }
    res.end();
});


// method which at initial start, fills backend/database with questions and an empty leaderboard
async function checkIfTemplateReady() {
    const client = await mongoClient.connect(connectionString);
    const db = client.db('quizIT');
    const leaderboardCollection = db.collection('leaderboard');
    const leaderboard = await leaderboardCollection.findOne({ status: "ok" })
    if (!leaderboard) {
        console.log("initially inserting empty leaderboard")
        const emptyLeaderboard = require('./emptyLeaderboard.json');
        await leaderboardCollection.insertOne(emptyLeaderboard)
    }
    const collectionQuestions = db.collection('questions');
    const questions = await collectionQuestions.find({ questionSet: 1 }).toArray();
    if (questions.length < 0) {
        console.log("initially inserting questions to DB")
        const questions = require('./questions.json');
        await collectionQuestions.insertMany(questions)
    }
}

// starting server
checkIfTemplateReady()
var listener = server.listen(8085);
console.log("Server running at port " + listener.address().port)