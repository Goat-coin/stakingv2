import React from 'react';
import { Big, isZero, formatUnits } from '../utils/big-number';
import { useWallet } from '../contexts/wallet';
import * as request from '../utils/request';



const GOAT_APY = Big('144');

const StatsContext = React.createContext(null);

const max = (t, e) => (t.gte(e) ? t : e);
const min = (t, e) => (t.lte(e) ? t : e);

export function StatsProvider({ children }) {
  const {
    stakingContract,
    lpContract,
    wrappedBNBContract,
    goatContract,
    lpAddress,
    lpDecimals,
    wrappedBNBDecimals,
    goatDecimals,
    address,
  } = useWallet();

  // pool

  const [totalStaked, setTotalStaked] = React.useState(Big('0'));
  const [totalLockedShares, setTotalLockedShares] = React.useState(Big('0'));
  const [unlockScheduleCount, setUnlockScheduleCount] = React.useState(
    Big('0')
  );
  const [totalStakingShares, setTotalStakingShares] = React.useState(Big('0'));
  const [totalLocked, setTotalLocked] = React.useState(Big('0'));
  const [totalSupply, setTotalSupply] = React.useState(Big('0'));
  const [startBonus, setStartBonus] = React.useState(Big('0'));
  const [bonusPeriodSec, setBonusPeriodSec] = React.useState(Big('0'));
  const [poolBNBBalance, setPoolBNBBalance] = React.useState(Big('0'));
  const [poolGoatBalance, setPoolGoatBalance] = React.useState(Big('0'));
  const [schedules, setUnlockSchedules] = React.useState([]);
  const [bnbUSDPrice, setBNBUSDPrice] = React.useState(Big('0'));
  const [goatUSDPrice, setGoatUSDPrice] = React.useState(Big('0'));
  const [rewardPerToken, setRewardPerToken] = React.useState(Big('0'));
  // const rewardsDuration = stakingContract.rewardsDuration;
  const [getRewardForDuration, setRemainingReward] = React.useState(Big('0'));

  
  
  // user
  // const [availableGoatRewards, setAvailableGoatRewards] = React.useState(
  //   Big('0')
  // );
  const [availableCakeRewards, setAvailableCakeRewards] = React.useState(
    Big('0')
  );
  const [totalStakedFor, setTotalStakedFor] = React.useState(Big('0'));
  const [
    totalStakingShareSeconds,
    setTotalStakingShareSeconds,
  ] = React.useState(Big('0'));
  const [userStakingShareSeconds, setUserStakingShareSeconds] = React.useState(
    Big('0')
  );
  const [totalUserRewards, setTotalUserRewards] = React.useState(Big('0'));

  

  const totalUSDDeposits = React.useMemo(() => {
    if (
      !(
        !isZero(totalStaked) &&
        !isZero(totalSupply) &&
        !isZero(poolBNBBalance) &&
        !isZero(poolGoatBalance) &&
        !isZero(bnbUSDPrice) &&
        !isZero(goatUSDPrice) &&
        goatDecimals &&
        lpDecimals &&
        wrappedBNBDecimals
      )
    )
      return Big('0');

    const k = bnbUSDPrice;
    const A = goatUSDPrice;

    // const l = 18;
    const c = lpDecimals; // lp
    const p = wrappedBNBDecimals; // bnb
    const m = goatDecimals; // goat

    // const g = parseInt(v[0][0]) / 10 ** l;
    // const y = parseInt(v[0][1]) / 10 ** l;
    // const b = parseInt(v[0][5]);
    const w = Big(totalStaked).div(10 ** c);
    // const _ = parseInt(totalLockedShares);
    // const x = parseInt(unlockScheduleCount);
    // const S = parseInt(v[5]) / 10 ** l;
    const E = Big(totalSupply).div(10 ** c);
    // const M = yield up(h)
    // const k = yield up(f)
    // const A = yield up(d)
    const T = Big(poolBNBBalance).div(10 ** p);
    const C = Big(poolGoatBalance).div(10 ** m);

    const O = k.mul(T);
    const P = A.mul(C);

    const I = w.div(E);
    const N = O.add(P).mul(I);

    // console.log(
    //   Object.entries({ N, O, P, I, k, T, A, C, w, E }).reduce((r, [k, v]) => {
    //     r[k] = v.toString();
    //     return r;
    //   }, {})
    // );

    return N;
  }, [
    totalStaked,
    totalSupply,
    poolBNBBalance,
    poolGoatBalance,
    bnbUSDPrice,
    goatUSDPrice,
    goatDecimals,
    lpDecimals,
    wrappedBNBDecimals,
  ]);

  const stakingEndSec = React.useMemo(
    () =>
      !schedules.length ? Big('0') : schedules[schedules.length - 1].endAtSec,
    [schedules]
  );


  const [rewardEarned, setRewardEarned] = React.useState(0);

  
  // const rewardEarned = React.useMemo(
  //   () =>{
  //     let reward = 0; 
  //     getEarned().then(result => reward = result)
  //     return reward;
  //   }
  // );

  const hourlyUnlockRate = React.useMemo(() => {
    if (!(!isZero(totalLockedShares) && !isZero(totalLocked) && schedules))
      return Big('0');

    // const totalLockedSharesNormalized = totalLockedShares.div(1e18);

    const m = parseInt(Date.now() / 1e3);
    const i = Big(3600);

    const scheduleSharesEmittedPerHour = schedules.reduce((t, schedule) => {
      return t.add(
        min(max(schedule.endAtSec.sub(m), Big('0')), i)
          .div(schedule.durationSec)
          .mul(schedule.initialLockedShares)
      );
    }, Big('0'));

    return isZero(totalLocked)
      ? Big('0')
      : scheduleSharesEmittedPerHour
          .div(totalLockedShares)
          .mul(totalLocked)
          .div(1e9);
  }, [totalLockedShares, totalLocked, schedules]);

  const apy = React.useMemo(() => {
    if (!(!isZero(hourlyUnlockRate) && !isZero(totalUSDDeposits)))
      return Big('0');

    let BNB_APY = bnbUSDPrice
      .mul(250)
      .div(totalUSDDeposits)
      .mul(1300);

    let apy = hourlyUnlockRate
      .div(totalUSDDeposits)
      .mul(8760)
      .mul(100)
      .add(GOAT_APY)
      .add(BNB_APY);

    if (apy.gte(1e6)) {
      apy = Big(1e6);
    }

    return apy;
  }, [hourlyUnlockRate, totalUSDDeposits, bnbUSDPrice]);

  const rewardMultiplier = React.useMemo(() => {
    if (!!isZero(startBonus)) return Big('1');
    const maxMultiplier = Big('1').div(startBonus);
    const minMultiplier = 1;
    const e = {
      startBonus,
      maxMultiplier,
      minMultiplier,
    };
    //const p = availableGoatRewards;
    const p = 0;
    const m = totalUserRewards;
    let w = e.startBonus;
    const z = isZero(totalUserRewards) ? Big('1') : p.div(m);
    if (m.gt(Big('0'))) {
      w = max(w, z);
    }
    const _ = w.sub(e.startBonus).div(Big(1).sub(e.startBonus));
    const S = _.mul(e.maxMultiplier.sub(e.minMultiplier)).add(e.minMultiplier);
    // console.log(
    //   Object.entries({
    //     p,
    //     m,
    //     w,
    //     _,
    //     S,
    //     startBonus,
    //     maxMultiplier,
    //     minMultiplier,
    //     a: w.sub(e.startBonus),
    //     b: Big(1).sub(e.startBonus),
    //     z,
    //   }).reduce((r, [k, v]) => {
    //     r[k] = v.toString();
    //     return r;
    //   }, {})
    // );
    return S;
  }, [startBonus, totalUserRewards]);

  const bnbPonusPoolSharePercentage = React.useMemo(() => {
    if (isZero(totalStakingShareSeconds)) return Big('0');
    return userStakingShareSeconds.div(totalStakingShareSeconds);
  }, [userStakingShareSeconds, totalStakingShareSeconds]);

  const bnbPonusPoolShareAmount = React.useMemo(() => {
    const poolAmount = Big('250').mul(10 ** wrappedBNBDecimals); // total amount of BNB paid out
    return poolAmount.mul(bnbPonusPoolSharePercentage);
  }, [bnbPonusPoolSharePercentage, wrappedBNBDecimals]);

  const loadPoolStats = async () => {
    if (
      !(
        stakingContract &&
        lpContract &&
        wrappedBNBContract &&
        goatContract &&
        lpAddress
      )
    )
      return;
    const [
      totalSupply,
      poolBNBBalance,
      poolGoatBalance,
      [bnbUSDPrice, goatUSDPrice],
      rewardPerToken,
      getRewardForDuration
      
    ] = await Promise.all([
      lpContract.totalSupply(),
      wrappedBNBContract.balanceOf(lpAddress),
      goatContract.balanceOf(lpAddress),
      getCoinUsdPrices(['wbnb', 'goat']),
      stakingContract.rewardPerToken(),
      stakingContract.getRewardForDuration()
    ]);


    setTotalSupply(Big(totalSupply));
    setPoolBNBBalance(Big(poolBNBBalance));
    setPoolGoatBalance(Big(poolGoatBalance));
    setBNBUSDPrice(Big(bnbUSDPrice));
    setGoatUSDPrice(Big(goatUSDPrice));
    setRewardPerToken(Big(rewardPerToken));
    setRemainingReward(Big(getRewardForDuration));
  };

  const loadUserStats = async () => {
    if (!(stakingContract && address)) return;
    const [
      // availableCakeRewards,
      totalStakedFor,
      // [, , userStakingShareSeconds, totalStakingShareSeconds, totalUserRewards],
    ] = await Promise.all([
      // stakingContract.pendingCakeByUser(address),
      stakingContract.earned(address)
      // stakingContract.callStatic.updateAccounting(),
    ]);
    // const availableGoatRewards = totalStakedFor.isZero()
    // ? '0'
    // : await stakingContract.callStatic.unstakeQuery(totalStakedFor);
    // setAvailableCakeRewards(Big(availableCakeRewards));
    setTotalStakedFor(Big(totalStakedFor));
    // setAvailableGoatRewards(Big(availableGoatRewards));
    setTotalStakingShareSeconds(Big(totalStakingShareSeconds));
    setUserStakingShareSeconds(Big(userStakingShareSeconds));
    setTotalUserRewards(Big(totalUserRewards));
  };

  const getEarned = async () => {
    try {
      const earnedReward = await stakingContract.earned(address);
      // const totalSupply = await stakingContract.totalSupply();
      setRewardEarned(formatUnits(earnedReward, goatDecimals, 12));
      
      return formatUnits(earnedReward, goatDecimals, 12);
    } catch (e) {
      return 0;
      // getEarned();
      // useNotifications.showErrorNotification(e);
    }
  };
 

  // const subscribeToPoolStats = () => {
  //   if (!stakingContract) return;
  //   const stakedEvent = stakingContract.filters.Stake();
  //   const unstakedEvent = stakingContract.filters.Withdrawn();
  //   stakingContract.on(stakedEvent, loadPoolStats);
  //   stakingContract.on(unstakedEvent, loadPoolStats);
  //   return () => {
  //     stakingContract.off(stakedEvent, loadPoolStats);
  //     stakingContract.off(unstakedEvent, loadPoolStats);
  //   };
  // };

  // const subscribeToUserStats = () => {
  //   if (!(stakingContract && address)) return;
  //   const stakedEvent = stakingContract.filters.Stake();
  //   const unstakedEvent = stakingContract.filters.Withdrawn();
  //   stakingContract.on(stakedEvent, loadUserStats);
  //   stakingContract.on(unstakedEvent, loadUserStats);
  //   const cid = setInterval(loadUserStats, 1000 * 30);
  //   return () => {
  //     stakingContract.off(stakedEvent, loadUserStats);
  //     stakingContract.off(unstakedEvent, loadUserStats);
  //     clearInterval(cid);
  //   }; 
  // };

  React.useEffect(() => {
    loadPoolStats();
    // return subscribeToPoolStats(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stakingContract,
    lpContract,
    wrappedBNBContract,
    goatContract,
    lpAddress,
    lpDecimals,
    wrappedBNBDecimals,
    goatDecimals,
  ]);

  React.useEffect(() => {
    getEarned();
  }, [address]);

  React.useEffect(() => {
    loadUserStats();
    // return subscribeToUserStats(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stakingContract, address]);

  return (
    <StatsContext.Provider
      value={{
        totalStaked,
        totalLockedShares,
        unlockScheduleCount,
        totalStakingShares,
        totalLocked,
        totalSupply,
        startBonus,
        bonusPeriodSec,
        poolBNBBalance,
        poolGoatBalance,
        bnbUSDPrice,
        goatUSDPrice,
        schedules,
        

        // availableGoatRewards,
        availableCakeRewards,
        totalStakedFor,
        totalStakingShareSeconds,
        userStakingShareSeconds,

        rewardPerToken,
        getRewardForDuration,
        setRewardEarned,

        apy,
        hourlyUnlockRate,
        totalUSDDeposits,
        stakingEndSec,
        rewardMultiplier,
        bnbPonusPoolSharePercentage,
        bnbPonusPoolShareAmount,
        rewardEarned
      }}
    >
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = React.useContext(StatsContext);
  if (!context) {
    throw new Error('Missing stats context');
  }
  const {
    totalStaked,
    totalLockedShares,
    unlockScheduleCount,
    totalStakingShares,
    totalLocked,
    totalSupply,
    startBonus,
    bonusPeriodSec,
    poolBNBBalance,
    poolGoatBalance,
    schedules,
    bnbUSDPrice,
    goatUSDPrice,

    // availableGoatRewards,
    availableCakeRewards,
    totalStakedFor,
    totalStakingShareSeconds,
    userStakingShareSeconds,

    rewardPerToken,
    getRewardForDuration,
    setRewardEarned,

    apy,
    hourlyUnlockRate,
    totalUSDDeposits,
    stakingEndSec,
    rewardMultiplier,
    bnbPonusPoolSharePercentage,
    bnbPonusPoolShareAmount,
    rewardEarned
  } = context;

  return {
    totalStaked,
    totalLockedShares,
    unlockScheduleCount,
    totalStakingShares,
    totalLocked,
    totalSupply,
    startBonus,
    bonusPeriodSec,
    poolBNBBalance,
    poolGoatBalance,
    schedules,
    bnbUSDPrice,
    goatUSDPrice,

    // availableGoatRewards,
    availableCakeRewards,
    totalStakedFor,
    totalStakingShareSeconds,
    userStakingShareSeconds,

    rewardPerToken,
    getRewardForDuration,
    setRewardEarned,

    apy,
    hourlyUnlockRate,
    totalUSDDeposits,
    stakingEndSec,
    rewardMultiplier,
    bnbPonusPoolSharePercentage,
    bnbPonusPoolShareAmount,
    rewardEarned
  };
}

async function getCoinUsdPrices(assetsCoinGeckoIds) {
  const prices = await request.get(
    'https://api.coingecko.com/api/v3/simple/price',
    {
      ids: assetsCoinGeckoIds.join(','),
      vs_currencies: 'usd',
    }
  );
  return assetsCoinGeckoIds.map(id => Big((prices[id] || { usd: 0 }).usd));
}
