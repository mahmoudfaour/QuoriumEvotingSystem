const { Web3 } = require('web3'); // ✅ correct for v4
require('dotenv').config();

(async () => {
  const rpcUrl = process.env.QUORUM_RPC_URL || 'http://localhost:22000';
  const web3 = new Web3(rpcUrl);

  try {
    const nodeInfo = await web3.eth.getNodeInfo();
    console.log('✅ Connected to:', nodeInfo);

    const accounts = await web3.eth.getAccounts();
    console.log('💰 Available Accounts:', accounts);
  } catch (err) {
    console.error('❌ Error connecting to Quorum:', err.message);
  }
})();
