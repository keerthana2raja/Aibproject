import client from './client';

export const login = (email, password) =>
  client.post('/v1/auth/login', { email, password });

export const logout = () =>
  client.post('/v1/auth/logout');
