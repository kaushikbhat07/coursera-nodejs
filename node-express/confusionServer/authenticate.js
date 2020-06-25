var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/users');

var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

var config = require('./config.js');

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function (user) {
	return jwt.sign(user, config.secretKey, {
		expiresIn: 3600
	});
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts,
	(jwt_payload, done) => {
		console.log("JWT payload: ", jwt_payload);
		User.findOne({
			_id: jwt_payload._id
		}, (err, user) => {
			if (err) {
				return done(err, false);
			} else if (user) {
				return done(null, user);
			} else {
				return done(null, false);
			}
		});
	}));


exports.verifyUser = passport.authenticate('jwt', {
	session: false
});

exports.verifyAdmin = function (req, res, next) {
	var token = req.headers.authorization.split(" ")[1];
	var decAdmin = jwt.decode(token, {
		complete: true
	});
	if (token) {
		jwt.verify(token, config.secretKey, function (err, decoded) {
			if (err) {
				var err = new Error('You are not authenticated!');
				err.status = 401;
				return next(err);
			} else {
				var item = User.findOne({
					"_id": decoded._id
				}, function (err, item) {
					console.log(item.firstname);
					if (item.admin) {
						next();
					} else {
						var err = new Error('Not authorized!');
						err.status = 403;
						return next(err);
					}
				});
			}
		});
	} else {
		var err = new Error('No token provided!');
		err.status = 403;
		return next(err);
	}
};