import client from './client';

export const getCatalogMasters = () => client.get('/v1/catalog/masters');
