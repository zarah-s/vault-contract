import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Vault", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {

    const currentTimestampInSeconds = Math.round(Date.now() / 1000);

    const claimTime = currentTimestampInSeconds + 60;/// ONE MINUTE


    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy();

    return { vault, claimTime, owner, otherAccount };
  }

  describe("Allocate", function () {
    it("Should revert with message if amount is zero", async function () {
      const { vault, claimTime, otherAccount } = await loadFixture(deployOneYearLockFixture);
      await expect(vault.allocate(otherAccount.address, claimTime, { value: ethers.parseEther("0") })).to.be.revertedWith("Cannot send zero amount")
    })

    it("Should check if allocation values are set correctly", async function () {
      const { vault, claimTime, otherAccount, owner } = await loadFixture(deployOneYearLockFixture);
      await (await vault.allocate(otherAccount.address, claimTime, { value: ethers.parseEther("10") })).wait()
      const allocation = await vault.connect(otherAccount).getAllocation(owner.address);
      expect(allocation.amount).to.be.equal(ethers.parseEther("10"));
      expect(allocation.timestamp).to.be.equal(claimTime);
    })


  })


  describe("Allocate", function () {
    it("Should revert with message if user has no allocation", async function () {
      const { vault, claimTime, otherAccount } = await loadFixture(deployOneYearLockFixture);
      await expect(vault.claimAllocation(otherAccount.address,)).to.be.revertedWith("You don't have any allocation")
    })


    it("Should revert with message if allocation time is not reached", async function () {
      const { vault, claimTime, otherAccount, owner } = await loadFixture(deployOneYearLockFixture);
      await (await vault.allocate(otherAccount.address, claimTime, { value: ethers.parseEther("10") })).wait()

      await expect(vault.connect(otherAccount).claimAllocation(owner.address,)).to.be.revertedWith("Not yet")
    })


    it("Should revert if user allocation is zero", async function () {
      const { vault, otherAccount, owner } = await loadFixture(deployOneYearLockFixture);
      await expect(vault.connect(otherAccount).claimAllocation(owner.address,)).to.be.revertedWith("You don't have any allocation")
    })
    it("Should update ethers balance after claim", async function () {
      const { vault, otherAccount, claimTime, owner } = await loadFixture(deployOneYearLockFixture);
      const value = ethers.parseEther("10")
      await (await vault.allocate(otherAccount.address, claimTime, { value })).wait();
      const balanceBeforeClaim = await ethers.provider.getBalance(otherAccount.address);
      await time.increaseTo(claimTime)
      const claimTx = await vault.connect(otherAccount).claimAllocation(owner.address);
      await claimTx.wait();
      const balanceAfterClaim = await ethers.provider.getBalance(otherAccount.address);
      expect(balanceAfterClaim).to.be.greaterThan(balanceBeforeClaim);
    })

    it("Should set allocation to zero after claim", async function () {
      const { vault, otherAccount, claimTime, owner } = await loadFixture(deployOneYearLockFixture);
      await (await vault.allocate(otherAccount.address, claimTime, { value: ethers.parseEther("10") })).wait()
      await time.increaseTo(claimTime)
      await (await vault.connect(otherAccount).claimAllocation(owner.address)).wait();
      const allocation = await vault.connect(otherAccount).getAllocation(owner.address);
      expect(allocation.amount).to.be.equal(ethers.parseEther("0"));
      expect(allocation.timestamp).to.be.equal(0);
    })
  })

});
