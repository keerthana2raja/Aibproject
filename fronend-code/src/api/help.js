import client from './client';

export const getHelp = () => client.get('/v1/help');
