const expect = require('chai').expect,
    request = require('supertest')

describe('POST: /devicestatus route to insert data', () => {

    it('valid data 1', (done) => {
        let newScore = {
            "score": 3,
            "timeInMilliseconds": 15,
            "username": "Jan"
        };

        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.deep.include(newScore);
                done();
            })
            .catch((err) => done(err))
    })


    it('valid data 2', (done) => {
        let newScore = {
            "score": 5,
            "timeInMilliseconds": 15,
            "username": "Franz"
        };

        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.be.an('array').to.deep.include(newScore);
                done();
            })
            .catch((err) => done(err))
    })

    it('insert with same Score but higher time', (done) => {
        let newScore = {
            "score": 5,
            "timeInMilliseconds": 16,
            "username": "Francois"
        };

        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body[1]).to.deep.equal(newScore);
                done();
            })
            .catch((err) => done(err))
    })

    it('insert with same Score and lower time', (done) => {
        let newScore = {
            "score": 5,
            "timeInMilliseconds": 12,
            "username": "Jaclin"
        };

        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body[0]).to.deep.equal(newScore);
                done();
            })
            .catch((err) => done(err))
    })

    it('insert with same Score and same time', (done) => {
        let newScore = {
            "score": 5,
            "timeInMilliseconds": 12,
            "username": "Louis"
        };

        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body[1]).to.deep.equal(newScore);
                done();
            })
            .catch((err) => done(err))
    })

    it('insert with lower Score and higher time', (done) => {
        let newScore = {
            "score": 3,
            "timeInMilliseconds": 5,
            "username": "Stabilo"
        };

        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body[4]).to.deep.equal(newScore);
                done();
            })
            .catch((err) => done(err))
    })



    it('insert new HighScore', (done) => {
        let newScore = {
            "score": 5,
            "timeInMilliseconds": 5,
            "username": "Peter"
        };

        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body[0]).to.deep.equal(newScore);
                done();
            })
            .catch((err) => done(err))
    })

    it('insert new second best Score', (done) => {
        let newScore = {
            "score": 5,
            "timeInMilliseconds": 7,
            "username": "Texas"
        };

        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body[1]).to.deep.equal(newScore);
                done();
            })
            .catch((err) => done(err))
    })

    it('insert new lowScore', (done) => {
        let newScore = {
            "score": 0,
            "timeInMilliseconds": 55,
            "username": "Kevin"
        };

        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body[8]).to.deep.equal(newScore);
                done();
            })
            .catch((err) => done(err))
    })

    it('insert new second Lowest Score', (done) => {
        let newScore = {
            "score": 1,
            "timeInMilliseconds": 155,
            "username": "Logi"
        };

        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body[8]).to.deep.equal(newScore);
                done();
            })
            .catch((err) => done(err))
    })

    it('insert new lowScore, while leaderboard size has length of 10', (done) => {
        let newScore = {
            "score": 0,
            "timeInMilliseconds": 355,
            "username": "BadPlay"
        };

        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.be.an('array').to.not.deep.include(newScore);
                done();
            })
            .catch((err) => done(err))
    })

    it('insert new HighScore and expect lowScore to be omitted, while leaderboard size has length of 10', (done) => {
        let newScore = {
            "score": 5,
            "timeInMilliseconds": 4,
            "username": "Tracer"
        };
        let lowestScore = {
            "score": 0,
            "timeInMilliseconds": 355,
            "username": "BadPlay"
        };
        request('localhost:8085/api/v1')
            .post('/score')
            .send(newScore)
            .then((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body[0]).to.deep.equal(newScore);
                expect(res.body).to.be.an('array').to.not.deep.include(lowestScore);
                done();
            })
            .catch((err) => done(err))
    })

    it('insert null', (done) => {
        let toSendData = {};

        request('localhost:8085/api/v1')
            .post('/score')
            .send(toSendData)
            .then((res) => {
                expect(res.statusCode).to.equal(404);
                done();
            })
            .catch((err) => done(err))
    })

    it('insert bad request', (done) => {
        let toSendData = null;

        request('localhost:8085/api/v99')
            .post('/score')
            .send(toSendData)
            .then((res) => {
                expect(res.statusCode).to.equal(404);
                done();
            })
            .catch((err) => console.log(err))
    })
})
