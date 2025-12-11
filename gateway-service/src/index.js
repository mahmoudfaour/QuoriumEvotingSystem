const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { web3, contract } = require('./contract');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Blockchain Gateway Service running' });
});

// POST /gateway/vote
// Body: { electionId, candidateId, voterHash }
app.post('/gateway/vote', async (req, res) => {
  try {
    const { electionId, candidateId, voterHash } = req.body;

    if (!electionId || !candidateId || !voterHash) {
      return res.status(400).json({ error: 'Missing electionId, candidateId or voterHash' });
    }

    const accounts = await web3.eth.getAccounts();
    const from = accounts[0];

    // Quorum uses legacy transactions (no EIP-1559)
const tx = await contract.methods
  .vote(electionId, candidateId, voterHash)
  .send({
    from,
    gas: 3000000,         // set a manual gas limit
    gasPrice: '0'         // Quorum typically uses 0 gasPrice
  });

    return res.json({
      success: true,
      txHash: tx.transactionHash,
    });
  } catch (err) {
    console.error('Vote error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/debug/contract-code', async (req, res) => {
  try {
    const code = await web3.eth.getCode(process.env.CONTRACT_ADDRESS.trim());
    res.json({
      address: process.env.CONTRACT_ADDRESS.trim(),
      hasCode: code && code !== '0x',
      codeLength: code.length
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Gateway Service listening on port ${PORT}`);
});
