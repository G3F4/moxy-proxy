import supertest from 'supertest';
import startApplication from '../startApplication';

describe('Application', () => {
  it('starts to listening', async () => {
    expect(true).toBe(true);

    const fastify = startApplication();

    await fastify.ready();

    const response = await supertest(fastify.server)
      .get('/')
      .expect(200)
      .expect('Content-Type', 'text/html');

    expect(response).toBeTruthy();
  });
});
