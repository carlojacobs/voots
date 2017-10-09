// Dependenies
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')
var expressValidator = require('express-validator')
var bcrypt = require('bcrypt')

var users = require('./users');
var User = users.model

router.use(expressValidator())

// Connect to mongodb using mongoose
// mongoose.connect('localhost:27017/voots')
mongoose.connect('mongodb://carlo:Dittoenbram1234@carlo-shard-00-00-nwaxe.mongodb.net:27017,carlo-shard-00-01-nwaxe.mongodb.net:27017,carlo-shard-00-02-nwaxe.mongodb.net:27017/test?ssl=true&replicaSet=carlo-shard-0&authSource=admin')

// Create mongoose vootSchema
var vootSchema = new mongoose.Schema({
    title: String,
    body: String,
    userId: String,
    upVotes: [String],
    downVotes: [String]
})

// Create Voot model
var Voot = mongoose.model('voot', vootSchema)

// Get all voots from db
router.get('/', function(req, res, next) {
    Voot.find(function(err, voots) {
        if (err) {
            console.log(err);
            res.status(400).send(err)
            res.end()
        }

        if (voots) {
            res.status(200).json(voots)
            res.end()
        }
    })
})

// Post a voot to the db
router.post('/post', function(req, res, next) {
    // Req parameters
    var title = req.body.title
    var body = req.body.body
    var userId = req.body.userId
    var upVotes = req.body.upVotes
    var downVotes = req.body.downVotes

    // Validation
    req.checkBody('title', 'title is required').notEmpty()
    req.checkBody('body', 'Body is required').notEmpty()
    req.checkBody('userId', 'User id is required').notEmpty()

    // Get validation result
    req.getValidationResult().then(function(result) {
        // Return errors
        if (result.isEmpty() == false) {
            result.array().forEach((error) => {
                res.status(400).send(error.msg)
                res.end()
            })
        } else {
            //Create new Voot()
            var newVoot = Voot({
                title: title,
                body: body,
                userId: userId,
                upVotes: upVotes,
                downVotes: downVotes
            })

            //Save voot to db
            newVoot.save()
            res.status(200).send('Posted voot successfully')
            res.end()
        }
    })
})

// Update voot
router.post('/update', function(req, res, next) {
    // Req parameters
    var id = req.body.id
    var title = req.body.title
    var body = req.body.body
    var userId = req.body.userId

    // Validation
    req.checkBody('id', 'Id is required').notEmpty()
    req.checkBody('title', 'title is required').notEmpty()
    req.checkBody('body', 'Body is required').notEmpty()
    req.checkBody('userId', 'User id is required').notEmpty()

    // Get validation result
    req.getValidationResult().then(function(result) {
        // Return errors
        if (result.isEmpty() == false) {
            result.array().forEach((error) => {
                res.status(400).send(error.msg)
                res.end()
            })
        } else {
            // Find voot with corresponding id
            Voot.findById(id, function(err, voot) {
                if (err) {
                    // Throw error if no voot was found
                    res.status(400).send('No voot found')
                    res.end()
                }

                if (voot) {
                    // Make the changes to the voot
                    voot.title = title
                    voot.body = body
                    voot.userId = userId
                    // Save the voot
                    voot.save()
                    res.status(200).send('Voot updated')
                    res.end()
                }
            })
        }
    })
})

// Get voots from specific user
router.post('/get', function(req, res, next) {
    // Req parameters
    var userId = req.body.userId

    // Validation
    req.checkBody('userId', 'User id is required').notEmpty()

    // Get validtion result
    req.getValidationResult().then(function(result) {
        // Return errors
        if (result.isEmpty() == false) {
            result.array().forEach((error) => {
                res.status(400).send(error.msg)
                res.end()
            })
        } else {
            // Send all voots from the specific user
            Voot.find({"userId": userId}, function(err, voots) {
                if (err) {
                    console.log(err);
                    res.status(400).send(err)
                    res.end()
                }

                if (voots) {
                    res.status(200).send(voots)
                    res.end()
                }
            })
        }
    })
})

