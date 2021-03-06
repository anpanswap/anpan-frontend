import React, { useState } from 'react'
import styled from 'styled-components'
import { Flex, ExpandableLabel, CardFooter, Skeleton, Heading, Box, Text } from '@anpanswap/uikit'
import { useTranslation } from 'contexts/Localization'
import { LotteryRound } from 'state/types'
import { useGetLotteryGraphDataById, usePriceAnpanBusd } from 'state/hooks'
import { formatNumber, getBalanceNumber } from 'utils/formatBalance'
import Balance from 'components/Balance'
import RewardBrackets from '../RewardBrackets'

const NextDrawWrapper = styled(Flex)`
  background: ${({ theme }) => theme.colors.background};
  padding: 24px;
  flex-direction: column;

  ${({ theme }) => theme.mediaQueries.sm} {
    flex-direction: row;
  }
`

const PreviousRoundCardFooter: React.FC<{ lotteryData: LotteryRound; lotteryId: string }> = ({
  lotteryData,
  lotteryId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { t } = useTranslation()
  const { amountCollectedInAnpan } = lotteryData
  const lotteryGraphData = useGetLotteryGraphDataById(lotteryId)
  const anpanPriceBusd = usePriceAnpanBusd()
  const prizeInBusd = amountCollectedInAnpan.times(anpanPriceBusd)

  const getPrizeBalances = () => {
    return (
      <>
        {prizeInBusd.isNaN() ? (
          <Skeleton my="7px" height={40} width={160} />
        ) : (
          <Heading scale="xl" lineHeight="1" color="secondary">
            ~${formatNumber(getBalanceNumber(prizeInBusd), 0, 0)}
          </Heading>
        )}
        {prizeInBusd.isNaN() ? (
          <Skeleton my="2px" height={14} width={90} />
        ) : (
          <Balance
            fontSize="14px"
            color="textSubtle"
            unit=" ANPAN"
            value={getBalanceNumber(amountCollectedInAnpan)}
            decimals={0}
          />
        )}
      </>
    )
  }

  return (
    <CardFooter p="0">
      {isExpanded && (
        <NextDrawWrapper>
          <Flex mr="24px" flexDirection="column" justifyContent="space-between">
            <Box>
              <Heading>{t('Prize pot')}</Heading>
              {getPrizeBalances()}
            </Box>
            <Box mb="24px">
              <Text fontSize="14px">
                {t('Total players this round')}: {lotteryGraphData.totalUsers.toLocaleString()}
              </Text>
            </Box>
          </Flex>
          <RewardBrackets lotteryData={lotteryData} isHistoricRound />
        </NextDrawWrapper>
      )}
      <Flex p="8px 24px" alignItems="center" justifyContent="center">
        <ExpandableLabel expanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? t('Hide') : t('Details')}
        </ExpandableLabel>
      </Flex>
    </CardFooter>
  )
}

export default PreviousRoundCardFooter
