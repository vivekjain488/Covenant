const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("GuardRailRegistry", function () {
  async function deployFixture() {
    const [admin, operator, owner, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("GuardRailRegistry");
    const registry = await Registry.deploy(admin.address);
    await registry.waitForDeployment();

    await registry.setOperator(operator.address, true);

    return { registry, admin, operator, owner, other };
  }

  it("creates policies and resolves inherited limits", async function () {
    const { registry, operator, owner } = await loadFixture(deployFixture);

    const parentId = ethers.keccak256(ethers.toUtf8Bytes("parent-policy"));
    const childId = ethers.keccak256(ethers.toUtf8Bytes("child-policy"));

    await registry.connect(operator).createPolicy(
      parentId,
      owner.address,
      "Parent Policy",
      '{"maxSpend":"1000000000000000000","window":"1h"}',
      ethers.ZeroHash,
      ethers.parseEther("1"),
      3600,
    );

    await registry.connect(operator).createPolicy(
      childId,
      owner.address,
      "Child Policy",
      '{"extends":"parent-policy","maxSpend":"inherit"}',
      parentId,
      0,
      0,
    );

    const [allowed, reason, remaining] = await registry.canExecute(childId, ethers.parseEther("0.25"));

    expect(allowed).to.equal(true);
    expect(reason).to.equal("ok");
    expect(remaining).to.equal(ethers.parseEther("1"));
  });

  it("records execution and blocks budget overruns", async function () {
    const { registry, operator, owner } = await loadFixture(deployFixture);

    const policyId = ethers.keccak256(ethers.toUtf8Bytes("limit-policy"));

    await registry.connect(operator).createPolicy(
      policyId,
      owner.address,
      "Spend Cap",
      '{"maxSpend":"500000000000000000","window":"1h"}',
      ethers.ZeroHash,
      ethers.parseEther("0.5"),
      3600,
    );

    await expect(registry.connect(operator).recordExecution(policyId, ethers.parseEther("0.2"))).to.not.be.reverted;
    await expect(registry.connect(operator).recordExecution(policyId, ethers.parseEther("0.2"))).to.not.be.reverted;
    await expect(registry.connect(operator).recordExecution(policyId, ethers.parseEther("0.2")))
      .to.be.revertedWithCustomError(registry, "InsufficientBudget");
  });

  it("resets the rolling window after expiry", async function () {
    const { registry, operator, owner } = await loadFixture(deployFixture);

    const policyId = ethers.keccak256(ethers.toUtf8Bytes("window-policy"));

    await registry.connect(operator).createPolicy(
      policyId,
      owner.address,
      "Window Policy",
      '{"maxSpend":"500000000000000000","window":"1h"}',
      ethers.ZeroHash,
      ethers.parseEther("0.5"),
      3600,
    );

    await registry.connect(operator).recordExecution(policyId, ethers.parseEther("0.4"));
    await time.increase(3601);

    const [allowed] = await registry.canExecute(policyId, ethers.parseEther("0.4"));
    expect(allowed).to.equal(true);

    await expect(registry.connect(operator).recordExecution(policyId, ethers.parseEther("0.4"))).to.not.be.reverted;
  });

  it("restricts admin-only role changes", async function () {
    const { registry, other } = await loadFixture(deployFixture);

    await expect(registry.connect(other).setOperator(other.address, true)).to.be.revertedWithCustomError(registry, "NotAdmin");
  });
});