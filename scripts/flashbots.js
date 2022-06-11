const { FlashbotsBundleProvider,} = require("@flashbots/ethers-provider-bundle");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

async function main() {
    const fakeNFT = await ethers.getContractFactory("FakeNFT");
    const FakeNFT = await fakeNFT.deploy();
    await FakeNFT.deployed();

    // Address of Fake NFT Contract: 0x48741987D290BCa5464Aa84eE40bD43866C3Ea14
    console.log("Address of Fake NFT Contract:", FakeNFT.address);

    const provider = new ethers.providers.WebSocketProvider(
        process.env.ALCHEMY_WEBSOCKET_URL,
        "goerli"
    );

    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const flashbotsProvider = await FlashbotsBundleProvider.create(
        provider,
        signer,
        // URL for the flashbots relayer
        "https://relay-goerli.flashbots.net",
        "goerli"
    );

    provider.on("block", async (blockNumber) => {
        console.log("Block Number: ", blockNumber);
        const bundleResponse = await flashbotsProvider.sendBundle(
          [
            {
              transaction: {
                // ChainId for the Goerli network
                chainId: 5,
                // EIP-1559
                type: 2,
                // Value of 1 FakeNFT
                value: ethers.utils.parseEther("0.01"),
                // Address of the FakeNFT
                to: FakeNFT.address,
                // Passes the mint function's function selector in the data field
                data: FakeNFT.interface.getSighash("mint()"),
                // Max. Gas fees one's willing to pay
                maxFeePerGas: BigNumber.from(10).pow(9).mul(3),
                // Max. priority gas fees one's willing to pay
                maxPriorityFeePerGas: BigNumber.from(10).pow(9).mul(2),
              },
              signer: signer,
            },
          ],
          blockNumber + 1
        );

        if ("error" in bundleResponse) {
          console.log(bundleResponse.error.message);
        }
      });
}

main();