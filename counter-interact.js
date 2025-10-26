import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Counter contract ABI (only the functions we need)
const COUNTER_ABI = [
  'function increment() public',
  'function decrement() public',
  'function getCount() public view returns (uint256)',
  'function owner() public view returns (address)',
  'event Incremented(uint256 newCount, address indexed caller)'
];

// Configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
const COUNTER_ADDRESS = process.env.COUNTER_ADDRESS;
const INCREMENT_COUNT = 50;
const MIN_DELAY = 1000;  // 1 second
const MAX_DELAY = 3000;  // 3 seconds

// Validate configuration
if (!PRIVATE_KEY) {
  console.error('❌ Error: PRIVATE_KEY not found in .env');
  process.exit(1);
}

if (!COUNTER_ADDRESS) {
  console.error('❌ Error: COUNTER_ADDRESS not found in .env');
  console.error('Please deploy the contract first and add the address to .env');
  process.exit(1);
}

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(COUNTER_ADDRESS, COUNTER_ABI, wallet);

// Helper function to wait random time
function randomDelay() {
  const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Helper function to format ETH
function formatEth(wei) {
  return parseFloat(ethers.formatEther(wei)).toFixed(6);
}

async function main() {
  console.log('🎯 Counter Interaction Test');
  console.log('============================');
  console.log('Contract Address:', COUNTER_ADDRESS);
  console.log('Wallet Address:', wallet.address);
  console.log('Target Increments:', INCREMENT_COUNT);
  console.log('Delay Range:', `${MIN_DELAY / 1000}s - ${MAX_DELAY / 1000}s`);
  console.log('');

  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Wallet Balance:', formatEth(balance), 'ETH');
  
  if (balance === 0n) {
    console.error('❌ Error: Insufficient balance. Please add Sepolia ETH to your wallet.');
    process.exit(1);
  }

  // Get initial count
  const initialCount = await contract.getCount();
  console.log('📊 Initial Counter Value:', initialCount.toString());
  console.log('');

  // Statistics tracking
  let successCount = 0;
  let failCount = 0;
  let totalGasUsed = 0n;
  let totalGasCost = 0n;

  // Start incrementing
  console.log('🚀 Starting increment operations...');
  console.log('');

  for (let i = 1; i <= INCREMENT_COUNT; i++) {
    try {
      // Get current count before increment
      const currentCount = await contract.getCount();
      
      // Send increment transaction
      console.log(`[${i}/${INCREMENT_COUNT}] Incrementing... (current: ${currentCount.toString()})`);
      
      const tx = await contract.increment();
      console.log(`  ⏳ Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      // Get gas statistics
      const gasUsed = receipt.gasUsed;
      const gasPrice = receipt.gasPrice || tx.gasPrice;
      const gasCost = gasUsed * gasPrice;
      
      totalGasUsed += gasUsed;
      totalGasCost += gasCost;
      
      // Get new count
      const newCount = await contract.getCount();
      
      console.log(`  ✅ Success! New count: ${newCount.toString()}`);
      console.log(`  ⛽ Gas used: ${gasUsed.toString()} | Cost: ${formatEth(gasCost)} ETH`);
      
      successCount++;
      
      // Wait random delay before next increment (except for last one)
      if (i < INCREMENT_COUNT) {
        const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
        console.log(`  ⏰ Waiting ${(delay / 1000).toFixed(1)}s...`);
        await randomDelay();
        console.log('');
      }
      
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
      failCount++;
      
      // Wait before retry
      console.log('  ⏰ Waiting 5s before continuing...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('');
    }
  }

  // Final statistics
  console.log('');
  console.log('📈 Final Statistics');
  console.log('===================');
  
  const finalCount = await contract.getCount();
  console.log('Initial Count:', initialCount.toString());
  console.log('Final Count:', finalCount.toString());
  console.log('Actual Increments:', (finalCount - initialCount).toString());
  console.log('');
  
  console.log('Success:', successCount);
  console.log('Failed:', failCount);
  console.log('Success Rate:', `${((successCount / INCREMENT_COUNT) * 100).toFixed(2)}%`);
  console.log('');
  
  console.log('Total Gas Used:', totalGasUsed.toString());
  console.log('Total Gas Cost:', formatEth(totalGasCost), 'ETH');
  console.log('Avg Gas Per Tx:', successCount > 0 ? (totalGasUsed / BigInt(successCount)).toString() : '0');
  console.log('Avg Cost Per Tx:', successCount > 0 ? formatEth(totalGasCost / BigInt(successCount)) + ' ETH' : '0 ETH');
  console.log('');
  
  const finalBalance = await provider.getBalance(wallet.address);
  console.log('Initial Balance:', formatEth(balance), 'ETH');
  console.log('Final Balance:', formatEth(finalBalance), 'ETH');
  console.log('Total Spent:', formatEth(balance - finalBalance), 'ETH');
  console.log('');
  console.log('✅ Test completed!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
