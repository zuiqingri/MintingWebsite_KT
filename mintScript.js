let account;
let mintIndexForSale = 0;
let maxSaleAmount = 0;
let mintPrice = 0;
let mintStartBlockNumber = 0;
let mintLimitPerBlock = 0;

let blockNumber = 0;
let blockCnt = false;

function cntBlockNumber() {
    if(!blockCnt) {
        setInterval(function(){
            blockNumber+=1;
            document.getElementById("blockNubmer").innerHTML = "Current Block: #" + blockNumber;
        }, 1000);
        blockCnt = true;
    }
}

async function connect() {
    const accounts = await klaytn.enable();
    if (klaytn.networkVersion === 8217) {
        console.log("Mainnet");
    } else if (klaytn.networkVersion === 1001) {
        console.log("Testnet");
    } else {
        alert("ERROR: Klaytn network not connected!");
        return;
    }
    account = accounts[0];
    caver.klay.getBalance(account)
        .then(function (balance) {
            document.getElementById("myWallet").innerHTML = `Wallet address: ${account}`
            document.getElementById("myKlay").innerHTML = `balance: ${caver.utils.fromPeb(balance, "KLAY")} KLAY`
        });
    await check_status();
}

async function check_status() {
    const myContract = new caver.klay.Contract(ABI, CONTRACTADDRESS);
    await myContract.methods.mintingInformation().call()
        .then(function (result) {
            console.log(result);
            mintIndexForSale = result[1];
            mintLimitPerBlock = result[2];
            mintStartBlockNumber = result[4];
            maxSaleAmount = result[5];
            mintPrice = result[6];
            document.getElementById("mintCnt").innerHTML = `${mintIndexForSale - 1} / ${maxSaleAmount}`;
            document.getElementById("mintLimitPerBlock").innerHTML = `Max amount per transaction: ${mintLimitPerBlock}`;
            document.getElementById('amount').max = mintLimitPerBlock;
            document.getElementById("mintStartBlockNumber").innerHTML = `Minting start block: #${mintStartBlockNumber}`;
            document.getElementById("mintPrice").innerHTML = `Minting price: ${caver.utils.fromPeb(mintPrice, "KLAY")} KLAY`;
        })
        .catch(function (error) {
            console.log(error);
        });
    blockNumber = await caver.klay.getBlockNumber();
    document.getElementById("blockNubmer").innerHTML = "Curent block: #" + blockNumber;
    cntBlockNumber();
}

async function publicMint() {
    if (klaytn.networkVersion === 8217) {
        console.log("Mainnet");
    } else if (klaytn.networkVersion === 1001) {
        console.log("Testnet");
    } else {
        alert("ERROR: Klaytn network not connected!");
        return;
    }
    if (!account) {
        alert("ERROR: Please connect your wallet!");
        return;
    }

    const myContract = new caver.klay.Contract(ABI, CONTRACTADDRESS);
    const amount = document.getElementById('amount').value;
    await check_status();
    if (maxSaleAmount + 1 >= mintIndexForSale) {
        alert("All stocks have been exhausted.");
        return;
    } else if (blockNumber <= mintStartBlockNumber) {
        alert("Minting hasn't started yet.");
    }
    const total_value = amount * mintPrice;

    let estmated_gas;

    await myContract.methods.publicMint(amount)
        .estimateGas({
            from: account,
            gas: 6000000,
            value: total_value
        })
        .then(function (gasAmount) {
            estmated_gas = gasAmount;
            console.log("gas :" + estmated_gas);
            myContract.methods.publicMint(amount)
                .send({
                    from: account,
                    gas: estmated_gas,
                    value: total_value
                })
                .on("transactionHash", (txid) => {
                    console.log(txid);
                })
                .once("allEvents", (allEvents) => {
                    console.log(allEvents);
                })
                .once("Transfer", (transferEvent) => {
                    console.log(transferEvent);
                })
                .once("receipt", (receipt) => {
                    alert("Minting success.");
                })
                .on("error", (error) => {
                    alert("Minting failed.");
                    console.log(error);
                });
        })
        .catch(function (error) {
            console.log(error);
            alert("Minting failed.");
        });
}