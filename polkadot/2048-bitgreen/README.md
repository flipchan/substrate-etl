# Bitgreen Summary (Monthly)

_Source_: [bitgreen.polkaholic.io](https://bitgreen.polkaholic.io)

*Relay Chain*: polkadot
*Para ID*: 2048



| Month | Start Block | End Block | # Blocks | # Signed Extrinsics (total) | # Active Accounts (avg) | # Addresses with Balances (max) | Issues |
| ----- | ----------- | --------- | -------- | --------------------------- | ----------------------- | ------------------------------- | ------ |
| [2023-06-01 to 2023-06-26](/polkadot/2048-bitgreen/2023-06-30.md) | 925,775 | 1,102,470 | 176,696 | 34 | 7 | 1,284 | -   |   
| [2023-05-01 to 2023-05-31](/polkadot/2048-bitgreen/2023-05-31.md) | 707,367 | 925,774 | 218,408 | 112 | 12 | 1,267 | -   |   
| [2023-04-01 to 2023-04-30](/polkadot/2048-bitgreen/2023-04-30.md) | 495,253 | 707,366 | 212,114 | 200 | 13 | 1,224 | -   |   
| [2023-03-01 to 2023-03-31](/polkadot/2048-bitgreen/2023-03-31.md) | 284,654 | 495,252 | 210,599 | 351 | 13 | 1,019 | -   |   
| [2023-02-01 to 2023-02-28](/polkadot/2048-bitgreen/2023-02-28.md) | 91,749 | 284,653 | 192,905 | 148 | 9 | 782 | -   |   
| [2023-01-17 to 2023-01-31](/polkadot/2048-bitgreen/2023-01-31.md) | 1 | 91,748 | 91,748 | 27 | 1 | 179 | -   |   

## Tables:

* _Blocks_: `bigquery-public-data.crypto_polkadot.blocks2048` (date-partitioned by `block_time`) - [Schema](/schema/balances.json)
* _Extrinsics_: `bigquery-public-data.crypto_polkadot.extrinsics2048` (date-partitioned by `block_time`) - [Schema](/schema/extrinsics.json)
* _Events_: `bigquery-public-data.crypto_polkadot.events2048` (date-partitioned by `block_time`) - [Schema](/schema/events.json)
* _Transfers_: `bigquery-public-data.crypto_polkadot.transfers2048` (date-partitioned by `block_time`) - [Schema](/schema/transfers.json)
* _Balances_: `bigquery-public-data.crypto_polkadot.balances2048` (date-partitioned by `ts`) - [Schema](/schema/balances.json)
* _Active Accounts_: `bigquery-public-data.crypto_polkadot.accountsactive2048` (date-partitioned by `ts`) - [Schema](/schema/accountsactive.json)
* _Passive Accounts_: `bigquery-public-data.crypto_polkadot.accountspassive2048` (date-partitioned by `ts`) - [Schema](/schema/accountspassive.json)
* _New Accounts_: `bigquery-public-data.crypto_polkadot.accountsnew2048` (date-partitioned by `ts`) - [Schema](/schema/accountsnew.json)
* _Reaped Accounts_: `bigquery-public-data.crypto_polkadot.accountsreaped2048` (date-partitioned by `ts`) - [Schema](/schema/accountsreaped.json)
* _Assets_: `bigquery-public-data.crypto_polkadot.assets` (filter on `2048`) - [Schema](/schema/assets.json)
* _XCM Assets_: `bigquery-public-data.crypto_polkadot.xcmassets` (filter on `para_id`) - [Schema](/schema/xcmassets.json)
* _XCM Transfers_: `bigquery-public-data.crypto_polkadot.xcmtransfers` (filter on `origination_para_id` or `destination_para_id`, date-partitioned by `origination_ts`) - [Schema](/schema/xcmtransfers.json)
* _XCM Messages_: `bigquery-public-data.crypto_polkadot.xcm` (filter on `origination_para_id` or `destination_para_id`, date-partitioned by `origination_ts`) - [Schema](/schema/xcm.json)

### # Blocks
```bash
SELECT LAST_DAY( date(block_time)) as monthDT,
  Min(date(block_time)) startBN, max(date(block_time)) endBN, 
 min(number) minBN, max(number) maxBN, 
 count(*) numBlocks, max(number)-min(number)+1-count(*) as numBlocks_missing 
FROM `bigquery-public-data.crypto_polkadot.blocks2048` 
group by monthDT 
order by monthDT desc
```


Report source: [https://cdn.polkaholic.io/substrate-etl/polkadot/2048.json](https://cdn.polkaholic.io/substrate-etl/polkadot/2048.json) | See [Definitions](/DEFINITIONS.md) for details | [Submit Issue](https://github.com/colorfulnotion/substrate-etl/issues)
