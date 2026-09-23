/**
 * ReputeX v3 Pre-Sign Transaction Simulation Engine
 * Decodes EVM transaction data, evaluates approval risks, calculates net asset changes,
 * and performs real-time counterparty risk scoring before execution.
 */
const { fetchWalletMetrics } = require('../services/dataAggregator');
const { calculateReputation } = require('./xaiEngine');

const SELECTORS = {
  APPROVE: '0x095ea7b3',             // approve(address,uint256)
  TRANSFER: '0xa9059cbb',            // transfer(address,uint256)
  TRANSFER_FROM: '0x23b872dd',       // transferFrom(address,address,uint256)
  SET_APPROVAL_FOR_ALL: '0xa22cb465' // setApprovalForAll(address,bool)
};

function parseAddress(hexStr) {
  if (!hexStr || hexStr.length < 40) return '0x0000000000000000000000000000000000000000';
  const clean = hexStr.replace(/^0x/, '');
  return '0x' + clean.slice(-40).toLowerCase();
}

function parseBigIntHex(hexStr) {
  if (!hexStr) return 0n;
  try {
    return BigInt(hexStr.startsWith('0x') ? hexStr : '0x' + hexStr);
  } catch (e) {
    return 0n;
  }
}

async function simulateTransaction(payload) {
  const { method, params } = payload;
  const warnings = [];
  const assetChanges = [];
  let recipientAddress = null;
  let functionName = 'Unknown Action';
  let targetContract = null;

  let txObj = {};

  if (method === 'eth_sendTransaction' && params && params[0]) {
    txObj = params[0];
  } else if (method === 'personal_sign' || method === 'eth_signTypedData_v4') {
    return {
      status: 'SUCCESS',
      functionName: 'Message Signature Request',
      warnings: [{
        severity: 'MEDIUM',
        message: 'Signature Request: Off-chain signature requested. Never sign messages containing unknown permit approvals.'
      }],
      assetChanges: [],
      counterpartyScore: 75,
      riskCategory: 'CAUTION',
      timestamp: new Date().toISOString()
    };
  }

  const fromAddr = parseAddress(txObj.from);
  targetContract = parseAddress(txObj.to);
  recipientAddress = targetContract;

  const data = (txObj.data || '0x').toLowerCase();
  const valueWei = parseBigIntHex(txObj.value || '0x0');
  const valueETH = Number(valueWei) / 1e18;

  if (valueETH > 0) {
    assetChanges.push({
      direction: 'OUT',
      symbol: 'ETH',
      amount: valueETH.toFixed(4),
      type: 'NATIVE'
    });
  }

  // ABI Selector Decoding
  if (data.startsWith(SELECTORS.APPROVE)) {
    functionName = 'Token Approval (approve)';
    const spender = parseAddress(data.slice(10, 74));
    const rawAmount = parseBigIntHex('0x' + data.slice(74, 138));
    recipientAddress = spender;

    // Check for Unlimited Approval (2^256 - 1 or extremely large allowance)
    const isUnlimited = rawAmount > 1000000000000000000000000000n; // > 1 Billion tokens

    assetChanges.push({
      direction: 'APPROVAL',
      symbol: 'ERC-20 Token Allowance',
      amount: isUnlimited ? 'Unlimited (Maxuint256)' : (Number(rawAmount / 10n**18n)).toString(),
      type: 'TOKEN_APPROVAL'
    });

    if (isUnlimited) {
      warnings.push({
        severity: 'CRITICAL',
        message: '🚨 UNLIMITED TOKEN APPROVAL: This transaction grants the spender contract permission to withdraw ALL your tokens at any time.'
      });
    } else {
      warnings.push({
        severity: 'HIGH',
        message: '⚠️ Token Allowance Granted: Giving third-party contract spending authority over your tokens.'
      });
    }
  } else if (data.startsWith(SELECTORS.SET_APPROVAL_FOR_ALL)) {
    functionName = 'NFT Collection Approval (setApprovalForAll)';
    const operator = parseAddress(data.slice(10, 74));
    const approved = data.slice(74, 138).endsWith('1');
    recipientAddress = operator;

    if (approved) {
      warnings.push({
        severity: 'CRITICAL',
        message: '🚨 UNLIMITED NFT APPROVAL: Grants operator full control to transfer ALL NFTs in this collection out of your wallet!'
      });
    }
    assetChanges.push({
      direction: 'APPROVAL',
      symbol: 'NFT Collection (All Items)',
      amount: approved ? 'Granted (Full Access)' : 'Revoked',
      type: 'NFT_APPROVAL'
    });
  } else if (data.startsWith(SELECTORS.TRANSFER)) {
    functionName = 'Token Transfer (transfer)';
    const toUser = parseAddress(data.slice(10, 74));
    const rawAmount = parseBigIntHex('0x' + data.slice(74, 138));
    recipientAddress = toUser;

    assetChanges.push({
      direction: 'OUT',
      symbol: 'ERC-20 Tokens',
      amount: (Number(rawAmount / 10n**18n)).toFixed(4),
      type: 'ERC20_TRANSFER'
    });
  } else if (data.length > 10) {
    functionName = 'Smart Contract Interaction';
  } else if (valueETH > 0) {
    functionName = 'Native Currency Transfer';
  }

  // Counterparty Risk Assessment via XAI Engine
  let counterpartyReport = { score: 75, riskCategory: 'CAUTION', isVerifiedContract: true };
  try {
    if (recipientAddress && recipientAddress !== '0x0000000000000000000000000000000000000000') {
      const metrics = await fetchWalletMetrics(recipientAddress);
      counterpartyReport = await calculateReputation(metrics);

      if (counterpartyReport.score < 55) {
        warnings.push({
          severity: 'CRITICAL',
          message: `🚨 HIGH RISK COUNTERPARTY: Recipient address (${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}) has a low trust score of ${counterpartyReport.score}/100!`
        });
      }

      if (counterpartyReport.isVerifiedContract === false) {
        warnings.push({
          severity: 'HIGH',
          message: '⚠️ UNVERIFIED CONTRACT: Source code for target contract is NOT publicly verified on block explorers.'
        });
      }
    }
  } catch (err) {
    console.warn('Simulation counterparty lookup warning:', err.message);
  }

  return {
    status: 'SUCCESS',
    functionName,
    targetContract,
    recipientAddress,
    counterpartyScore: counterpartyReport.score,
    riskCategory: counterpartyReport.riskCategory,
    isVerifiedContract: counterpartyReport.isVerifiedContract,
    warnings,
    assetChanges,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  simulateTransaction
};
