// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {PolicyVerifiers} from "./PolicyVerifiers.sol";

abstract contract GuardRailReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        require(_status != _ENTERED, "REENTRANCY_BLOCKED");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract GuardRailRegistry is GuardRailReentrancyGuard {
    error InvalidAddress();
    error NotAdmin();
    error NotOperator();
    error PolicyAlreadyExists(bytes32 policyId);
    error PolicyNotFound(bytes32 policyId);
    error PolicyDisabled(bytes32 policyId);
    error InvalidPolicyHierarchy(bytes32 policyId);
    error MissingEffectiveLimit(bytes32 policyId);
    error InvalidAmount();
    error InsufficientBudget(bytes32 policyId, uint256 requested, uint256 remaining);

    struct Policy {
        address owner;
        bytes32 parentId;
        string name;
        string rulesJson;
        uint256 spendingLimitWei;
        uint256 windowSeconds;
        uint256 spentInWindow;
        uint256 windowStartedAt;
        bool enabled;
        uint64 version;
        uint64 createdAt;
        uint64 updatedAt;
    }

    address public immutable admin;
    mapping(address => bool) public operators;
    mapping(bytes32 => Policy) private _policies;

    event OperatorUpdated(address indexed operator, bool allowed);
    event PolicyCreated(bytes32 indexed policyId, address indexed owner, bytes32 indexed parentId, uint256 spendingLimitWei, uint256 windowSeconds);
    event PolicyUpdated(bytes32 indexed policyId, uint64 version, bytes32 indexed parentId, uint256 spendingLimitWei, uint256 windowSeconds, bool enabled);
    event PolicyStateChanged(bytes32 indexed policyId, bool enabled);
    event ExecutionRecorded(bytes32 indexed policyId, address indexed executor, uint256 amountWei, uint256 spentInWindow, uint256 remainingBudget);

    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert NotAdmin();
        }
        _;
    }

    modifier onlyOperator() {
        if (!operators[msg.sender]) {
            revert NotOperator();
        }
        _;
    }

    modifier onlyPolicyOwnerOrAdmin(bytes32 policyId) {
        Policy storage policy = _getPolicy(policyId);
        if (msg.sender != admin && msg.sender != policy.owner) {
            revert NotAdmin();
        }
        _;
    }

    constructor(address initialAdmin) {
        if (initialAdmin == address(0)) {
            revert InvalidAddress();
        }

        admin = initialAdmin;
        operators[initialAdmin] = true;
    }

    function setOperator(address operator, bool allowed) external onlyAdmin nonReentrant {
        if (operator == address(0)) {
            revert InvalidAddress();
        }

        operators[operator] = allowed;
        emit OperatorUpdated(operator, allowed);
    }

    function createPolicy(
        bytes32 policyId,
        address owner,
        string calldata name,
        string calldata rulesJson,
        bytes32 parentId,
        uint256 spendingLimitWei,
        uint256 windowSeconds
    ) external onlyOperator nonReentrant {
        _validatePolicyIdentity(policyId, owner, name, rulesJson);
        _validateConfig(parentId, spendingLimitWei, windowSeconds);

        if (_exists(policyId)) {
            revert PolicyAlreadyExists(policyId);
        }

        if (parentId != bytes32(0) && !_exists(parentId)) {
            revert PolicyNotFound(parentId);
        }

        Policy storage policy = _policies[policyId];
        policy.owner = owner;
        policy.parentId = parentId;
        policy.name = name;
        policy.rulesJson = rulesJson;
        policy.spendingLimitWei = spendingLimitWei;
        policy.windowSeconds = windowSeconds;
        policy.enabled = true;
        policy.version = 1;
        policy.createdAt = uint64(block.timestamp);
        policy.updatedAt = uint64(block.timestamp);

        emit PolicyCreated(policyId, owner, parentId, spendingLimitWei, windowSeconds);
    }

    function updatePolicy(
        bytes32 policyId,
        string calldata name,
        string calldata rulesJson,
        bytes32 parentId,
        uint256 spendingLimitWei,
        uint256 windowSeconds,
        bool enabled
    ) external onlyPolicyOwnerOrAdmin(policyId) nonReentrant {
        Policy storage policy = _getPolicy(policyId);
        _validatePolicyIdentity(policyId, policy.owner, name, rulesJson);
        _validateConfig(parentId, spendingLimitWei, windowSeconds);

        if (parentId != bytes32(0) && !_exists(parentId)) {
            revert PolicyNotFound(parentId);
        }

        policy.parentId = parentId;
        policy.name = name;
        policy.rulesJson = rulesJson;
        policy.spendingLimitWei = spendingLimitWei;
        policy.windowSeconds = windowSeconds;
        policy.enabled = enabled;
        policy.version += 1;
        policy.updatedAt = uint64(block.timestamp);

        emit PolicyUpdated(policyId, policy.version, parentId, spendingLimitWei, windowSeconds, enabled);
    }

    function setPolicyEnabled(bytes32 policyId, bool enabled) external onlyPolicyOwnerOrAdmin(policyId) nonReentrant {
        Policy storage policy = _getPolicy(policyId);
        policy.enabled = enabled;
        policy.version += 1;
        policy.updatedAt = uint64(block.timestamp);

        emit PolicyStateChanged(policyId, enabled);
    }

    function recordExecution(bytes32 policyId, uint256 amountWei) external onlyOperator nonReentrant returns (uint256 remainingBudget) {
        if (amountWei == 0) {
            revert InvalidAmount();
        }

        Policy storage policy = _getPolicy(policyId);
        if (!policy.enabled) {
            revert PolicyDisabled(policyId);
        }

        (uint256 effectiveLimit, uint256 effectiveWindow) = _resolveEffectiveConfig(policyId);
        _refreshWindow(policy, effectiveWindow);

        uint256 projectedSpent = policy.spentInWindow + amountWei;
        if (projectedSpent > effectiveLimit) {
            uint256 remaining = effectiveLimit > policy.spentInWindow ? effectiveLimit - policy.spentInWindow : 0;
            revert InsufficientBudget(policyId, amountWei, remaining);
        }

        policy.spentInWindow = projectedSpent;
        policy.updatedAt = uint64(block.timestamp);

        remainingBudget = effectiveLimit - policy.spentInWindow;
        emit ExecutionRecorded(policyId, msg.sender, amountWei, policy.spentInWindow, remainingBudget);
    }

    function canExecute(bytes32 policyId, uint256 amountWei) external view returns (bool allowed, string memory reason, uint256 remainingBudget) {
        Policy storage policy = _getPolicyView(policyId);
        if (!policy.enabled) {
            return (false, "policy-disabled", 0);
        }

        (uint256 effectiveLimit, uint256 effectiveWindow) = _resolveEffectiveConfig(policyId);
        (uint256 currentSpent, ) = _projectWindowState(policy, effectiveWindow);
        remainingBudget = effectiveLimit > currentSpent ? effectiveLimit - currentSpent : 0;

        if (amountWei > remainingBudget) {
            return (false, "limit-exceeded", remainingBudget);
        }

        return (true, "ok", remainingBudget);
    }

    function getPolicy(bytes32 policyId) external view returns (Policy memory) {
        return _getPolicy(policyId);
    }

    function hasPolicy(bytes32 policyId) external view returns (bool) {
        return _exists(policyId);
    }

    function _validatePolicyIdentity(bytes32 policyId, address owner, string calldata name, string calldata rulesJson) internal pure {
        if (policyId == bytes32(0) || owner == address(0)) {
            revert InvalidAddress();
        }

        PolicyVerifiers.validateText(name);
        PolicyVerifiers.validateText(rulesJson);
    }

    function _validateConfig(bytes32 parentId, uint256 spendingLimitWei, uint256 windowSeconds) internal pure {
        if (parentId == bytes32(0)) {
            if (spendingLimitWei == 0) {
                revert MissingEffectiveLimit(bytes32(0));
            }

            if (!PolicyVerifiers.isValidWindow(windowSeconds) || windowSeconds == 0) {
                revert PolicyVerifiers.InvalidWindow(windowSeconds);
            }

            return;
        }

        if (!PolicyVerifiers.isValidWindow(windowSeconds)) {
            revert PolicyVerifiers.InvalidWindow(windowSeconds);
        }
    }

    function _refreshWindow(Policy storage policy, uint256 effectiveWindow) internal {
        if (policy.windowStartedAt == 0 || block.timestamp >= policy.windowStartedAt + effectiveWindow) {
            policy.windowStartedAt = uint64(block.timestamp);
            policy.spentInWindow = 0;
        }
    }

    function _projectWindowState(Policy storage policy, uint256 effectiveWindow) internal view returns (uint256 spent, uint256 windowStartedAt) {
        if (policy.windowStartedAt == 0) {
            return (0, block.timestamp);
        }

        if (block.timestamp >= policy.windowStartedAt + effectiveWindow) {
            return (0, block.timestamp);
        }

        return (policy.spentInWindow, policy.windowStartedAt);
    }

    function _resolveEffectiveConfig(bytes32 policyId) internal view returns (uint256 effectiveLimit, uint256 effectiveWindow) {
        bytes32 currentId = policyId;
        uint256 depth;

        while (currentId != bytes32(0)) {
            Policy storage policy = _getPolicyView(currentId);

            if (effectiveLimit == 0 && policy.spendingLimitWei != 0) {
                effectiveLimit = policy.spendingLimitWei;
            }

            if (effectiveWindow == 0 && policy.windowSeconds != 0) {
                effectiveWindow = policy.windowSeconds;
            }

            currentId = policy.parentId;
            unchecked {
                ++depth;
            }

            if (depth > 8) {
                revert InvalidPolicyHierarchy(policyId);
            }
        }

        if (effectiveLimit == 0) {
            revert MissingEffectiveLimit(policyId);
        }

        if (effectiveWindow == 0) {
            effectiveWindow = 1 hours;
        }
    }

    function _getPolicy(bytes32 policyId) internal view returns (Policy storage policy) {
        policy = _policies[policyId];
        if (policy.createdAt == 0) {
            revert PolicyNotFound(policyId);
        }
    }

    function _getPolicyView(bytes32 policyId) internal view returns (Policy storage policy) {
        policy = _policies[policyId];
        if (policy.createdAt == 0) {
            revert PolicyNotFound(policyId);
        }
    }

    function _exists(bytes32 policyId) internal view returns (bool) {
        return _policies[policyId].createdAt != 0;
    }
}