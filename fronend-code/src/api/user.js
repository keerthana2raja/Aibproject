import client from './client';

export const getUserProfile = () =>
  client.get('/v1/users/profile');

/** Directory snapshot from Mongo User collection (empty when DB_PROVIDER=sqlite). */
export const listDirectoryUsers = () =>
  client.get('/v1/users');
