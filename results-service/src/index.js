const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { web3, contract } = require('./contract');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Results & Audit Service running' });
});

// GET /results/:electionId
app.get('/results/:electionId', async (req, res) => {
  try {
    const electionId = Number(req.params.electionId);
    if (!Number.isInteger(electionId) || electionId <= 0) {
      return res.status(400).json({ error: 'Invalid electionId' });
    }

    const result = await contract.methods.getResults(electionId).call();

    // web3 v4 can return object-like tuples: {'0': [...], '1': [...], '2': [...]}
    const ids   = result[0] ?? result['0'] ?? result.ids   ?? [];
    const names = result[1] ?? result['1'] ?? result.names ?? [];
    const votes = result[2] ?? result['2'] ?? result.votes ?? [];

    const candidates = ids.map((id, i) => ({
      id: Number(id),
      name: names[i],
      votes: Number(votes[i]),
    }));

    return res.json({ electionId, candidates });
  } catch (err) {
    // surface revert reason if present
    const msg =
      err?.data?.message ||
      err?.data?.error?.message ||
      err?.message ||
      'Unknown error';
    console.error('Results error:', msg);
    return res.status(500).json({ error: msg });
  }
});


// Simple audit endpoint
app.get('/audit/chain-info', async (req, res) => {
  try {
    const nodeInfo = await web3.eth.getNodeInfo();
    const blockNumber = await web3.eth.getBlockNumber();
    const latestBlock = await web3.eth.getBlock(blockNumber);

    return res.json({
      nodeInfo,
      blockNumber: Number(blockNumber),
      latestBlockHash: latestBlock.hash,
    });
  } catch (err) {
    console.error('Audit error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/debug/contract-code', async (req, res) => {
  try {
    const code = await web3.eth.getCode(process.env.CONTRACT_ADDRESS);
    return res.json({ address: process.env.CONTRACT_ADDRESS, hasCode: code && code !== '0x', codeLength: code.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});


const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Results & Audit Service listening on port ${PORT}`);
});
