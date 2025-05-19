import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';
import { Twitter, AlertCircle } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useWhitelist } from '../context/WhitelistContext';
import PixelButton from './ui/PixelButton';

// Rotate through these tweet messages, each including Discord or Twitter handle
const tweetTemplates = [
  "🚀 I just secured my spot on the #Hyperians whitelist! Join our Discord 👉 https://discord.gg/hyperians for info! #NFT #HyperLiquid",
  "🌟 MINT alert! I'm whitelisted to MINT Hyperians Genesis ⚡️ Follow us on Twitter @Hyperian_HL and hop into Discord 👉 https://discord.gg/hyperians",
  "💥 Hyperians has you covered! I'm on the whitelist. Join Discord 👉 https://discord.gg/hyperians or follow @Hyperian_HL to learn more! #NFTDrop",
  "🗣️ Calling all collectors: Hyperians whitelist is live! Join our Discord party 👉 https://discord.gg/hyperians and follow @Hyperian_HL for mint updates 🎁",
  "🔒 Locked in: I'm on the Hyperians whitelist! Ready for on‑chain rewards & free mint—join Discord 👉 https://discord.gg/hyperians or follow @Hyperian_HL now!"
];

const WhitelistChecker: React.FC = () => {
  const { address, isConnected, connectWallet, ensName } = useWeb3();
  const { isWhitelisted, whitelistStatus, loading, checkWhitelist, error } = useWhitelist();

  const [customAddress, setCustomAddress] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [showTweetButton, setShowTweetButton] = useState(false);
  const [checkedAddress, setCheckedAddress] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Animate result, fire confetti, then show Tweet button
  useEffect(() => {
    if (hasChecked && isWhitelisted && resultRef.current) {
      gsap.fromTo(
        resultRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setShowTweetButton(true), 800);
    }
  }, [hasChecked, isWhitelisted]);

  const handleCheck = async () => {
    if (!isConnected && !customAddress) {
      connectWallet();
      return;
    }
    const addr = customAddress || address;
    if (!addr) return;

    setIsChecking(true);
    setHasChecked(false);
    setShowTweetButton(false);
    setCheckedAddress(addr);

    await checkWhitelist(addr);
    setHasChecked(true);
    setIsChecking(false);
  };

  const handleTweet = () => {
    // Randomly pick one tweet template
    const template = tweetTemplates[Math.floor(Math.random() * tweetTemplates.length)];
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(template)}`,
      '_blank'
    );
  };

  const displayName = ensName
    ? ensName
    : checkedAddress
    ? `${checkedAddress.slice(0, 6)}...${checkedAddress.slice(-4)}`
    : '';

  return (
    <div className="pixel-card">
      <h2 className="font-pixel text-lg text-hyper-cyan mb-4">WHITELIST CHECKER</h2>

      {/* Address input for non-connected users */}
      {!isConnected && (
        <div className="mb-4">
          <label className="font-pixel text-xs text-gray-300 block mb-2">
            Enter wallet address to check:
          </label>
          <input
            type="text"
            value={customAddress}
            onChange={e => setCustomAddress(e.target.value)}
            placeholder="0x..."
            className="pixel-input w-full mb-2"
          />
          <div className="text-xs text-gray-400 mb-4">
            Or connect your wallet to check automatically
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 border-2 border-hyper-red">
          <p className="font-pixel text-xs text-hyper-red flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </p>
        </div>
      )}

      {/* Check button */}
      {!isChecking && (!hasChecked || (!isWhitelisted && !loading)) && (
        <PixelButton
          fullWidth
          color={isConnected ? 'cyan' : 'yellow'}
          onClick={handleCheck}
        >
          {isConnected
            ? 'CHECK WHITELIST STATUS'
            : customAddress
            ? 'CHECK WALLET'
            : 'CONNECT WALLET'}
        </PixelButton>
      )}

      {/* Loading spinner */}
      {isChecking && (
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-hyper-cyan border-t-transparent rounded-full animate-spin"></div>
          <p className="font-pixel text-xs text-gray-300 mt-2">
            Checking whitelist...
          </p>
        </div>
      )}

      {/* Success display */}
      {hasChecked && isWhitelisted && !isChecking && (
        <div
          ref={resultRef}
          className={`mt-4 p-4 border-2 text-center ${
            whitelistStatus === 'freemint' || whitelistStatus === 'both'
              ? 'border-hyper-green'
              : 'border-hyper-yellow'
          }`}
        >
          <h3
            className={`font-pixel text-lg mb-2 ${
              whitelistStatus === 'freemint' || whitelistStatus === 'both'
                ? 'text-hyper-green'
                : 'text-hyper-yellow'
            }`}
          >
            {whitelistStatus === 'freemint' || whitelistStatus === 'both'
              ? "YOU'RE ELIGIBLE FOR FREE MINT!"
              : "YOU'RE WHITELISTED!"}
          </h3>
          <p className="font-pixel text-xs text-gray-300 mb-4">
            Congratulations! {displayName} is on the{' '}
            <span
              className={`font-pixel ${
                whitelistStatus === 'freemint' || whitelistStatus === 'both'
                  ? 'text-hyper-green'
                  : 'text-hyper-yellow'
              }`}
            >
              {whitelistStatus === 'both'
                ? 'STANDARD & FREE MINT'
                : whitelistStatus === 'freemint'
                ? 'FREE MINT'
                : 'STANDARD'}
            </span>{' '}
            whitelist.
          </p>

          {/* Tweet button */}
          {showTweetButton && (
            <PixelButton
              color="magenta"
              className="flex items-center justify-center gap-2 mx-auto"
              onClick={handleTweet}
            >
              <Twitter size={14} /> Tweet This
            </PixelButton>
          )}
        </div>
      )}

      {/* Not whitelisted display */}
      {hasChecked && !isWhitelisted && !isChecking && (
        <div
          ref={resultRef}
          className="mt-4 p-4 border-2 border-hyper-red text-center"
        >
          <h3 className="font-pixel text-hyper-red text-lg mb-2">
            NOT WHITELISTED
          </h3>
          <p className="font-pixel text-xs text-gray-300 mb-4 flex items-center justify-center gap-2">
            <AlertCircle size={14} />
            This wallet is not on the whitelist
          </p>
          <div className="text-xs text-gray-400">
            Join our Discord or follow us on Twitter for whitelist opportunities
          </div>
        </div>
      )}
    </div>
  );
};

export default WhitelistChecker;
