const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000 };

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email y password son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'La contrasena debe tener al menos 6 caracteres' });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: 'El email ya esta registrado' });
    }
    const user = await User.create({ name, email, password });
    res.status(201).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email y password son obligatorios' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }
    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTS);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Sesion cerrada' });
};
