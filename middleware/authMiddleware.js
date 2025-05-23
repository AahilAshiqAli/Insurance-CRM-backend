const jwt = require('jsonwebtoken');


//Verify karti hai Authtoken ko jo bhi request ayi hai ( Get, Put, Post) uskay sath.
//If token isnt right/doesnt exist, then request denied hojati.

function authMiddleware(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ error: 'Invalid token.' });
    }
}

module.exports = authMiddleware;
