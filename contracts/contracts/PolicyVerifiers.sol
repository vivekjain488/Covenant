// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library PolicyVerifiers {
    uint256 internal constant MIN_WINDOW = 1 hours;
    uint256 internal constant MAX_WINDOW = 1 days;

    error EmptyText();
    error InvalidWindow(uint256 windowSeconds);

    function validateText(string memory value) internal pure {
        if (bytes(value).length == 0) {
            revert EmptyText();
        }
    }

    function isValidWindow(uint256 windowSeconds) internal pure returns (bool) {
        return windowSeconds == 0 || (windowSeconds >= MIN_WINDOW && windowSeconds <= MAX_WINDOW);
    }

    function validateWindow(uint256 windowSeconds) internal pure {
        if (!isValidWindow(windowSeconds)) {
            revert InvalidWindow(windowSeconds);
        }
    }
}