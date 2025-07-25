const fs = require('fs');
const axios = require('axios');

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ETH_ADDRESS = process.env.ETH_ADDRESS;
const BTC_ADDRESS = process.env.BTC_ADDRESS;

async function getETHBalance() {
  const url = `https://api.etherscan.io/api?module=account&action=balance&address=${ETH_ADDRESS}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
  const res = await axios.get(url);
  return parseFloat(res.data.result) / 1e18;
}

async function getBTCBalance() {
  const url = `https://blockstream.info/api/address/${BTC_ADDRESS}`;
  const res = await axios.get(url);
  const funded = res.data.chain_stats.funded_txo_sum;
  const spent = res.data.chain_stats.spent_txo_sum;
  return (funded - spent) / 1e8;
}

async function getPrices() {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd`;
  const res = await axios.get(url);
  return {
    eth: res.data.ethereum.usd,
    btc: res.data.bitcoin.usd
  };
}

async function main() {
  const eth = await getETHBalance();
  const btc = await getBTCBalance();
  const prices = await getPrices();

  const totalUSD = eth * prices.eth + btc * prices.btc;
  const timestamp = new Date().toISOString();

  const entry = {
    timestamp,
    eth: eth.toFixed(6),
    btc: btc.toFixed(6),
    usd: totalUSD.toFixed(2)
  };

  let history = [];
  try {
    const data = fs.readFileSync('balance-history.json', 'utf8');
    history = JSON.parse(data);
  } catch (e) {
    console.log('Creating new balance-history.json');
  }

  history.push(entry);

  fs.writeFileSync('balance-history.json', JSON.stringify(history, null, 2));
  console.log('✅ Balance logged at', timestamp);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
