const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { random } = require("underscore")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Unit Tests", function () {
          let randomIpfsNft, deployer, vrfCoordinatorV2Mock, mintFee

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["mocks", "randomipfs"]) // deploys module with the tag "randomIpfsNft"
              randomIpfsNft = await ethers.getContract("RandomIpfsNft") // Returns a new connection to the randomIpfsNft contract
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock") // Returns a new connection to the VRFCoordinatorV2Mock contract
              mintFee = await randomIpfsNft.getMintFee()
          })
          describe("constructor", () => {
              it("sets starting values correctly", async function () {
                  const name = randomIpfsNft.name()
                  const symbol = randomIpfsNft.symbol()
                  const dogTokenUriZero = await randomIpfsNft.getDogTokenUris(0)

                  //   const tokenCounter = randomIpfsNft.getTokenCounter()
                  assert(dogTokenUriZero.includes("ipfs://"))
                  assert(name, "Random IPFS NFT")
                  assert(symbol, "RIN")
                  //   assert(tokenCounter, "0")
              })
          })
          // requestNft
          describe("requestNft", function () {
              it("reverts when you don't pay enough", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      // is reverted when not paid enough or raffle is not open
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })
              it("emits event on NFT request", async () => {
                  await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(
                      // emits NftRequested event if NFT is requested
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
              // fulfillRandomWords
              describe("fulfillRandomWords", function () {
                  it("mints an NFT after random number is returned", async () => {
                      await new Promise(async (resolve, reject) => {
                          randomIpfsNft.once("NftMinted", async () => {
                              try {
                                  const tokenUri = await randomIpfsNft.tokenURI("0")
                                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                                  assert.equal(tokenUri.toString().includes("ipfs://"), true)
                                  assert.equal(tokenCounter.toString(), "1")
                                  resolve()
                              } catch (e) {
                                  console.log(e)
                                  reject(e)
                              }
                          })
                          try {
                              const requestNftResponse = await randomIpfsNft.requestNft({
                                  value: mintFee.toString(),
                              })
                              const requestNftReceipt = await requestNftResponse.wait(1)
                              await vrfCoordinatorV2Mock.fulfillRandomWords(
                                  requestNftReceipt.events[1].args.requestId,
                                  randomIpfsNft.address
                              )
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                  })
              })
              // getBreedFromModdedRng
              describe("getBreedFromModdedRng", () => {
                  it("should return PUG if moddedRng < 10", async () => {
                      const expectedValue = await randomIpfsNft.getBreedFromModdedRng(8)
                      assert.equal(0, expectedValue)
                  })
                  it("should return SHIBA_INU if moddedRng 10 - 39", async () => {
                      const expectedValue = await randomIpfsNft.getBreedFromModdedRng(10)
                      assert.equal(1, expectedValue)
                  })
                  it("should return ST. BERNARD if moddedRng 40 - 99", async () => {
                      const expectedValue = await randomIpfsNft.getBreedFromModdedRng(44)
                      assert.equal(2, expectedValue)
                  })
                  it("should revert if moddedRng > 99", async () => {
                      await expect(randomIpfsNft.getBreedFromModdedRng(100)).to.be.revertedWith(
                          "RandomIpfsNft__RangeOutOfBounds"
                      )
                  })
              })
              // withdraw

              /*describe("Mint NFT", () => {
                  beforeEach(async () => {
                      const txResponse = await randomIpfsNft.mintNft()
                      await txResponse.wait(1)
                  })
                  it("Allows users to mint an NFT, and updates appropriately", async function () {
                      const tokenURI = await randomIpfsNft.tokenURI(0)
                      const tokenCounter = randomIpfsNft.getTokenCounter()

                      assert(tokenURI, await randomIpfsNft.TOKEN_URI())
                      assert(tokenCounter.toString(), "1")
                  })
                  it("Show the correct balance and owner of an NFT", async function () {
                      const deployerAddress = deployer.address
                      const deployerBalance = await randomIpfsNft.balanceOf(deployerAddress)
                      const owner = await randomIpfsNft.ownerOf("1")

                      assert.equal(deployerBalance.toString(), "1")
                      assert.equal(owner, deployerAddress)
                  })
              })*/
          })
      })
