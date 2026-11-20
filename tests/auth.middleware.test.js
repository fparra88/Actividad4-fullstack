const jwt = require('jsonwebtoken');
const auth = require('../src/middlewares/auth');
const validateObjectId = require('../src/middlewares/validateObjectId');
const { errorHandler, notFound } = require('../src/middlewares/errorHandler');

process.env.JWT_SECRET = 'test_secret';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('auth middleware', () => {
  test('401 sin token', () => {
    const res = mockRes();
    const next = jest.fn();
    auth({ headers: {}, cookies: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('401 con token invalido', () => {
    const res = mockRes();
    auth({ headers: { authorization: 'Bearer malo' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('acepta Bearer valido y llena req.user', () => {
    const token = jwt.sign({ id: 'abc' }, 'test_secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();
    auth(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('abc');
  });

  test('acepta token en cookie', () => {
    const token = jwt.sign({ id: 'xyz' }, 'test_secret');
    const req = { headers: {}, cookies: { token } };
    const next = jest.fn();
    auth(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('validateObjectId', () => {
  test('400 con id invalido', () => {
    const res = mockRes();
    validateObjectId({ params: { id: '123' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test('continua con id valido', () => {
    const next = jest.fn();
    validateObjectId({ params: { id: '507f1f77bcf86cd799439011' } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('errorHandler', () => {
  test('ValidationError -> 400', () => {
    const res = mockRes();
    errorHandler({ name: 'ValidationError', message: 'x' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test('duplicado -> 409', () => {
    const res = mockRes();
    errorHandler({ code: 11000 }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
  });
  test('desconocido -> 500', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    errorHandler(new Error('boom'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });
  test('notFound -> 404', () => {
    const res = mockRes();
    notFound({}, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
