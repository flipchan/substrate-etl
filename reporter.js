const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require("path");
const fs = require('fs');

const NL = "\r\n";

function currencyFormat(c, _maximumFractionDigits = 2) {
    try {
        if (c < .01) _maximumFractionDigits = 3;
        if (c < .001) _maximumFractionDigits = 43;
        var formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: _maximumFractionDigits
        });
        return formatter.format(c);
    } catch (e) {
        return '-'
    }
}


module.exports = class Reporter {
    async generateNetworksSummary() {
	let dir = "."
	let url = "https://cdn.polkaholic.io/substrate-etl/polkaholic.json";
        let cmd = `curl --silent -H "Content-Type: application/json" --max-time 10 --connect-timeout 5 ${url}`
        const {
            stdout,
            stderr
        } = await exec(cmd, {
            maxBuffer: 1024 * 64000
        });
	let polkaholic = JSON.parse(stdout);
	let chains = {};
	let o = {};
	let summary = [];
	summary.push(`# substrate-etl Summary (All-time, All Networks)\r\n\r\nSource: [Polkaholic.io](https://polkaholic.io)\r\n\r\n`);
	summary.push(`| Network          | Indexed up until | # Chains Indexed | # Chains Not Indexed | # Blocks Across Network   | # Blocks Missing |`);
	summary.push(`| ---------------- | ---------------- | ---------------- | -------------------- | ------------------------- | ---------------- |`);
	for (const relayChain of Object.keys(polkaholic)) {
            if (o[relayChain] == undefined) {
		o[relayChain] = [];
		o[relayChain].push(`# substrate-etl ${relayChain} Network-wide Summary (All-time)\r\n\r\nSource: [Polkaholic.io](https://polkaholic.io)\r\n\r\n`);
		o[relayChain].push(`| Chain            | Start Date | End Date | End Block | # Missing | # Addresses with Balances | Crawling Status |`);
		o[relayChain].push(`| ---------------- | ---------- | ---------| --------- | --------- | ------------------------- | --------------- |`);
            }
	    let rc = polkaholic[relayChain]
            for ( const r of rc.chains ) {
		let desc = `[${r.chainName} Para ID ${r.paraID}](/${relayChain}/${r.paraID}-${r.id})`
		let startDT = r.startDT ? r.startDT : "";
		let endDT = r.endDT ? r.endDT : "";
		let startBN = r.startBN ? r.startBN.toLocaleString('en-US') : "";
		let endBN = r.endBN ? r.endBN.toLocaleString('en-US').toLocaleString('en-US') : "";
		let numBlocks_total = r.numBlocks_total ? r.numBlocks_total.toLocaleString('en-US') : "";
		let numBlocks_missing = r.numBlocks_missing ? r.numBlocks_missing.toLocaleString('en-US') : "";
		let percent_missing = r.numBlocks_missing > 0 ? "(" + Number(r.numBlocks_missing / r.endBN).toLocaleString(undefined, {
		    style: 'percent',
		    minimumFractionDigits: 2
		}) + ")" : "";
		let numAddresses = r.numAddresses ? r.numAddresses.toLocaleString('en-US') : "";
		o[relayChain].push(`| ${desc} | ${startDT} | ${endDT} | ${endBN} | ${numBlocks_missing} ${percent_missing} | ${numAddresses} | ${r.crawlingStatus} |`)
		r.relayChain = relayChain;
		chains[r.chainID] = r;
	    }
	    let numChains_missing = rc.missing ? rc.missing.length : 0;
	    let numBlocks_total = rc.numBlocks_total ? rc.numBlocks_total.toLocaleString('en-US') : "";
	    let numBlocks_missing = rc.numBlocks_missing ? rc.numBlocks_missing.toLocaleString('en-US') : "";
	    summary.push(`| [${rc.relayChain}](${rc.relayChain}) | ${rc.endDT} | ${rc.numChains} | ${numChains_missing} | ${numBlocks_total} | ${numBlocks_missing} |`);
	    if ( rc.missing ) {
		o[relayChain].push(`\r\n## Missing chains\r\n\r\n`);
		if ( numChains_missing > 0 ) {
		    for (const c of rc.missing) {
			o[relayChain].push(`* *${c.chainName}* Para ID ${c.paraID}; ${c.crawlingStatus}`);
		    }
		} else {
		    o[relayChain].push(`None`);
		}
	    }
	    o[relayChain].push(`\r\nReport source: [${url}](${url}) | See [Definitions](/DEFINITIONS.md) for details`);

	}
	summary.push(`\r\nReport source: [${url}](${url}) | See [Definitions](/DEFINITIONS.md) for details`);

        let fn = path.join(dir, `SUMMARY.md`);
        let f = fs.openSync(fn, 'w', 0o666);
        fs.writeSync(f, summary.join(NL) + NL);
        console.log("generated", fn);

        for (const relayChain of Object.keys(o)) {
            let fn = path.join(dir, relayChain, `README.md`);
            let f = fs.openSync(fn, 'w', 0o666);
            fs.writeSync(f, o[relayChain].join(NL) + NL);
            console.log("generated", fn);
        }

	for (const chainID of Object.keys(chains) ) {
	    try {
		await this.chain_report_summary(chainID, chains[chainID]);
	    } catch (err) {
		console.log(err);
	    }
	}
    }

    async chain_report_summary(chainID, chain) {
	// fetch monthly + daily summary for chainID
        let paraID = chain.paraID;
        let relayChain = chain.relayChain;
        let id = chain.id;
	let chainName = chain.chainName;
        let url = `https://cdn.polkaholic.io/substrate-etl/${relayChain}/${paraID}.json`;
	let cmd = `curl --silent -H "Content-Type: application/json" --max-time 10 --connect-timeout 5 ${url}`
        const {
            stdout,
            stderr
        } = await exec(cmd, {
            maxBuffer: 1024 * 64000
        });
	let chaindata = JSON.parse(stdout);
	// compile monthly summary
        let j = [];
	let docs = [];
        let desc = `# ${chain.chainName} substrate-etl Summary (Monthly)\r\n\r\n_Source_: [${id}.polkaholic.io](https://${id}.polkaholic.io)\r\n\r\n*Relay Chain*: ${relayChain}\r\n*Para ID*: ${paraID}\r\n`;
        if (chain.crawlingStatus) desc += `Status: ${chain.crawlingStatus}`
        desc += `\r\n\r\n`
        j.push(desc);
        j.push(`| Month | Start Block | End Block | # Blocks | # Signed Extrinsics (total) | # Active Accounts (avg) | # Addresses with Balances (max) | Issues |`);
        j.push(`| ----- | ----------- | --------- | -------- | --------------------------- | ----------------------- | ------------------------------- | ------ |`);
        docs = [];
        docs.push(`\r\n## # Blocks\r\n\`\`\`\r\nSELECT LAST_DAY( date(block_time)) as monthDT, Min(date(block_time)) startBN, max(date(block_time)) endBN, min(number) minBN, max(number) maxBN, count(*) numBlocks, max(number)-min(number)+1-count(*) as numBlocks_missing FROM \`substrate-etl.${relayChain}.blocks${paraID}\` group by monthDT order by monthDT desc\r\n\`\`\`\r\n\r\n`);
	let broken = [];

        let prevStartBN = null;
        for (const r of chaindata.monthly) {
            let monthDT = r.monthDT ? r.monthDT : "";
            let startDT = r.startDT ? r.startDT : "";
            let endDT = r.endDT ? r.endDT : "";
            let desc = `${startDT} to ${endDT}`;
            let startBN = r.startBN ? r.startBN.toLocaleString('en-US') : "";
            let endBN = r.endBN ? r.endBN.toLocaleString('en-US') : "";
            let numBlocks_total = r.numBlocks_total ? r.numBlocks_total.toLocaleString('en-US') : "";
            let numBlocks_missing = r.numBlocks_missing ? r.numBlocks_missing.toLocaleString('en-US') : "";
            let percent_missing = r.numBlocks_missing > 0 ? "(" + Number(r.numBlocks_missing / (r.endBN - r.startBN)).toLocaleString(undefined, {
                style: 'percent',
                minimumFractionDigits: 2
            }) + ")" : "";
            // if chain broken, show it
	    if (prevStartBN && (prevStartBN != (r.endBN + 1)) && (prevStartBN > r.endBN)) {
		broken.push(monthDT);
                numBlocks_missing = " **BROKEN**";
            }
	    
            prevStartBN = r.startBN;
            let numSignedExtrinsics = r.numSignedExtrinsics ? r.numSignedExtrinsics.toLocaleString('en-US') : ""
            let numActiveAccounts = r.numActiveAccounts ? r.numActiveAccounts.toLocaleString('en-US') : "";
            let numAddresses = r.numAddresses ? r.numAddresses.toLocaleString('en-US') : "";
            let issues = r.issues ? r.issues : "-";
            let url = `/${relayChain}/${paraID}-${id}/${monthDT}.md`
            j.push(`| [${desc}](${url}) | ${startBN} | ${endBN} | ${numBlocks_total} | ${numSignedExtrinsics} | ${numActiveAccounts} | ${numAddresses} | ${issues} ${numBlocks_missing} ${percent_missing} |   `)
        }
	docs.push(`\r\nReport source: [${url}](${url}) | See [Definitions](/DEFINITIONS.md) for details`);
	let dir = ".";
        j = j.concat(docs);


        let subdir = path.join(dir, relayChain, `${paraID}-${id}`);
        if (!fs.existsSync(subdir)) {
            fs.mkdirSync(subdir, {
                recursive: true
            });
        }
        let fn_chain = path.join(subdir, `README.md`);
        console.log("writing", fn_chain);
        let f = fs.openSync(fn_chain, 'w', 0o666);
        fs.writeSync(f, j.join(NL) + NL);

   

	// compile daily summmary
        prevStartBN = null;
        j = {};
        fn_chain = {};
        for (const r of chaindata.daily) {
            let monthDT = r.monthDT;
            let k = `${monthDT}`;
            if (j[k] == undefined) {
                let subdir = path.join(dir, relayChain, `${paraID}-${id}`);
                if (!fs.existsSync(subdir)) {
                    fs.mkdirSync(subdir, {
                        recursive: true
                    });
                }
                fn_chain[k] = path.join(subdir, `${k}.md`);
                j[k] = [];
                docs[k] = [];
                let desc = `# ${chainName} substrate-etl Summary (Daily)\r\n\r\n_Source_: [${id}.polkaholic.io](https://${id}.polkaholic.io)\r\n\r\n*Relay Chain*: ${relayChain}\r\n*Para ID*: ${paraID}\r\n`;
                if (r.crawlingStatus) desc += `Status: ${r.crawlingStatus}`
                desc += `\r\n\r\n`
                j[k].push(desc);
                j[k].push(`### Daily Summary for Month ending in ${monthDT}\r\n\r\n`);
                j[k].push(`| Date | Start Block | End Block | # Blocks | # Signed Extrinsics (total) | # Active Accounts | # Passive | # New | # Addresses with Balances | # Events | # Transfers | # XCM Transfers In | # XCM Transfers Out | Issues | `);
                j[k].push(`| ---- | ----------- | --------- | -------- | --------------------------- | ----------------- | --------- | ----- | ------------------------- | -------- | ----------- | ------------------ | ------------------- | ------ |`);

                docs[k].push(`\r\n## Substrate-etl Queries:\r\nYou can generate the above summary data using the following queries using the public dataset \`substrate-etl\` in Google BigQuery:\r\n\r\n`);

                docs[k].push(`### Blocks\r\n\`\`\`\r\nSELECT date(block_time) as logDT, MIN(number) startBN, MAX(number) endBN, COUNT(*) numBlocks FROM \`substrate-etl.${relayChain}.blocks${paraID}\`  where LAST_DAY(date(block_time)) = "${monthDT}" group by logDT order by logDT\r\n\`\`\`\r\n\r\n`);
                docs[k].push(`### Signed Extrinsics\r\n\`\`\`\r\nSELECT date(block_time) as logDT, COUNT(*) numSignedExtrinsics FROM \`substrate-etl.${relayChain}.extrinsics${paraID}\`  where signed and LAST_DAY(date(block_time)) = "${monthDT}" group by logDT order by logDT\r\n\`\`\`\r\n\r\n`);
                docs[k].push(`### Active Accounts\r\n\`\`\`\r\nSELECT date(block_time) as logDT, COUNT(*) numActiveAccounts FROM \`substrate-etl.${relayChain}.accountsactive${paraID}\` where LAST_DAY(date(block_time)) = "${monthDT}" group by logDT order by logDT\r\n\`\`\`\r\n\r\n`);
                docs[k].push(`### Passive Accounts\r\n\`\`\`\r\nSELECT date(block_time) as logDT, COUNT(*) numPassiveAccounts FROM \`substrate-etl.${relayChain}.accountspassive${paraID}\` where LAST_DAY(date(block_time)) = "${monthDT}" group by logDT order by logDT\r\n\`\`\`\r\n\r\n`);
                docs[k].push(`### Addresses with Balances:\r\n\`\`\`\r\nSELECT date(ts) as logDT, COUNT(distinct address_pubkey) numAddress FROM \`substrate-etl.polkadot.balances${paraID}\` where LAST_DAY(date(ts)) = "${monthDT}" group by logDT\r\n\`\`\`\r\n\r\n`);
                docs[k].push(`### Events:\r\n\`\`\`\r\nSELECT date(ts) as logDT, COUNT(*) numEvents FROM \`substrate-etl.${relayChain}.events${paraID}\` where LAST_DAY(date(ts)) = "${monthDT}" group by logDT\r\n\`\`\`\r\n\r\n`);
                docs[k].push(`### Transfers:\r\n\`\`\`\r\nSELECT date(ts) as logDT, COUNT(*) numEvents FROM \`substrate-etl.${relayChain}.transfers${paraID}\` where LAST_DAY(date(ts)) = "${monthDT}" group by logDT\r\n\`\`\`\r\n\r\n`);
                docs[k].push(`### XCM Transfers In:\r\n\`\`\`\r\nSELECT date(ts) as logDT, COUNT(*) numXCMTransfersIn FROM \`substrate-etl.${relayChain}.xcmtransfers\` where origination_para_id = ${paraID} and LAST_DAY(date(ts)) = "${monthDT}" group by logDT\r\n\`\`\`\r\n\r\n`);
                docs[k].push(`### XCM Transfers Out:\r\n\`\`\`\r\nSELECT date(ts) as logDT, COUNT(*) numXCMTransfersOut FROM \`substrate-etl.${relayChain}.xcmtransfers\` where destination_para_id = ${paraID} and LAST_DAY(date(ts)) = "${monthDT}" group by logDT\r\n\`\`\`\r\n\r\n`);
		docs[k].push(`\r\nReport source: [${url}](${url}) | See [Definitions](/DEFINITIONS.md) for details`);
            }
            let logDT = r.logDT ? r.logDT : "";
            let startBN = r.startBN ? r.startBN.toLocaleString('en-US') : "";
            let endBN = r.endBN ? r.endBN.toLocaleString('en-US') : "";
            let issues = r.issues ? r.issues : "-";
            let valueTransfersUSD = r.valueTransfersUSD > 0 ? `(${currencyFormat(r.valueTransfersUSD)})` : ""
            let numBlocks = r.numBlocks ? r.numBlocks.toLocaleString('en-US') : "";
            let numBlocks_missing = r.numBlocks_missing ? r.numBlocks_missing.toLocaleString('en-US') : "";
            let percent_missing = r.numBlocks_missing > 0 ? "(" + Number(r.numBlocks_missing / (r.endBN - r.startBN)).toLocaleString(undefined, {
                style: 'percent',
                minimumFractionDigits: 2
            }) + ")" : "";
	    let missing = numBlocks_missing > 0 ? `${numBlocks_missing} missing ${percent_missing}` : "";
            let numSignedExtrinsics = r.numSignedExtrinsics ? r.numSignedExtrinsics.toLocaleString('en-US') : "";
            let numActiveAccounts = r.numActiveAccounts ? r.numActiveAccounts.toLocaleString('en-US') : "";
            let numPassiveAccounts = r.numPassiveAccounts ? r.numPassiveAccounts.toLocaleString('en-US') : "";
            let numNewAccounts = r.numNewAccounts ? r.numNewAccounts.toLocaleString('en-US') : "";
            let numAddresses = r.numAddresses ? r.numAddresses.toLocaleString('en-US') : ""
            let numEvents = r.numEvents ? r.numEvents.toLocaleString('en-US') : "";
            let numTransfers = r.numTransfers ? r.numTransfers.toLocaleString('en-US') : "";
            let numXCMTransfersIn = r.numXCMTransfersIn ? r.numXCMTransfersIn.toLocaleString('en-US') : "";
            let numXCMTransfersOut = r.numXCMTransfersOut ? r.numXCMTransfersOut.toLocaleString('en-US') : "";
            let valXCMTransferIncomingUSD = r.valXCMTransferIncomingUSD > 0 ? `(${currencyFormat(r.valXCMTransferIncomingUSD)})` : ""
            let valXCMTransferOutgoingUSD = r.valXCMTransferOutgoingUSD > 0 ? `(${currencyFormat(r.valXCMTransferOutgoingUSD)})` : ""

            if (prevStartBN && (prevStartBN != (r.endBN + 1)) && (r.endBN < prevStartBN)) {
                broken.push(logDT);
                numBlocks_missing = " **BROKEN**";
            }
            j[k].push(`| ${logDT} | ${startBN} | ${endBN} | ${numBlocks} | ${numSignedExtrinsics} | ${numActiveAccounts} | ${numPassiveAccounts} | ${numNewAccounts} | ${numAddresses} | ${numEvents} | ${numTransfers} ${valueTransfersUSD} | ${numXCMTransfersIn} ${valXCMTransferIncomingUSD} | ${numXCMTransfersOut} ${valXCMTransferOutgoingUSD} | ${missing} |`)
            prevStartBN = r.startBN;
        }
	
        for (const k of Object.keys(j)) {
            j[k] = j[k].concat(docs[k]);
            //console.log("writing", fn_chain[k]);
            let f = fs.openSync(fn_chain[k], 'w', 0o666);
            fs.writeSync(f, j[k].join(NL) + NL);
        }
	if( broken.length > 0 ) {
	    console.log("BROKEN CHAIN", broken);
	}
    }
}
