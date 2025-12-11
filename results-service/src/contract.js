const { Web3 } = require('web3');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const rpcUrl = (process.env.QUORUM_RPC_URL || '').trim();
const contractAddress = (process.env.CONTRACT_ADDRESS || '').trim();

if (!rpcUrl) throw new Error('QUORUM_RPC_URL is not set in .env');
if (!contractAddress) throw new Error('CONTRACT_ADDRESS is not set in .env');

const abiPath = path.join(__dirname, '../ElectionVotingABI.json');
const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
const contract = new web3.eth.Contract(abi, contractAddress);

// helpful logs:
console.log('[Results] RPC:', rpcUrl);
console.log('[Results] CONTRACT_ADDRESS:', contractAddress);

module.exports = { web3, contract };
