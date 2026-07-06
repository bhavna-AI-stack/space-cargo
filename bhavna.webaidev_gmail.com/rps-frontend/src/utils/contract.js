import { ethers } from "ethers";
import abiFile from "../contracts/abi.json";

export const CONTRACT_ADDRESS = "0xF555C1Da60aC81051162098a7389927bb9b2AAdd";

let activeEip1193Provider = null;
let activeBrowserProvider = null;

function getInjectedProvider() {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

function getExpectedChainFromEnv() {
  const raw = Number(import.meta.env.VITE_CHAIN_ID);
  return Number.isInteger(raw) && raw > 0 ? raw : 11155111;
}

export function getExpectedChainId() {
  return getExpectedChainFromEnv();
}

function toChainHex(chainId) {
  return `0x${Number(chainId).toString(16)}`;
}

function setActiveProvider(eip1193Provider) {
  activeEip1193Provider = eip1193Provider;
  activeBrowserProvider = new ethers.BrowserProvider(eip1193Provider);
}

export async function connectWalletProvider() {
  const injected = getInjectedProvider();
  if (!injected) {
    throw new Error("No browser wallet extension found");
  }
  setActiveProvider(injected);
  return activeBrowserProvider;
}

export async function hydrateWalletProvider() {
  if (activeBrowserProvider) return activeBrowserProvider;

  const injected = getInjectedProvider();
  if (!injected) {
    return null;
  }

  setActiveProvider(injected);
  return activeBrowserProvider;
}

export function getWalletEventProvider() {
  return activeEip1193Provider ?? getInjectedProvider();
}

export async function ensureExpectedChain() {
  const provider = getWalletEventProvider();
  if (!provider?.request) return;

  const expectedChainId = getExpectedChainId();
  const expectedHex = toChainHex(expectedChainId).toLowerCase();
  const currentHex = String(
    await provider.request({ method: "eth_chainId" })
  ).toLowerCase();

  if (currentHex === expectedHex) return;

  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: expectedHex }]
  });
}

export async function getContract() {
  const provider = await getProvider();
  const signer = await provider.getSigner();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    abiFile,
    signer
  );
}

export async function getProvider() {
  if (activeBrowserProvider) return activeBrowserProvider;

  const injected = getInjectedProvider();
  if (injected) {
    setActiveProvider(injected);
    return activeBrowserProvider;
  }

  throw new Error("No wallet provider available");
}
