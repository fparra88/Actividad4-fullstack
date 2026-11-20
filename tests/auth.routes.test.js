process.env.JWT_SECRET = 'test_secret';

jest.mock('../src/models/User');

const request = require('supertest');
const User = require('../src/models/User');
const app = require('../src/app');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/register', () => {
  test('400 si faltan campos', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@a.com' });
    expect(res.status).toBe(400);
  });

  test('400 si la contrasena es corta', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'a@a.com', password: '123' });
    expect(res.status).toBe(400);
  });

  test('409 si el email existe', async () => {
    User.findOne.mockResolvedValue({ _id: '1' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'a@a.com', password: '123456' });
    expect(res.status).toBe(409);
  });

  test('201 crea usuario', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: '1', name: 'A', email: 'a@a.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'a@a.com', password: '123456' });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('a@a.com');
    expect(res.body.password).toBeUndefined();
  });

  test('500 si la BD falla', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    User.findOne.mockRejectedValue(new Error('db'));
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'a@a.com', password: '123456' });
    expect(res.status).toBe(500);
    spy.mockRestore();
  });
});

describe('POST /api/auth/login', () => {
  const mockFind = (user) => User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

  test('400 sin credenciales', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('401 usuario inexistente', async () => {
    mockFind(null);
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: 'x' });
    expect(res.status).toBe(401);
  });

  test('401 contrasena incorrecta', async () => {
    mockFind({ comparePassword: jest.fn().mockResolvedValue(false) });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: 'x' });
    expect(res.status).toBe(401);
  });

  test('200 devuelve token y cookie', async () => {
    mockFind({ _id: '1', name: 'A', email: 'a@a.com', comparePassword: jest.fn().mockResolvedValue(true) });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=/);
  });
});

describe('POST /api/auth/logout', () => {
  test('limpia la cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/token=;/);
  });
});
