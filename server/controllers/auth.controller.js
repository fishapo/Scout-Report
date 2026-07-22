const authService = require("../auth");

async function login(req, res, next) {
    try {
        const result = await authService.loginUser(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function register(req, res, next) {
    try {
        const result = await authService.registerUser(req.body, {
            currentUser: req.user
        });

        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

async function logout(req, res, next) {
    try {
        await authService.logoutSession(req.session.id);

        res.status(204).end();
    } catch (err) {
        next(err);
    }
}

async function me(req, res) {
    res.json(req.user);
}

module.exports = {
    login,
    logout,
    me,
    register
};