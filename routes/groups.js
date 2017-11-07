// Dependenies
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const expressValidator = require('express-validator');
const random = require('../constants/random')

// Express validator middleware
router.use(expressValidator());

// Connect to mongodb using mongoose
mongoose.connect('mongodb://carlo:Dittoenbram1234@carlo-shard-00-00-nwaxe.mongodb.net:27017,carlo-shard-00-01-nwaxe.mongodb.net:27017,carlo-shard-00-02-nwaxe.mongodb.net:27017/test?ssl=true&replicaSet=carlo-shard-0&authSource=admin', {
  useMongoClient: true,
  /* other options */
});

// Create group schema
var groupSchema = new mongoose.Schema({
	name: String,
	key: String,
	user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
	users: [
		{
        	type: mongoose.Schema.Types.ObjectId,
        	ref: 'user'
    	}
    ],
    voots: [
    	{
    		type: mongoose.Schema.Types.ObjectId,
    		ref: 'voot'
    	}
    ]
});

// Models
var Group = mongoose.model('group', groupSchema);

/*

	Routes

*/

// Create a new group with user, users, name, key and voots
 var create = function(req, res) {
	// Parameters
	var name = req.body.name;
	var userId = req.body.userId;
	var users = req.body.users;

	// Validation
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('userId', 'UserId is required').notEmpty();
    req.checkBody('users', 'Users are required').notEmpty();

	// Check validation result
    req.getValidationResult().then(function(result) {
        if (result.isEmpty() == false) {
            // Throw validationresult error
            result.array().forEach((error) => {
                res.status(400).send(error.msg);
                res.end();
            });
        } else {

        	var randomKey = random.generateRandomKey(6)

            users.push(userId)

            var newGroup = Group({
            	name: name,
            	key: randomKey,
            	user: userId,
            	users: users,
            });

            //Save group into db and send back the token
            newGroup.save(function(err) {
            	if (err) {
            		res.status(400).send(err)
            	} else {
            		res.status(200).json({
                		"New group with data": newGroup
                	});
            	}
            });
        }
    });
}

// Get a users groups
var get = function(req, res) {
    // Parameters
    var userId = req.params.userId;

    var sendGroups = function(err, groups) {
        if (err) {
            console.log(err)
        }
        if (groups) {
            
            for (var i = groups.length - 1; i >= 0; i--) {
                var group = groups[i]

                // Add the didVote
                var voots = group.voots;
                for (var i = voots.length - 1; i >= 0; i--) {
                    var voot = voots[i];
                    var voteStatus = checkIfVoted(voot, userId);

                    voot.didVote = voteStatus;
                }

                var user = group.user;
                user.password = ".";

                var users = group.users;
                for (var i = users.length - 1; i >= 0; i--) {
                    users[i].password = ".";
                }

            }

            res.status(200).send(groups);
            res.end();

        } else {
            res.status(400).send('No groups found');
            res.end();
        }
    }

    Group.find({"users": [userId]}).populate('user', 'users').exec(sendGroups);

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
router.post('/create', create);
router.get('/get/:userId', get)


// Don't forget this in the future!
module.exports = router;
