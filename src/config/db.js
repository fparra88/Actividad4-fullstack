const mongoose = require('mongoose');

// Reutiliza la conexion (importante en entornos serverless como Vercel)
async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_productos';
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = connectDB;
