const { ethers, network } = require("hardhat")
const { random } = require("underscore")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts()

    // basic nft
    const basicNft = await ethers.getContract("BasicNft", deployer)
    const basicMintTx = await basicNft.mintNft()
    await basicMintTx.wait(1)
    console.log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)}`)

    // random ipfs nft
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()

    const randomMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() })
    const randomMintTxReceipt = await randomMintTx.wait(1)

    await new Promise(async (resolve, reject) => {
        setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000) // 5 minute timeout time
        setTimeout(resolve, 30000) // minutes
        randomIpfsNft.once("NftMinted", async function () {
            resolve()
        })
        if (developmentChains.includes(network.name)) {
            const requestId = randomMintTxReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
        }
    })

    console.log(`Random IPFS NFT index 0 has tokenURI: ${await randomIpfsNft.tokenURI(0)}`)

    // dynamic svg nft
    const highValue = ethers.utils.parseEther("4000")
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    const dynamicMintTx = await dynamicSvgNft.mintNft(highValue.toString())
    await dynamicMintTx.wait(1)
    console.log(`Dynamic SVG NFT index 0 has tokenURI: ${await dynamicSvgNft.tokenURI(0)}`)
}

module.exports.tags = ["all", "mint"]
