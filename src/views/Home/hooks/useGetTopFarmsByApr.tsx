import { useState, useEffect } from 'react'
import { ChainId } from '@anpanswap-libs/sdk'
import { useFarms, usePriceAnpanBusd } from 'state/farms/hooks'
import { useAppDispatch } from 'state'
import { fetchFarmsPublicDataAsync, nonArchivedFarms } from 'state/farms'
import { getFarmApr } from 'utils/apr'
import BigNumber from 'bignumber.js'
import { orderBy } from 'lodash'
import { FarmWithStakedValue } from 'views/Farms/components/FarmCard/FarmCard'
import { Farm } from 'state/types'

enum FetchStatus {
  NOT_FETCHED = 'not-fetched',
  FETCHING = 'fetching',
  SUCCESS = 'success',
  FAILED = 'failed',
}

const useGetTopFarmsByApr = (isIntersecting: boolean) => {
  const dispatch = useAppDispatch()
  const { data: farms } = useFarms()
  const [fetchStatus, setFetchStatus] = useState(FetchStatus.NOT_FETCHED)
  const [topFarms, setTopFarms] = useState<FarmWithStakedValue[]>([null, null, null, null, null])
  const anpanPriceBusd = usePriceAnpanBusd()

  useEffect(() => {
    const fetchFarmData = async () => {
      setFetchStatus(FetchStatus.FETCHING)
      const activeFarms = nonArchivedFarms.filter((farm) => farm.pid !== 0 && farm.multiplier !== '0X')
      try {
        await dispatch(fetchFarmsPublicDataAsync(activeFarms.map((farm) => farm.pid)))
        setFetchStatus(FetchStatus.SUCCESS)
      } catch (e) {
        console.error(e)
        setFetchStatus(FetchStatus.FAILED)
      }
    }

    if (isIntersecting && fetchStatus === FetchStatus.NOT_FETCHED) {
      fetchFarmData()
    }
  }, [dispatch, setFetchStatus, fetchStatus, topFarms, isIntersecting])

  useEffect(() => {
    const getTopFarmsByApr = (farmsState: Farm[]) => {
      const farmsWithPrices = farmsState.filter((farm) => farm.lpTotalInQuoteToken && farm.quoteToken.busdPrice)
      const farmsWithApr: FarmWithStakedValue[] = farmsWithPrices.map((farm) => {
        const totalLiquidity = new BigNumber(farm.lpTotalInQuoteToken).times(farm.quoteToken.busdPrice)
        const { anpanRewardsApr, lpRewardsApr } = getFarmApr(
          new BigNumber(farm.poolWeight),
          anpanPriceBusd,
          totalLiquidity,
          farm.lpAddresses[ChainId.MAINNET],
        )
        return { ...farm, apr: anpanRewardsApr, lpRewardsApr }
      })

      const sortedByApr = orderBy(farmsWithApr, (farm) => farm.apr + farm.lpRewardsApr, 'desc')
      setTopFarms(sortedByApr.slice(0, 5))
    }

    if (fetchStatus === FetchStatus.SUCCESS && !topFarms[0]) {
      getTopFarmsByApr(farms)
    }
  }, [setTopFarms, farms, fetchStatus, anpanPriceBusd, topFarms])

  return { topFarms }
}

export default useGetTopFarmsByApr