// Delete voot with specific id
router.post('/delete', function(req, res, next) {
    // Req parameters
    var id = req.body.id

    // Validation
    req.checkBody('id', 'Id is required').notEmpty()

    // Get validation result
    req.getValidationResult().then(function(result) {
        // Return errors
        if (result.isEmpty() == false) {
            result.array().forEach((error) => {
                res.status(400).send(error.msg)
                res.end()
            })
        } else {
            // Delete voot with the id
            Voot.findByIdAndRemove(id).exec()
            console.log('Voot removed');
            res.status(200).send('Voot removed')
            res.end()
        }
    })
})

// Vote on a voot
router.post('/vote', function(req, res, next) {
    // Req parameters
    var id = req.body.id
    var parameter = req.body.parameter
    var userId = req.body.userId

    // Validation
    req.checkBody('id', 'Id is required').notEmpty()
    req.checkBody('userId', 'userId is required')
    req.checkBody('parameter', 'Parameter is required').notEmpty()

    // Get validtion result
    req.getValidationResult().then(function(result) {
        // Return errors
        if (result.isEmpty() == false) {
            result.array().forEach((error) => {
                res.status(400).send(error.msg)
                res.end()
            })
        } else {
            // Update votes on the voot
            Voot.findById(id, function(err, voot) {
                if (err) {
                    res.status(400).send('No voot found')
                    res.end()
                }

                if (voot) {

                    if (parameter == "up") {
                        // Check if the user has previously voted down, if so, remove that vote and add the upvote
                        for (var i = 0; i < voot.downVotes.length; i++) {
                            if (voot.downVotes[i] == userId) {
                                voot.downVotes.splice(i, 1)
                                voot.upVotes.push(userId)
                                voot.save()
                                res.status(200).send('Voted up')
                                res.end()
                                return
                            }
                        }

                        // Check if the user has already voted up
                        for (var i = 0; i < voot.upVotes.length; i++) {
                            if (voot.upVotes[i] == userId) {
                                voot.upVotes.splice(i, 1)
                                voot.save()
                                res.status(200).send("Removed upvote")
                                res.end()
                                return
                            }
                        }

                        // Just vote up
                        voot.upVotes.push(userId)
                        voot.save()
                        res.status(200).send('Voted up')
                        res.end()

                    } else if (parameter == "down") {
                        // Check if the user has previously voted up, if so, remove that vote and add the downVote
                        for (var i = 0; i < voot.upVotes.length; i++) {
                            if (voot.upVotes[i] == userId) {
                                voot.upVotes.splice(i, 1)
                                voot.downVotes.push(userId)
                                voot.save()
                                res.status(200).send('Voted down')
                                res.end()
                                return
                            }
                        }

                        // Check if the user has already voted down
                        for (var i = 0; i < voot.downVotes.length; i++) {
                            if (voot.downVotes[i] == userId) {
                                voot.downVotes.splice(i, 1)
                                voot.save()
                                res.status(200).send("Removed downvote")
                                res.end()
                                return
                            }
                        }

                        // Just add a downVote
                        voot.downVotes.push(userId)
                        voot.save()
                        res.status(200).send('Voted down')
                        res.end()

                    } else {
                        res.status(400).send('Invalid parameter, please use up or down')
                        res.end()
                    }

                }
            })
        }
    })
})

// Check if the user has voted on a specific voot
router.post('/didVote', function(req, res, next) {
    // Req parameters
    var userId = req.body.userId
    var id = req.body.id

    // Validation
    req.checkBody('userId', 'userId is required').notEmpty
    req.checkBody('id', 'id is required')

    // Get validation result
    req.getValidationResult().then(function(result) {
        // Return errors
        if (result.isEmpty() == false) {
            result.array().forEach((error) => {
                res.status(400).send(error.msg)
                res.end()
            })
        } else {
            // Find voot with corresponding id
            Voot.findById(id, function(err, voot) {
                if (err) {
                    res.status(400).send('No voot found')
                    res.end()
                }

                if (voot) {
                    // Check if voted up by user
                    for (var i = 0; i < voot.upVotes.length; i++) {
                        if (voot.upVotes[i] == userId) {
                            res.status(200).send('up')
                            res.end()
                            return
                        }
                    }
                    // Check if voted down by user
                    for (var i = 0; i < voot.downVotes.length; i++) {
                        if (voot.downVotes[i] == userId) {
                            res.status(200).send('down')
                            res.end()
                            return
                        }
                    }
                    // Otherwise send back none
                    res.status(200).send('none')
                    res.end()
                }
            })
        }
    })
})

// module.exports = router;
module.exports.router = router;
module.exports.model = Voot;
