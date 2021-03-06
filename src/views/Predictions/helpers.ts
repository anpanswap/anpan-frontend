import BigNumber from 'bignumber.js'
import { Bet, BetPosition } from 'state/types'
import { DefaultTheme } from 'styled-components'
import { formatNumber, getBalanceAmount } from 'utils/formatBalance'
import getTimePeriods from 'utils/getTimePeriods'

export const getBnbAmount = (bnbBn: BigNumber) => {
  return getBalanceAmount(bnbBn, 18)
}

export const formatUsd = (usd: number) => {
  return `$${formatNumber(usd || 0, 3, 3)}`
}

export const formatBnb = (bnb: number) => {
  return bnb ? bnb.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '0'
}

export const formatBnbFromBigNumber = (bnbBn: BigNumber) => {
  return formatBnb(getBnbAmount(bnbBn).toNumber())
}

export const padTime = (num: number) => num.toString().padStart(2, '0')

export const formatRoundTime = (secondsBetweenBlocks: number) => {
  const { hours, minutes, seconds } = getTimePeriods(secondsBetweenBlocks)
  const minutesSeconds = `${padTime(minutes)}:${padTime(seconds)}`

  if (hours > 0) {
    return `${padTime(hours)}:${minutesSeconds}`
  }

  return minutesSeconds
}

export const getMultiplier = (total: number, amount: number) => {
  if (total === 0 || amount === 0) {
    return 0
  }

  return total / amount
}

/**
 * Calculates the total payout given a bet
 */
export const getPayout = (bet: Bet, rewardRate = 1) => {
  if (!bet || !bet.round) {
    return 0
  }

  const { bullAmount, bearAmount, totalAmount } = bet.round
  const multiplier = getMultiplier(totalAmount, bet.position === BetPosition.BULL ? bullAmount : bearAmount)
  return bet.amount * multiplier * rewardRate
}

export const getNetPayout = (bet: Bet, rewardRate = 1): number => {
  if (!bet || !bet.round) {
    return 0
  }

  const payout = getPayout(bet, rewardRate)
  return payout - bet.amount
}

// TODO: Move this to the UI Kit
export const getBubbleGumBackground = (theme: DefaultTheme) => {
  if (theme.isDark) {
    return 'linear-gradient(139.73deg, #003166 0%, #665200 47.4%, #502916 100%)'
  }

  return 'linear-gradient(139.73deg, #e6f2ff 0%, #fffae6 46.87%, #f9f0eb 100%)'
}
