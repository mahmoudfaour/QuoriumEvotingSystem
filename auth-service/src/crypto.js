const { Web3 } = require('web3');
const web3 = new Web3();

// For production you move this to .env as HASH_SALT.
// For now it's fine here so the demo works.
const SECRET_SALT = process.env.HASH_SALT || 'SUPER_SECRET_SALT_FOR_DEMO';

function computeVoterHash(userId, electionId) {
  return web3.utils.soliditySha3(
    { type: 'uint256', value: userId },
    { type: 'uint256', value: electionId },
    { type: 'string', value: SECRET_SALT }
  );
}

module.exports = { computeVoterHash };
