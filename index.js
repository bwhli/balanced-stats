const icxApiEndpoint = 'https://ctz.solidwallet.io/api/v3'
const balancedLoansAddress = 'cx66d4d90f5f113eba575bf793570135f9b10cece1'
const balancedDexAddress = 'cxa0af3165c08318e988cb30993b3048335b94af6c'
const balancedRewardsAddress = 'cx10d59e8103ab44635190bd4139dbfd682fa2d07e'
const balnTokenAddress = 'cxf61cd5a45dc9f91c15aa65831a30a90d59a09619'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function gatherResponse(response) {
  return JSON.stringify(await response.json())
}

async function icx_call(contractAddress, method, params) {
  const payload = {
    jsonrpc: '2.0',
    method: 'icx_call',
    id: 1234,
    params: {
      to: contractAddress,
      dataType: 'call',
      data: {
        method: method,
        params: params,
      },
    },
  }
  const init = {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
    method: 'POST',
    body: JSON.stringify(payload),
  }
  const response = await fetch(icxApiEndpoint, init)
  const results = await gatherResponse(response)
  json = JSON.parse(results)
  return json.result
}

async function hexToInt(hex, dec) {
  return parseInt(hex, 16) / 10 ** dec
}

async function getApy(pool) {
  apy = await icx_call(balancedRewardsAddress, 'getAPY', { _name: pool })
  return hexToInt(apy, 16)
}

async function getPriceByName(pool) {
  price = await icx_call(balancedDexAddress, 'getPriceByName', {
    _name: pool,
  })
  return hexToInt(price, 18)
}

async function getPoolStats(poolId) {
  poolStats = await icx_call(balancedDexAddress, 'getPoolStats', {
    _id: poolId,
  })
  if (poolId == '1') {
    return {
      base: await hexToInt(poolStats.quote, 18),
      quote: await hexToInt(poolStats.quote, 18),
    }
  } else {
    return {
      base: await hexToInt(poolStats.base, 18),
      quote: await hexToInt(poolStats.quote, 18),
    }
  }
}

async function getBalnSupply(type) {
  totalBalnSupply = await icx_call(balnTokenAddress, 'totalSupply', {})
  stakedBalnSupply = await icx_call(balnTokenAddress, 'totalStakedBalance', {})
  return {
    totalBalnSupply: await hexToInt(totalBalnSupply, 18),
    stakedBalnSupply: await hexToInt(stakedBalnSupply, 18),
  }
}

async function buildJsonResponse() {
  response = {
    apy: {
      balnBnusdApy: await getApy('BALN/bnUSD'),
      sicxBnusdApy: await getApy('sICX/bnUSD'),
      sicxIcxApy: await getApy('sICX/ICX'),
    },
    balanceToken: await getBalnSupply(),
    market: {
      balnBnusdPrice: await getPriceByName('BALN/bnUSD'),
      sicxBnusdPrice: await getPriceByName('sICX/bnUSD'),
      sicxIcxPrice: await getPriceByName('sICX/ICX'),
    },
    pool: {
      balnBnusdPool: await getPoolStats('3'),
      sicxBnusdPool: await getPoolStats('2'),
      sicxIcxPool: await getPoolStats('1'),
    },
  }
  return response
}

async function handleRequest() {
  response = await buildJsonResponse()

  const init = {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  }

  return new Response(JSON.stringify(response), init)
}
