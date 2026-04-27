import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BrowserProvider } from "ethers";

const WalletContext = createContext(null);

const DEFAULT_WORKSPACE = {
  profile: {
    nickname: "",
    riskMode: "moderate",
  },
  personalPolicies: [],
  simulationHistory: [],
};

function workspaceKey(address) {
  return `guardrail.workspace.${address.toLowerCase()}`;
}

function readWorkspace(address) {
  if (!address) {
    return DEFAULT_WORKSPACE;
  }

  const raw = window.localStorage.getItem(workspaceKey(address));
  if (!raw) {
    return DEFAULT_WORKSPACE;
  }

  try {
    return {
      ...DEFAULT_WORKSPACE,
      ...JSON.parse(raw),
      profile: {
        ...DEFAULT_WORKSPACE.profile,
        ...(JSON.parse(raw).profile || {}),
      },
    };
  } catch {
    return DEFAULT_WORKSPACE;
  }
}

function writeWorkspace(address, workspace) {
  if (!address) {
    return;
  }

  window.localStorage.setItem(workspaceKey(address), JSON.stringify(workspace));
}

export function WalletProvider({ children }) {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [workspace, setWorkspace] = useState(DEFAULT_WORKSPACE);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const isConnected = Boolean(address);

  const refreshFromProvider = useCallback(async () => {
    if (!window.ethereum) {
      return;
    }

    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_accounts", []);
    const hexChain = await provider.send("eth_chainId", []);

    setChainId(hexChain);

    if (!accounts || accounts.length === 0) {
      setAddress("");
      setWorkspace(DEFAULT_WORKSPACE);
      return;
    }

    const currentAddress = accounts[0];
    setAddress(currentAddress);
    setWorkspace(readWorkspace(currentAddress));
  }, []);

  const connectWallet = useCallback(async () => {
    setError("");

    if (!window.ethereum) {
      setError("No wallet provider found. Install MetaMask or Rabby.");
      return;
    }

    setIsConnecting(true);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const hexChain = await provider.send("eth_chainId", []);

      if (!accounts || accounts.length === 0) {
        throw new Error("Wallet did not return an account.");
      }

      const walletAddress = accounts[0];
      setAddress(walletAddress);
      setChainId(hexChain);
      setWorkspace(readWorkspace(walletAddress));
    } catch (connectError) {
      setError(connectError.message || "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress("");
    setChainId("");
    setWorkspace(DEFAULT_WORKSPACE);
    setError("");
  }, []);

  const updateWorkspace = useCallback((updater) => {
    setWorkspace((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;

      if (address) {
        writeWorkspace(address, next);
      }

      return next;
    });
  }, [address]);

  useEffect(() => {
    refreshFromProvider();
  }, [refreshFromProvider]);

  useEffect(() => {
    if (!window.ethereum) {
      return undefined;
    }

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        setAddress("");
        setWorkspace(DEFAULT_WORKSPACE);
        return;
      }

      const nextAddress = accounts[0];
      setAddress(nextAddress);
      setWorkspace(readWorkspace(nextAddress));
    };

    const handleChainChanged = (nextChainId) => {
      setChainId(nextChainId);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const value = useMemo(
    () => ({
      address,
      chainId,
      workspace,
      isConnected,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet,
      updateWorkspace,
    }),
    [
      address,
      chainId,
      workspace,
      isConnected,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet,
      updateWorkspace,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }

  return context;
}
