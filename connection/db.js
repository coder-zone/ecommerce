const mongoose = require('mongoose');
const chalk = require('chalk');
mongoose.Promise = require('bluebird');

let URL = process.env.MONGO_URI;

mongoose.connect(
	URL,
	{ useNewUrlParser: true },
	(err) => {
		if (err) {
			console.error(chalk.red('Could not connect to MongoDB !'));
			console.log(chalk.red(err));
		} else {
			console.log('MongoDB: Connected to Udhoyogini Database !');
		}
	}
);