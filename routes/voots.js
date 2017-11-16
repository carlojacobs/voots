/*
    TODO: Categorize voots, food, sports, politics etc.
*/

// Dependenies
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const expressValidator = require('express-validator');
const bcrypt = require('bcrypt');
const bluebird = require('bluebird');

// Express validator middleware
router.use(expressValidator());

// Connect to mongodb using mongoose
// mongoose.connect('localhost:27017/voots')
mongoose.connect('mongodb://carlo:Dittoenbram1234@carlo-shard-00-00-nwaxe.mongodb.net:27017,carlo-shard-00-01-nwaxe.mongodb.net:27017,carlo-shard-00-02-nwaxe.mongodb.net:27017/test?ssl=true&replicaSet=carlo-shard-0&authSource=admin', {
  useMongoClient: true,
  /* other options */
});

// Mongoose promiss
mongoose.Promise = bluebird;

// Create mongoose vootSchema
var vootSchema = new mongoose.Schema({
    title: String,
    body: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    upVotes: [String],
    downVotes: [String],
    didVote: String,
    withGroupId: String
})

// Models
var Voot = mongoose.model('voot', vootSchema);
var Group = mongoose.model('group');

/*

    Routes

*/

// Get user's voots
var get = function(req, res) {
    // Req parameters
    var userId = req.params.userId

    var sendUserVoots = function(err, voots) {
        if (voots) {
            for (var i = voots.length - 1; i >= 0; i--) {
                var voot = voots[i]
                voot.user.password = "."

                var voted = checkIfVoted(voot, userId)

                voot.didVote = voted

            }

            res.status(200).send(voots);
            res.end();

        } else {
            res.status(400).send('No voots found');
            res.end();
        }
    }

    // Send all voots from the specific user
    Voot.find({"user": userId}).populate('user').exec(sendUserVoots);
}

// Post a voot to the db
var post = function(req, res) {
    // Req parameters
    var title = req.body.title;
    var body = req.body.body;
    var userId = req.body.userId;
    var withGroupId = req.body.withGroupId;


    // Validation
    req.checkBody('title', 'title is required').notEmpty();
    req.checkBody('body', 'Body is required').notEmpty();
    req.checkBody('userId', 'User id is required').notEmpty();
    req.checkBody('withGroupId', 'withGroupId is required').notEmpty();

    var postVoot = function(result) {
        // Return errors
        if (result.isEmpty() == false) {
            result.array().forEach((error) => {
                res.status(400).send(error.msg);
                res.end();
            })
        } else {

            //Create new Voot()
            var newVoot = Voot({
                title: title,
                body: body,
                user: userId
            })

            // Check if posting to a group
            if (withGroupId != "none") {
                Group.findById(withGroupId, function(err, group) {
                    if (err) {
                        res.status(400).send(err);
                        res.end();
                    }
                    if (group) {
                        group.voots.push(newVoot);
                        group.save();
                    }
                });
            }

            //Save voot to db
            newVoot.save().then(function() {
                res.status(200).send('Posted voot successfully');
                res.end();
            });
        }
    }

    // Get validation result
    req.getValidationResult().then(postVoot);
}

// Update voot
var update = function(req, res) {
    // Req parameters
    var id = req.body.id;
    var title = req.body.title;
    var body = req.body.body;
    var userId = req.body.userId;

    // Validation
    req.checkBody('id', 'Id is required').notEmpty();
    req.checkBody('title', 'title is required').notEmpty();
    req.checkBody('body', 'Body is required').notEmpty();
    req.checkBody('userId', 'User id is required').notEmpty();

    var updateVoot = function(result) {
        // Return errors
        if (result.isEmpty() == false) {
            result.array().forEach((error) => {
                res.status(400).send(error.msg);
                res.end();
            });
        } else {
            // Find voot with corresponding id
            Voot.findById(id, function(err, voot) {
                if (err) {
                    // Throw error if no voot was found
                    res.status(400).send('No voot found');
                    res.end();
                }

                if (voot) {
                    // Make the changes to the voot
                    voot.title = title;
                    voot.body = body;

                    // Save the voot
                    voot.save();
                    res.status(200).send('Voot updated');
                    res.end();
                }
            });
        }
    }

    // Get validation result
    req.getValidationResult().then(updateVoot);
}

// Get all voots
var getAllVoots = function(req, res) {
    // Req parameters
    var userId = req.params.userId;

    var sendAllVoots = function(err, voots) {
        if (err) {
            res.status(400).send(err);
        }

        if (voots) {
            for (var i = voots.length - 1; i >= 0; i--) {
                var voot = voots[i]
                voot.user.password = "."

                var voteStatus = checkIfVoted(voot, userId);

                voot.didVote = voteStatus;

            }

            res.status(200).json(voots);
            res.end();
        } else {
            res.status(400).send('No voots found');
            res.end();
        }
    }

    // Send all voots
    Voot.find().populate('user').exec(sendAllVoots);

}

// Delete voot with specific id
//TODO: Require password for deletion of voot/user
var del = function(req, res) {
    // Req parameters
    var id = req.body.id;

    // Validation
    req.checkBody('id', 'Id is required').notEmpty();

    var deleteVoot = function(result) {
        // Return errors
        if (result.isEmpty() == false) {
            result.array().forEach((error) => {
                res.status(400).send(error.msg);
                res.end();
            });
        } else {
            // Delete voot with the id
            Voot.findOneAndRemove({_id: id}, function(err, voot, result) {
                if (err) {
                    res.status(400).send(err);
                    res.end();
                }
                console.log('Voot removed');
                res.status(200).send('Voot removed');
                res.end();
            });
        }
    }

    // Get validation result
    req.getValidationResult().then(deleteVoot);
}

