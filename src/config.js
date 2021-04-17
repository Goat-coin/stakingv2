export const APP_SLUG = 'goat';

export const APP_TITLE = 'Goat Staking V2';

export const CACHE_WALLET_KEY = 'wallet';

export const BORDER_RADIUS = 8;

export const IS_TESTNET = false; //~window.location.href.indexOf('testnet');

export const NETWORKS = {
  56: {
    stakingAddress: ~window.location.href.indexOf('beta')
      ? '0x2aBF631940eAE8888dFfEFbEfC6BEbF662d7B5EB'
      : ~window.location.href.indexOf('test')
      ? '0x2aBF631940eAE8888dFfEFbEfC6BEbF662d7B5EB'
      : '0x2aBF631940eAE8888dFfEFbEfC6BEbF662d7B5EB',
    drops:
      ~window.location.href.indexOf('localhost') ||
      ~window.location.href.indexOf('test')
        ? new Map([
            ['0xC32F5887840314aB000dbA3125d84466B97bd08B', '2021-01-25'],
          ])
        : new Map([
            ['0xC32F5887840314aB000dbA3125d84466B97bd08B', '2021-01-25'],
          ]),
  },
  97: {
    stakingAddress: '',
  },
};

export const NETWORK_NAME = IS_TESTNET ? 'testnet' : 'mainnet';

export const NETWORK_CHAIN_ID = IS_TESTNET ? 97 : 56;

export const READ_WEB3_PROVIDER = IS_TESTNET
  ? 'https://data-seed-prebsc-1-s1.binance.org:8545'
  : 'https://bsc-dataseed1.binance.org:443';

export const EMPTY_CALL_DATA =
  '0x0000000000000000000000000000000000000000000000000000000000000001';

export const ROUTER_BASE_NAME = process.env.REACT_APP_ROUTER_BASE_NAME;

export const SECONDARY_COLOR = '#ffa132';

export const NETWORK = NETWORKS[NETWORK_CHAIN_ID];

export const API_URL = process.env.REACT_APP_API_URL;
