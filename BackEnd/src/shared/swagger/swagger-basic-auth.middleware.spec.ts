import { swaggerBasicAuth } from './swagger-basic-auth.middleware';
import { Request, Response } from 'express';

describe('swaggerBasicAuth', () => {
  const middleware = swaggerBasicAuth('admin', 'secret123');

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: jest.Mock;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    nextFn = jest.fn();
  });

  it('should return 401 when Authorization header is missing', () => {
    middleware(mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Basic realm="Cazua API Docs"',
    );
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should return 401 when credentials are incorrect', () => {
    const creds = Buffer.from('admin:wrongpassword').toString('base64');
    mockReq.headers = { authorization: `Basic ${creds}` };

    middleware(mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should call next() when credentials are valid', () => {
    const creds = Buffer.from('admin:secret123').toString('base64');
    mockReq.headers = { authorization: `Basic ${creds}` };

    middleware(mockReq as Request, mockRes as Response, nextFn);

    expect(nextFn).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});
