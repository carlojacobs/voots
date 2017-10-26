// Dependenies
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const expressValidator = require('express-validator');
const random = require('../constants/random')

// Express validator middleware
router.use(expressValidator());

// Connect to mongodb using mongoose
mongoose.connect('mongodb://carlo:Dittoenbram1234@carlo-shard-00-00-nwaxe.mongodb.net:27017,carlo-shard-00-01-nwaxe.mongodb.net:27017,carlo-shard-00-02-nwaxe.mongodb.net:27017/test?ssl=true&replicaSet=carlo-shard-0&authSource=admin');

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

// Routes
router.post('/create', create);


// Don't forget this in the future!
module.exports = router;
