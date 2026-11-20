function notFound(req, res) {
  res.status(404).json({ message: 'Ruta no encontrada' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'El recurso ya existe' });
  }
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
}

module.exports = { notFound, errorHandler };
