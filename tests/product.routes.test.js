process.env.JWT_SECRET = 'test_secret';

jest.mock('../src/models/Product');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const Product = require('../src/models/Product');
const app = require('../src/app');

const USER_ID = '507f1f77bcf86cd799439011';
const PROD_ID = '507f1f77bcf86cd799439022';
const token = jwt.sign({ id: USER_ID, email: 'a@a.com' }, 'test_secret');
const auth = { Authorization: `Bearer ${token}` };

beforeEach(() => jest.clearAllMocks());

describe('proteccion JWT', () => {
  test.each([
    ['get', '/api/products'],
    ['post', '/api/products'],
    ['get', `/api/products/${PROD_ID}`],
    ['put', `/api/products/${PROD_ID}`],
    ['delete', `/api/products/${PROD_ID}`],
  ])('%s %s devuelve 401 sin token', async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/products', () => {
  test('lista los productos del usuario', async () => {
    Product.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ name: 'P1' }]) });
    const res = await request(app).get('/api/products').set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ name: 'P1' }]);
    expect(Product.find).toHaveBeenCalledWith({ owner: USER_ID });
  });

  test('500 si falla la BD', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    Product.find.mockImplementation(() => { throw new Error('db'); });
    const res = await request(app).get('/api/products').set(auth);
    expect(res.status).toBe(500);
    spy.mockRestore();
  });
});

describe('GET /api/products/:id', () => {
  test('400 con id invalido', async () => {
    const res = await request(app).get('/api/products/abc').set(auth);
    expect(res.status).toBe(400);
  });
  test('404 si no existe', async () => {
    Product.findOne.mockResolvedValue(null);
    const res = await request(app).get(`/api/products/${PROD_ID}`).set(auth);
    expect(res.status).toBe(404);
  });
  test('200 si existe', async () => {
    Product.findOne.mockResolvedValue({ name: 'P1' });
    const res = await request(app).get(`/api/products/${PROD_ID}`).set(auth);
    expect(res.status).toBe(200);
    expect(Product.findOne).toHaveBeenCalledWith({ _id: PROD_ID, owner: USER_ID });
  });
});

describe('POST /api/products', () => {
  test('201 crea asignando owner y filtrando campos', async () => {
    Product.create.mockImplementation(async (d) => d);
    const res = await request(app)
      .post('/api/products')
      .set(auth)
      .send({ name: 'P', price: 10, owner: 'hacker', admin: true });
    expect(res.status).toBe(201);
    expect(Product.create).toHaveBeenCalledWith({ name: 'P', price: 10, owner: USER_ID });
  });

  test('400 ante error de validacion', async () => {
    Product.create.mockRejectedValue({ name: 'ValidationError', message: 'price requerido' });
    const res = await request(app).post('/api/products').set(auth).send({ name: 'P' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/products/:id', () => {
  test('200 actualiza', async () => {
    Product.findOneAndUpdate.mockResolvedValue({ name: 'Nuevo' });
    const res = await request(app).put(`/api/products/${PROD_ID}`).set(auth).send({ name: 'Nuevo' });
    expect(res.status).toBe(200);
    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: PROD_ID, owner: USER_ID },
      { name: 'Nuevo' },
      { new: true, runValidators: true }
    );
  });
  test('404 si no existe', async () => {
    Product.findOneAndUpdate.mockResolvedValue(null);
    const res = await request(app).put(`/api/products/${PROD_ID}`).set(auth).send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  test('200 elimina', async () => {
    Product.findOneAndDelete.mockResolvedValue({ _id: PROD_ID });
    const res = await request(app).delete(`/api/products/${PROD_ID}`).set(auth);
    expect(res.status).toBe(200);
  });
  test('404 si no existe', async () => {
    Product.findOneAndDelete.mockResolvedValue(null);
    const res = await request(app).delete(`/api/products/${PROD_ID}`).set(auth);
    expect(res.status).toBe(404);
  });
});

describe('rutas desconocidas', () => {
  test('404 JSON', async () => {
    const res = await request(app).get('/api/nada');
    expect(res.status).toBe(404);
  });
});