// Vote on a voot with id
var vote = function(req, res) {
    // Req parameters
    var id = req.body.id;
    var parameter = req.body.parameter;
    var userId = req.body.userId;

    // Validation
    req.checkBody('id', 'Id is required').notEmpty();
    req.checkBody('userId', 'userId is required');
    req.checkBody('parameter', 'Parameter is required').notEmpty();

    var vote = function(result) {
        // Return errors
        if (result.isEmpty() == false) {
            result.array().forEach((error) => {
                res.status(400).send(error.msg);
                res.end();
            });
        } else {
            // Update votes on the voot
            Voot.findById(id, function(err, voot) {
                if (err) {
                    res.status(400).send('No voot found');
                    res.end();
                }

                if (voot) {

                    if (parameter == "up") {
                        // Check if the user has previously voted down, if so, remove that vote and add the upvote

                        var voted = checkIfVoted(voot, userId);

                        if (voted == "down") {
                            // If the the user has already voted down, remove that downvote
                            for (var i = 0; i < voot.downVotes.length; i++) {
                                if (voot.downVotes[i] == userId) {
                                    voot.downVotes.splice(i, 1);
                                    voot.upVotes.push(userId);
                                    voot.save();
                                    res.status(200).send('Voted up');
                                    res.end();
                                    return;
                                }
                            }
                        } else if (voted == "up") {
                            // Check if the user has already voted up, remove that upvote
                            for (var i = 0; i < voot.upVotes.length; i++) {
                                if (voot.upVotes[i] == userId) {
                                    voot.upVotes.splice(i, 1);
                                    voot.save();
                                    res.status(200).send("Removed upvote");
                                    res.end();
                                    return;
                                }
                            }
                        }

                        // Just vote up
                        voot.upVotes.push(userId);
                        voot.save();
                        res.status(200).send('Voted up');
                        res.end();

                    } else if (parameter == "down") {
                        // Check if the user has previously voted up, if so, remove that vote and add the downVote

                        var voted = checkIfVoted(voot, userId)


                        if (voted == "up") {
                            // If the user has already voted up, if so, remove their upvote
                            for (var i = 0; i < voot.upVotes.length; i++) {
                                if (voot.upVotes[i] == userId) {
                                    voot.upVotes.splice(i, 1);
                                    voot.downVotes.push(userId);
                                    voot.save();
                                    res.status(200).send('Voted down');
                                    res.end();
                                    return;
                                }
                            }
                        } else if (voted == "down") {
                            // If the user has already voted down, remove their downvote
                            for (var i = 0; i < voot.downVotes.length; i++) {
                                if (voot.downVotes[i] == userId) {
                                    voot.downVotes.splice(i, 1);
                                    voot.save();
                                    res.status(200).send("Removed downvote");
                                    res.end();
                                    return;
                                }
                            }
                        }

                        // If they have not voted yet, just add a downVote
                        voot.downVotes.push(userId);
                        voot.save();
                        res.status(200).send('Voted down');;
                        res.end();

                    } else {
                        res.status(400).send('Invalid parameter, please use up or down');
                        res.end();
                    }

                }
            });
        }
    }

    // Get validtion result
    req.getValidationResult().then(vote);
}

// Send back all voots from a group
var getGroupVoots = function(req, res) {
    // Parameters
    var groupId = req.body.groupId;
    var userId = req.body.userId;

    // Validation
    req.checkBody('userId', 'userId is required').notEmpty();
    req.checkBody('groupId', 'groupId is required').notEmpty();

    var sendGroupVoots = function(result) {
        if (result.isEmpty() == false) {
            result.array().forEach((error) => {
                res.status(400).send(error.msg);
                res.end();
            });
        } else {
            // Find group with groupId and send back its voots

            var sendVoots = function(err, group) {
                if (err) {
                    res.status(400).send(err);
                    res.end();
                }
                if (group) {
                    // Add the didVote
                    var voots = group.voots;

                    for (var i = voots.length - 1; i >= 0; i--) {
                        var voot = voots[i]
                        var voteStatus = checkIfVoted(voot, userId);

                        voot.didVote = voteStatus;
                    }

                    // Send voots
                    res.status(200).json(voots);
                    res.end();

                }
            }

            Group.findById(groupId).populate('voots').exec(sendVoots);
        }
    }

    // Get validtion result
    req.getValidationResult().then(sendGroupVoots);
    
}


// Check if the user has voted on a specific voot
function checkIfVoted(voot, userId) {

    // Check if voted up by user
    for (var i = 0; i < voot.upVotes.length; i++) {
        if (voot.upVotes[i] == userId) {
            return "up";
        }
    }
    // Check if voted down by user
    for (var i = 0; i < voot.downVotes.length; i++) {
        if (voot.downVotes[i] == userId) {
            return "down";
        }
    }
    // Otherwise send back none
    return "none";
}

// Routes
// Get all groups from a specific group
router.post('/group', getGroupVoots);
// Post a voot
router.post('/post', post);
// Get all voots in the db and add a voting status
router.get('/all/:userId', getAllVoots);
// Get the voots from a specific user and add a voting status
router.get('/get/:userId', get);
// Update a voot in the db
router.put('/update', update);
// Delete a voot in the db
router.delete('/delete', del);
// Vote on a specific voot
router.put('/vote', vote);

// module.exports = router;
module.exports = router;
