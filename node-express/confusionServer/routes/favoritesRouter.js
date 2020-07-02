const express = require('express');
const bodyParser = require('body-parser');
// const mongoose = require('mongoose');
const Favorites = require('../models/favorite');
var authenticate = require('../authenticate');
const favoriteRouter = express.Router();
const cors = require('./cors');
const Users = require('../models/users');

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
	.options(cors.corsWithOptions, (req, res) => {
		res.sendStatus(200);
	})
	.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
		// console.log(req.user);
		Favorites.find({
				user: req.user._id
			})
			.populate('dish')
			.populate('user')
			.then((Favorites) => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(Favorites);
			}, (err) => next(err))
			.catch((err) => next(err));
	})
	.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorites.findOne({
				user: req.user._id
			})
			.then((favorite) => {
				if (favorite != null) {
					for (var i = 0; i < req.body.length; i++) {
						// checking if dish exists
						if (favorite.dish.indexOf(req.body[i]._id) < 0) {
							favorite.dish.push(req.body[i]);
						}
					}
					favorite.save()
						.then((favorite) => {
							Favorites.findById(favorite._id)
								.populate('user')
								.populate('dish')
								.then((favorite) => {
									res.statusCode = 200;
									res.setHeader('Content-Type', 'application/json');
									res.json(favorite);
								})
						}, (err) => next(err));
				} else {
					Favorites.create({
							user: req.user._id,
							dish: req.body.dish
						})
						.then((favorite) => {
							Favorites.findById(favorite._id)
								.populate('user')
								.populate('dishes')
								.then((favorite) => {
									res.statusCode = 200;
									res.setHeader('Content-Type', 'application/json');
									res.json(favorite);
								})
						}, (err) => next(err))
						.catch((err) => next(err));
				}
			}, (err) => next(err))
			.catch((err) => next(err));

	})
	.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
		res.statusCode = 403;
		res.enpnd('PUT operation not supported on /Favorites');
	})
	.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorites.remove({
				user: req.user._id
			})
			.then((resp) => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(resp);
			}, (err) => next(err))
			.catch((err) => next(err));
	});

favoriteRouter.route('/:dishId')
	.options(cors.corsWithOptions, (req, res) => {
		res.sendStatus(200);
	})
	.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
		Favorites.findOne({
				user: req.user._id
			})
			.then((favorites) => {
				if (!favorites) {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					return res.json({
						"exists": false,
						"favorites": favorites
					});
				} else {
					if (favorites.dishes.indexOf(req.params.dishId) < 0) {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						return res.json({
							"exists": false,
							"favorites": favorites
						});
					} else {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						return res.json({
							"exists": true,
							"favorites": favorites
						});
					}
				}

			}, (err) => next(err))
			.catch((err) => next(err))
	})
	.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		// console.log("req.user._id" + req.user._id);
		Favorites.findOne({
				user: req.user._id
			})
			.then((favorite) => {
				if (favorite != null) {
					if (favorite.dish.indexOf(req.params.dishId) < 0) {
						favorite.dish.push({
							"_id": req.params.dishId
						});
						favorite.save()
							.then((favorite) => {
								Favorites.findById(favorite._id)
									.populate('user')
									.populate('dish')
									.then((favorite) => {
										res.statusCode = 200;
										res.setHeader('Content-Type', 'application/json');
										res.json(favorite);
									})
							})
							.catch((err) => {
								return next(err);
							});
					} else {
						Favorites.findById(favorite._id)
							.populate('user')
							.populate('dish')
							.then((favorite) => {
								res.statusCode = 200;
								res.setHeader('Content-Type', 'application/json');
								res.json(favorite);
							}, (err) => next(err));
					}
				} else {
					Favorites.create({
							user: req.user._id,
							dish: [{
								_id: req.params.dishId
							}]
						})
						.then((favorite) => {
							console.log('Favorite Added ', favorite);
							Favorites.findById(favorite._id)
								.populate('user')
								.populate('dish')
								.then((favorite) => {
									res.statusCode = 200;
									res.setHeader('Content-Type', 'application/json');
									res.json(favorite);
								})
						}, (err) => next(err))
						.catch((err) => next(err));
				}
			}, (err) => next(err))
			.catch((err) => next(err));
	})
	.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
		res.statusCode = 403;
		res.end('PUT operation not supported on /Favorites/' + req.params.dishId);
	})
	.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorites.findOne({
				user: req.user._id
			})
			.then((favorite) => {
				if (favorite != null) {
					const index = favorite.dish.indexOf(req.params.dishId);
					if (index > -1) {
						favorite.dish.splice(index, 1);
						favorite.save()
							.then((favorite) => {
								Favorites.findById(favorite._id)
									.populate('user')
									.populate('dish')
									.then((favorite) => {
										res.statusCode = 200;
										res.setHeader('Content-Type', 'application/json');
										res.json(favorite);
									})
							}, (err) => next(err))
							.catch((err) => next(err));
					} else {
						err = new Error('Dish ' + req.params.dishId + ' not found in favorites');
						err.status = 404;
						return next(err);
					}
				} else {
					err = new Error('No Favorites Found');
					err.status = 404;
					return next(err);
				}
			}, (err) => next(err))
			.catch((err) => next(err));
	});

module.exports = favoriteRouter;