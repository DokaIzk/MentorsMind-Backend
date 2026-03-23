import * as StellarSdk from '@stellar/stellar-sdk';
import { env } from './env';
import config from './index';

export const server = new StellarSdk.Horizon.Server(config.stellar.horizonUrl);

export const networkPassphrase =
  config.stellar.network === 'testnet'
    ? StellarSdk.Networks.TESTNET
    : StellarSdk.Networks.PUBLIC;

// Secret key is read directly from env — never stored in the config object
export const getPlatformKeypair = (): StellarSdk.Keypair | null => {
  const secretKey = env.PLATFORM_SECRET_KEY;
  if (!secretKey) {
    console.warn('⚠️  Platform secret key not configured');
    return null;
  }
  return StellarSdk.Keypair.fromSecret(secretKey);
};

export const testStellarConnection = async (): Promise<boolean> => {
  try {
    await server.ledgers().limit(1).call();
    console.log(`✅ Stellar ${config.stellar.network} connected successfully`);
    return true;
  } catch (error) {
    console.error('❌ Stellar connection failed:', error instanceof Error ? error.message : error);
    return false;
  }
};

export { StellarSdk };
