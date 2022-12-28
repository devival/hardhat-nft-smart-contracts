const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic NFT Unit Tests", function () {
          let basicNft, deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["basicnft"]) // deploys module with the tag "basicnft"
              basicNft = await ethers.getContract("BasicNft") // Returns a new connection to the basicNft contract
          })
          describe("Constructor", () => {
              it("Initialises the NFT correctly", async function () {
                  const name = basicNft.name()
                  const symbol = basicNft.symbol()
                  const tokenCounter = basicNft.getTokenCounter()
                  assert(name, "Dogie")
                  assert(symbol, "DOG")
                  assert(tokenCounter, "0")
              })
          })
          // test 02
          describe("Mint NFT", () => {
              beforeEach(async () => {
                  const txResponse = await basicNft.mintNft()
                  await txResponse.wait(1)
              })
              it("Allows users to mint an NFT, and updates appropriately", async function () {
                  const tokenURI = await basicNft.tokenURI(0)
                  const tokenCounter = basicNft.getTokenCounter()

                  assert(tokenURI, await basicNft.TOKEN_URI())
                  assert(tokenCounter.toString(), "1")
              })
              it("Show the correct balance and owner of an NFT", async function () {
                  const deployerAddress = deployer.address
                  const deployerBalance = await basicNft.balanceOf(deployerAddress)
                  const owner = await basicNft.ownerOf("1")

                  assert.equal(deployerBalance.toString(), "1")
                  assert.equal(owner, deployerAddress)
              })
          })
      })
