import { stopPostgres } from './testutils/test-container';

module.exports = async () => {
  await stopPostgres();
};
