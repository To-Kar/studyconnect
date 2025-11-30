import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer | undefined;

export const startPostgres = async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine') // <— add image name
    .withDatabase('studyconnect')
    .withUsername('postgres')
    .withPassword('postgres')
    .start();

  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = container.getMappedPort(5432).toString();
  process.env.DB_USER = container.getUsername();
  process.env.DB_PASSWORD = container.getPassword();
  process.env.DB_NAME = container.getDatabase();
  process.env.JWT_SECRET = 'test-secret';

  return container;
};

export const stopPostgres = async () => {
  if (container) {
    await container.stop();
    container = undefined;
  }
};