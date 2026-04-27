/** @jsxImportSource frog/jsx */
/**
 * Farcaster Frames API route.
 * Live frame and transaction routes are wired to the shared V3 adapter.
 */

import { Button, Frog, TextInput, type FrameContext, type TransactionContext } from 'frog';
import { handle } from 'frog/next';
import { formatEther, isAddress, type Address } from 'viem';
import { getBotBriefing } from '@/lib/automation/briefings';
import {
  getEducationLesson,
  getNextEducationStep,
  getPreviousEducationStep,
} from '@/lib/education/lessons';
import {
  formatMarketDelta,
  formatMarketPercent,
  formatMarketUsd,
  getMarketSnapshot,
} from '@/lib/market/snapshots';
import {
  formatSocialPercent,
  formatSocialUsd,
  getSocialPreview,
} from '@/lib/social/preview';
import {
  assertV3Borrowable,
  assertV3DebtAmount,
  assertV3Withdrawable,
  getOwnedV3Position,
  getServerV3Adapter,
  getV3Adapter,
  parseOptionalTokenId,
  parseV3AmountInput,
  parseV3Recipient,
  toV3SendTransaction,
  v3Config,
} from '@/lib/v3';
import { formatError } from '@/lib/utils/errors';
import type { V3Adapter, V3PositionSummary } from '@/lib/v3';

type PositionActionName = 'withdraw' | 'borrow' | 'repay' | 'burn';

const app = new Frog({
  title: 'CastAlchemy',
  basePath: '/api',
  browserLocation: '/miniapp/v3',
});

function formatFrameAmount(value: bigint): string {
  return Number.parseFloat(formatEther(value)).toFixed(4);
}

function formatHealthFactor(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : 'INF';
}

function shortenAddress(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getFrameAddress(address?: string): Address | null {
  return address && isAddress(address) ? address : null;
}

function getSearchParam(context: FrameContext | TransactionContext, key: string): string | null {
  return new URL(context.req.url).searchParams.get(key);
}

function renderCard(title: string, lines: string[], accent = '#60a5fa') {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        padding: 42,
      }}
    >
      <div
        style={{
          fontSize: 40,
          fontWeight: 700,
          marginBottom: 20,
          color: accent,
        }}
      >
        {title}
      </div>
      {lines.map((line, index) => (
        <div
          key={`${title}-${index}`}
          style={{
            fontSize: index === 0 ? 24 : 20,
            lineHeight: 1.35,
            marginBottom: 10,
            color: index === 0 ? '#ffffff' : '#b6bcc8',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

function getTrendAccent(symbol: 'alUSD' | 'alETH') {
  return symbol === 'alUSD' ? '#4ade80' : '#60a5fa';
}

function getBriefingAccent(severity: 'info' | 'watch' | 'critical' | 'success') {
  switch (severity) {
    case 'watch':
      return '#fbbf24';
    case 'critical':
      return '#f87171';
    case 'success':
      return '#4ade80';
    case 'info':
    default:
      return '#60a5fa';
  }
}

function getLessonActionTarget(label: string) {
  switch (label) {
    case 'Open Positions':
      return '/frames/dashboard';
    case 'Review Borrow':
      return '/frames/dashboard';
    case 'Review Deposit':
    default:
      return '/frames/deposit';
  }
}

function getBriefingActionTarget(label: string) {
  switch (label) {
    case 'Open Learning Path':
      return '/frames/learn';
    case 'Open Positions':
      return '/frames/dashboard';
    case 'Review Borrow':
      return '/frames/dashboard';
    case 'Open Analytics':
    default:
      return '/frames/analytics';
  }
}

function renderDisabledFrame(message: string) {
  return {
    image: renderCard('V3 Disabled', [
      message,
      'Enable NEXT_PUBLIC_ENABLE_ALCHEMIX_V3 before using V3 frames.',
    ], '#f59e0b'),
    intents: [
      <Button key="home" action="/frames">
        Home
      </Button>,
      <Button.Redirect key="miniapp" location="/miniapp/v3">
        Mini App
      </Button.Redirect>,
    ],
  };
}

function renderMissingWalletFrame(message: string) {
  return {
    image: renderCard('Wallet Needed', [
      message,
      'Use a Farcaster client with transaction frames or open the mini app.',
    ], '#f59e0b'),
    intents: [
      <Button key="deposit" action="/frames/deposit">
        Deposit
      </Button>,
      <Button.Redirect key="miniapp" location="/miniapp/v3">
        Mini App
      </Button.Redirect>,
    ],
  };
}

function getSelectedPosition(
  positions: V3PositionSummary[],
  tokenIdValue: string | null,
): { position: V3PositionSummary; nextPosition: V3PositionSummary | null; index: number } {
  const requestedTokenId = parseOptionalTokenId(tokenIdValue, 'Position');
  const fallback = positions[0];
  const position =
    requestedTokenId === undefined
      ? fallback
      : positions.find((item) => item.tokenId === requestedTokenId) ?? fallback;
  const index = positions.findIndex((item) => item.tokenId === position.tokenId);
  const nextPosition = positions.length > 1 ? positions[(index + 1) % positions.length] : null;

  return { position, nextPosition, index };
}

function getPositionActionConfig(action: PositionActionName) {
  switch (action) {
    case 'withdraw':
      return {
        title: 'Withdraw',
        accent: '#f59e0b',
        buttonLabel: 'Withdraw',
        limitLine: (position: V3PositionSummary) =>
          `Max withdrawable: ${formatFrameAmount(position.maxWithdrawable)}`,
        validate: (position: V3PositionSummary, amount: bigint) => assertV3Withdrawable(position, amount),
        prepare: (adapter: V3Adapter, position: V3PositionSummary, amount: bigint, wallet: Address) =>
          adapter.prepareWithdraw({
            tokenId: position.tokenId,
            amount,
            recipient: wallet,
          }),
        reviewLine: (amount: bigint) => `Withdraw: ${formatFrameAmount(amount)} ETH`,
        successLine: 'Your withdraw transaction was sent.',
      };
    case 'borrow':
      return {
        title: 'Borrow',
        accent: '#22c55e',
        buttonLabel: 'Borrow',
        limitLine: (position: V3PositionSummary) =>
          `Available credit: ${formatFrameAmount(position.availableCredit)} ETH`,
        validate: (position: V3PositionSummary, amount: bigint) => assertV3Borrowable(position, amount),
        prepare: (adapter: V3Adapter, position: V3PositionSummary, amount: bigint, wallet: Address) =>
          adapter.prepareMint({
            tokenId: position.tokenId,
            amount,
            recipient: wallet,
          }),
        reviewLine: (amount: bigint) => `Borrow: ${formatFrameAmount(amount)} ETH`,
        successLine: 'Your borrow transaction was sent.',
      };
    case 'repay':
      return {
        title: 'Repay',
        accent: '#38bdf8',
        buttonLabel: 'Repay',
        limitLine: (position: V3PositionSummary) => `Current debt: ${formatFrameAmount(position.debt)} ETH`,
        validate: (position: V3PositionSummary, amount: bigint) => assertV3DebtAmount(position, amount, 'repay'),
        prepare: (adapter: V3Adapter, position: V3PositionSummary, amount: bigint, _wallet: Address) =>
          adapter.prepareRepay({
            amount,
            recipientTokenId: position.tokenId,
          }),
        reviewLine: (amount: bigint) => `Repay: ${formatFrameAmount(amount)} ETH`,
        successLine: 'Your repay transaction was sent.',
      };
    case 'burn':
      return {
        title: 'Burn',
        accent: '#a855f7',
        buttonLabel: 'Burn',
        limitLine: (position: V3PositionSummary) => `Current debt: ${formatFrameAmount(position.debt)} ETH`,
        validate: (position: V3PositionSummary, amount: bigint) => assertV3DebtAmount(position, amount, 'burn'),
        prepare: (adapter: V3Adapter, position: V3PositionSummary, amount: bigint, _wallet: Address) =>
          adapter.prepareBurn({
            amount,
            recipientTokenId: position.tokenId,
          }),
        reviewLine: (amount: bigint) => `Burn: ${formatFrameAmount(amount)} ETH`,
        successLine: 'Your burn transaction was sent.',
      };
  }
}

async function renderPositionActionFrame(c: FrameContext, action: PositionActionName) {
  if (!v3Config.enabled) {
    return c.res(renderDisabledFrame('The V3 feature flag is off.'));
  }

  const viewerAddress = getFrameAddress(c.frameData?.address);

  if (!viewerAddress) {
    return c.res(renderMissingWalletFrame('This frame client did not provide a wallet address yet.'));
  }

  try {
    const tokenIdParam = getSearchParam(c, 'tokenId');
    const position = await getOwnedV3Position(viewerAddress, tokenIdParam);
    const config = getPositionActionConfig(action);
    const backTarget = `/frames/position?tokenId=${position.tokenId.toString()}`;

    if (c.transactionId) {
      return c.res({
        image: renderCard(`${config.title} Submitted`, [
          config.successLine,
          `Position: #${position.tokenId.toString()}`,
          `Tx: ${c.transactionId.slice(0, 10)}...${c.transactionId.slice(-6)}`,
        ], config.accent),
        intents: [
          <Button key="back" action={backTarget}>
            Position
          </Button>,
          <Button key="dashboard" action={`/frames/dashboard?tokenId=${position.tokenId.toString()}`}>
            Dashboard
          </Button>,
        ],
      });
    }

    const amountInput = c.inputText?.trim();

    if (!amountInput) {
      return c.res({
        image: renderCard(`${config.title} Position #${position.tokenId.toString()}`, [
          config.limitLine(position),
          `Current debt: ${formatFrameAmount(position.debt)} ETH`,
          'Enter an amount to continue.',
        ], config.accent),
        intents: [
          <TextInput key="amount" placeholder="Amount (example: 0.25)" />,
          <Button key="review">Review</Button>,
          <Button key="back" action={backTarget}>
            Back
          </Button>,
        ],
      });
    }

    const amount = parseV3AmountInput(amountInput, `${config.title} amount`);
    config.validate(position, amount);
    const actionPath = `/frames/position/${action}?tokenId=${position.tokenId.toString()}`;
    const txTarget = `/frames/transactions/${action}?tokenId=${position.tokenId.toString()}&amount=${encodeURIComponent(amountInput)}`;

    return c.res({
      image: renderCard(`Review ${config.title}`, [
        config.reviewLine(amount),
        `Position: #${position.tokenId.toString()}`,
        config.limitLine(position),
      ], config.accent),
      intents: [
        <Button.Transaction key="submit" action={actionPath} target={txTarget}>
          {config.buttonLabel}
        </Button.Transaction>,
        <Button.Reset key="change">Change</Button.Reset>,
        <Button key="back" action={backTarget}>
          Back
        </Button>,
      ],
    });
  } catch (error) {
    return c.res({
      image: renderCard('Action Error', [
        formatError(error),
        'Check the selected position and input amount.',
      ], '#ef4444'),
      intents: [
        <Button key="dashboard" action="/frames/dashboard">
          Dashboard
        </Button>,
        <Button key="deposit" action="/frames/deposit">
          Deposit
        </Button>,
      ],
    });
  }
}

async function handlePositionTransaction(c: TransactionContext, action: PositionActionName) {
  try {
    const wallet = parseV3Recipient(c.address, 'Transaction wallet');
    const tokenIdParam = getSearchParam(c, 'tokenId');
    const amount = parseV3AmountInput(getSearchParam(c, 'amount') ?? c.inputText, `${getPositionActionConfig(action).title} amount`);
    const position = await getOwnedV3Position(wallet, tokenIdParam);
    const config = getPositionActionConfig(action);
    config.validate(position, amount);
    const adapter = getServerV3Adapter();
    const tx = await config.prepare(adapter, position, amount, wallet);

    return c.send(toV3SendTransaction(tx));
  } catch (error) {
    return c.error({
      message: formatError(error),
      statusCode: 400,
    });
  }
}

app.frame('/frames', (c) => {
  const adapter = getV3Adapter();
  const detail = !v3Config.enabled
    ? 'Enable the V3 feature flag to activate this flow.'
    : adapter.mode === 'contracts' && !adapter.isReady()
      ? 'Contract mode needs addresses and an RPC URL.'
      : `Mode: ${adapter.mode}`;

  return c.res({
    image: renderCard('CastAlchemy V3', [
      'Frames now use the shared V3 adapter.',
      detail,
      'Use Deposit, Analytics, Learn, or My Positions to explore the current preview.',
    ]),
    intents: [
      <Button key="deposit" action="/frames/deposit">
        Deposit
      </Button>,
      <Button key="analytics" action="/frames/analytics">
        Analytics
      </Button>,
      <Button key="learn" action="/frames/learn">
        Learn
      </Button>,
      <Button key="positions" action="/frames/dashboard">
        My Positions
      </Button>,
    ],
  });
});

app.frame('/frames/learn', (c) => {
  const lesson = getEducationLesson(getSearchParam(c, 'step'));
  const previousStep = getPreviousEducationStep(lesson.step);
  const nextStep = getNextEducationStep(lesson.step);

  return c.res({
    image: renderCard(`Learn ${lesson.step}/${lesson.totalSteps}`, [
      lesson.title,
      lesson.summary,
      lesson.bullets[0],
      lesson.bullets[1],
      lesson.bullets[2],
    ], '#c084fc'),
    intents: [
      lesson.step > 1 ? (
        <Button key="prev" action={`/frames/learn?step=${previousStep}`}>
          Prev
        </Button>
      ) : (
        <Button key="home" action="/frames">
          Home
        </Button>
      ),
      lesson.step < lesson.totalSteps ? (
        <Button key="next" action={`/frames/learn?step=${nextStep}`}>
          Next
        </Button>
      ) : (
        <Button key="restart" action="/frames/learn?step=1">
          Restart
        </Button>
      ),
      <Button key="action" action={getLessonActionTarget(lesson.actionLabel)}>
        {lesson.actionLabel}
      </Button>,
      <Button.Redirect key="miniapp" location="/miniapp">
        Mini App
      </Button.Redirect>,
    ],
  });
});

app.frame('/frames/analytics', (c) => {
  const market = getMarketSnapshot(getSearchParam(c, 'market'));
  const nextSymbol = market.symbol === 'alUSD' ? 'alETH' : 'alUSD';

  return c.res({
    image: renderCard('Market Analytics', [
      `${market.label} APY: ${formatMarketPercent(market.currentApy)}`,
      `7d: ${formatMarketDelta(market.apyDelta7d)} | 30d: ${formatMarketDelta(market.apyDelta30d)}`,
      `Utilization: ${formatMarketPercent(market.utilization)}`,
      `TVL: ${formatMarketUsd(market.tvlUsd)}`,
      `1 unit projected yearly yield: ${market.projectedAnnualYieldOnOneUnit.toFixed(4)}`,
      market.note,
    ], getTrendAccent(market.symbol)),
    intents: [
      <Button key="switch" action={`/frames/analytics?market=${nextSymbol}`}>
        View {nextSymbol}
      </Button>,
      <Button key="alerts" action="/frames/alerts">
        Alerts
      </Button>,
      <Button key="social" action="/frames/social">
        Social
      </Button>,
      <Button key="positions" action="/frames/dashboard">
        Positions
      </Button>,
    ],
  });
});

app.frame('/frames/social', (c) => {
  const social = getSocialPreview({
    window: getSearchParam(c, 'window'),
    privacyMode: getSearchParam(c, 'privacy'),
    socialComparisonEnabled: getSearchParam(c, 'compare') === 'off' ? false : true,
  });
  const topEntry = social.leaderboard[0];
  const nextWindow = social.window === 'weekly' ? 'monthly' : 'weekly';
  const nextPrivacy = social.privacyMode === 'public' ? 'anonymous' : 'public';
  const nextComparison = social.socialComparisonEnabled ? 'off' : 'on';
  const windowLabel = social.window === 'weekly' ? 'Weekly' : 'Monthly';
  const privacyLabel = social.privacyMode === 'public' ? 'Public' : 'Anonymous';
  const compareLabel = social.socialComparisonEnabled ? 'Visible' : 'Hidden';

  return c.res({
    image: renderCard('Social Preview', [
      `${windowLabel} leaderboard | ${privacyLabel} mode`,
      `#1 ${topEntry.displayName} | ${formatSocialUsd(topEntry.capitalUsd)} | Score ${topEntry.score}`,
      `Referrals: ${social.referral.conversions}/${social.referral.clicks} (${formatSocialPercent(social.referral.conversionRate)})`,
      `Tips: ${social.referral.tipReadyAssets.join(', ')} | Compare: ${compareLabel}`,
      social.note,
    ], '#f472b6'),
    intents: [
      <Button
        key="window"
        action={`/frames/social?window=${nextWindow}&privacy=${social.privacyMode}&compare=${
          social.socialComparisonEnabled ? 'on' : 'off'
        }`}
      >
        {nextWindow === 'weekly' ? 'Weekly' : 'Monthly'}
      </Button>,
      <Button
        key="privacy"
        action={`/frames/social?window=${social.window}&privacy=${nextPrivacy}&compare=${
          social.socialComparisonEnabled ? 'on' : 'off'
        }`}
      >
        {nextPrivacy === 'public' ? 'Public' : 'Anon'}
      </Button>,
      <Button
        key="compare"
        action={`/frames/social?window=${social.window}&privacy=${social.privacyMode}&compare=${nextComparison}`}
      >
        {social.socialComparisonEnabled ? 'Hide Compare' : 'Show Compare'}
      </Button>,
      <Button key="positions" action="/frames/dashboard">
        Positions
      </Button>,
    ],
  });
});

app.frame('/frames/alerts', (c) => {
  const kind = getSearchParam(c, 'kind');
  const healthParam = getSearchParam(c, 'health');
  const progressParam = Number(getSearchParam(c, 'progress') ?? '50');
  const briefing = getBotBriefing(kind, {
    healthState: healthParam === 'watch' || healthParam === 'danger' ? healthParam : 'watch',
    progress: Number.isFinite(progressParam) ? progressParam : 50,
  });

  return c.res({
    image: renderCard(briefing.headline, [
      briefing.summary,
      briefing.lines[0],
      briefing.lines[1],
      briefing.lines[2],
    ], getBriefingAccent(briefing.severity)),
    intents: [
      <Button key="daily" action="/frames/alerts?kind=daily">
        Daily
      </Button>,
      <Button key="health" action="/frames/alerts?kind=health&health=watch">
        Health
      </Button>,
      <Button key="milestone" action="/frames/alerts?kind=milestone&progress=75">
        Milestone
      </Button>,
      <Button key="action" action={getBriefingActionTarget(briefing.cta)}>
        {briefing.cta}
      </Button>,
    ],
  });
});

app.frame('/frames/deposit', (c) => {
  if (!v3Config.enabled) {
    return c.res(renderDisabledFrame('The V3 feature flag is off.'));
  }

  if (c.transactionId) {
    return c.res({
      image: renderCard('Deposit Submitted', [
        'Your V3 deposit transaction was sent.',
        `Tx: ${c.transactionId.slice(0, 10)}...${c.transactionId.slice(-6)}`,
        'Refresh My Positions after confirmation.',
      ], '#4ade80'),
      intents: [
        <Button key="positions" action="/frames/dashboard">
          My Positions
        </Button>,
        <Button key="again" action="/frames/deposit">
          Deposit Again
        </Button>,
      ],
    });
  }

  const amountInput = c.inputText?.trim();

  if (!amountInput) {
    return c.res({
      image: renderCard('V3 Deposit', [
        'Enter an amount to deposit.',
        'This frame prepares a deposit into a new V3 position.',
      ], '#4ade80'),
      intents: [
        <TextInput key="amount" placeholder="Amount (example: 1.0)" />,
        <Button key="review">Review</Button>,
        <Button key="positions" action="/frames/dashboard">
          My Positions
        </Button>,
      ],
    });
  }

  try {
    const amount = parseV3AmountInput(amountInput, 'Deposit amount');
    const viewerAddress = getFrameAddress(c.frameData?.address);
    const depositTarget = `/frames/transactions/deposit?amount=${encodeURIComponent(amountInput)}`;

    return c.res({
      image: renderCard('Review Deposit', [
        `Amount: ${formatFrameAmount(amount)} ETH`,
        viewerAddress
          ? `Wallet: ${shortenAddress(viewerAddress)}`
          : 'Wallet is resolved from the signing transaction.',
        'Recipient: new V3 position',
      ], '#4ade80'),
      intents: [
        <Button.Transaction key="submit" action="/frames/deposit" target={depositTarget}>
          Submit
        </Button.Transaction>,
        <Button.Reset key="change">Change</Button.Reset>,
        <Button key="positions" action="/frames/dashboard">
          My Positions
        </Button>,
      ],
    });
  } catch (error) {
    return c.res({
      image: renderCard('Invalid Amount', [
        formatError(error),
        'Use a positive decimal amount like 1.0.',
      ], '#f97316'),
      intents: [
        <TextInput key="amount" placeholder="Amount (example: 1.0)" />,
        <Button key="retry">Review</Button>,
        <Button key="home" action="/frames">
          Home
        </Button>,
      ],
    });
  }
});

app.frame('/frames/dashboard', async (c) => {
  if (!v3Config.enabled) {
    return c.res(renderDisabledFrame('The V3 feature flag is off.'));
  }

  const viewerAddress = getFrameAddress(c.frameData?.address);

  if (!viewerAddress) {
    return c.res(renderMissingWalletFrame('This frame client did not provide a wallet address yet.'));
  }

  try {
    const adapter = getServerV3Adapter();
    const positions = await adapter.getPositions(viewerAddress);

    if (!positions.length) {
      return c.res({
        image: renderCard('No Positions', [
          `Wallet: ${shortenAddress(viewerAddress)}`,
          'No V3 positions were found for this address.',
        ]),
        intents: [
          <Button key="deposit" action="/frames/deposit">
            Deposit
          </Button>,
          <Button key="refresh" action="/frames/dashboard">
            Refresh
          </Button>,
        ],
      });
    }

    const { position, nextPosition, index } = getSelectedPosition(positions, getSearchParam(c, 'tokenId'));

    return c.res({
      image: renderCard('My Positions', [
        `Wallet: ${shortenAddress(viewerAddress)}`,
        `Viewing #${position.tokenId.toString()} (${index + 1}/${positions.length})`,
        `Collateral: ${formatFrameAmount(position.collateral)}`,
        `Debt: ${formatFrameAmount(position.debt)}`,
        `Available credit: ${formatFrameAmount(position.availableCredit)}`,
        `Health: ${formatHealthFactor(position.healthFactor)} (${position.healthState})`,
      ]),
      intents: [
        <Button key="refresh" action={`/frames/dashboard?tokenId=${position.tokenId.toString()}`}>
          Refresh
        </Button>,
        <Button key="deposit" action="/frames/deposit">
          Deposit
        </Button>,
        <Button key="manage" action={`/frames/position?tokenId=${position.tokenId.toString()}`}>
          Manage
        </Button>,
        nextPosition ? (
          <Button key="next" action={`/frames/dashboard?tokenId=${nextPosition.tokenId.toString()}`}>
            Next
          </Button>
        ) : (
          <Button.Redirect key="miniapp" location="/miniapp/v3">
            Mini App
          </Button.Redirect>
        ),
      ],
    });
  } catch (error) {
    return c.res({
      image: renderCard('Position Error', [
        formatError(error),
        'Check the V3 RPC and contract configuration.',
      ], '#ef4444'),
      intents: [
        <Button key="retry" action="/frames/dashboard">
          Retry
        </Button>,
        <Button key="home" action="/frames">
          Home
        </Button>,
      ],
    });
  }
});

app.frame('/frames/position', async (c) => {
  if (!v3Config.enabled) {
    return c.res(renderDisabledFrame('The V3 feature flag is off.'));
  }

  const viewerAddress = getFrameAddress(c.frameData?.address);

  if (!viewerAddress) {
    return c.res(renderMissingWalletFrame('This frame client did not provide a wallet address yet.'));
  }

  try {
    const position = await getOwnedV3Position(viewerAddress, getSearchParam(c, 'tokenId'));

    return c.res({
      image: renderCard(`Position #${position.tokenId.toString()}`, [
        `Collateral: ${formatFrameAmount(position.collateral)} · Earmarked: ${formatFrameAmount(position.earmarked)}`,
        `Debt: ${formatFrameAmount(position.debt)}`,
        `Credit: ${formatFrameAmount(position.availableCredit)} · Max withdraw: ${formatFrameAmount(position.maxWithdrawable)}`,
        `Health: ${formatHealthFactor(position.healthFactor)} (${position.healthState})`,
      ]),
      intents: [
        <Button key="withdraw" action={`/frames/position/withdraw?tokenId=${position.tokenId.toString()}`}>
          Withdraw
        </Button>,
        <Button key="borrow" action={`/frames/position/borrow?tokenId=${position.tokenId.toString()}`}>
          Borrow
        </Button>,
        <Button key="repay" action={`/frames/position/repay?tokenId=${position.tokenId.toString()}`}>
          Repay
        </Button>,
        <Button key="liquidate" action={`/frames/position/self-liquidate?tokenId=${position.tokenId.toString()}`}>
          Self-Liquidate
        </Button>,
      ],
    });
  } catch (error) {
    return c.res({
      image: renderCard('Position Error', [
        formatError(error),
        'The selected tokenId could not be loaded.',
      ], '#ef4444'),
      intents: [
        <Button key="dashboard" action="/frames/dashboard">
          Dashboard
        </Button>,
        <Button key="deposit" action="/frames/deposit">
          Deposit
        </Button>,
      ],
    });
  }
});

app.frame('/frames/position/withdraw', (c) => renderPositionActionFrame(c, 'withdraw'));
app.frame('/frames/position/borrow', (c) => renderPositionActionFrame(c, 'borrow'));
app.frame('/frames/position/repay', (c) => renderPositionActionFrame(c, 'repay'));
app.frame('/frames/position/burn', (c) => renderPositionActionFrame(c, 'burn'));

app.frame('/frames/position/self-liquidate', async (c) => {
  if (!v3Config.enabled) {
    return c.res(renderDisabledFrame('The V3 feature flag is off.'));
  }

  const viewerAddress = getFrameAddress(c.frameData?.address);

  if (!viewerAddress) {
    return c.res(renderMissingWalletFrame('This frame client did not provide a wallet address yet.'));
  }

  try {
    const position = await getOwnedV3Position(viewerAddress, getSearchParam(c, 'tokenId'));
    const backTarget = `/frames/position?tokenId=${position.tokenId.toString()}`;

    if (c.transactionId) {
      return c.res({
        image: renderCard('Self-Liquidation Submitted', [
          'Your collateral is being used to close debt.',
          `Position: #${position.tokenId.toString()}`,
          `Tx: ${c.transactionId.slice(0, 10)}...${c.transactionId.slice(-6)}`,
        ], '#f97316'),
        intents: [
          <Button key="back" action={backTarget}>
            Position
          </Button>,
          <Button key="dashboard" action="/frames/dashboard">
            Dashboard
          </Button>,
        ],
      });
    }

    if (position.debt === 0n) {
      return c.res({
        image: renderCard('No Debt', [
          `Position #${position.tokenId.toString()} has no debt.`,
          'Self-liquidation requires outstanding debt.',
        ], '#f59e0b'),
        intents: [
          <Button key="back" action={backTarget}>
            Back
          </Button>,
        ],
      });
    }

    const txTarget = `/frames/transactions/self-liquidate?tokenId=${position.tokenId.toString()}`;

    return c.res({
      image: renderCard('Review Self-Liquidation', [
        `Position: #${position.tokenId.toString()}`,
        `Current debt: ${formatFrameAmount(position.debt)}`,
        `Collateral: ${formatFrameAmount(position.collateral)}`,
        'Collateral repays debt. Remainder returns to your wallet.',
      ], '#f97316'),
      intents: [
        <Button.Transaction key="submit" action={`/frames/position/self-liquidate?tokenId=${position.tokenId.toString()}`} target={txTarget}>
          Confirm
        </Button.Transaction>,
        <Button key="back" action={backTarget}>
          Cancel
        </Button>,
      ],
    });
  } catch (error) {
    return c.res({
      image: renderCard('Action Error', [
        formatError(error),
        'Check the selected position.',
      ], '#ef4444'),
      intents: [
        <Button key="dashboard" action="/frames/dashboard">
          Dashboard
        </Button>,
      ],
    });
  }
});

app.transaction('/frames/transactions/deposit', async (c) => {
  try {
    const amount = parseV3AmountInput(getSearchParam(c, 'amount') ?? c.inputText, 'Deposit amount');
    const recipient = parseV3Recipient(c.address, 'Transaction wallet');
    const adapter = getServerV3Adapter();
    const tx = await adapter.prepareDeposit({
      amount,
      recipient,
      recipientId: 0n,
    });

    return c.send(toV3SendTransaction(tx));
  } catch (error) {
    return c.error({
      message: formatError(error),
      statusCode: 400,
    });
  }
});

app.transaction('/frames/transactions/withdraw', (c) => handlePositionTransaction(c, 'withdraw'));
app.transaction('/frames/transactions/borrow', (c) => handlePositionTransaction(c, 'borrow'));
app.transaction('/frames/transactions/repay', (c) => handlePositionTransaction(c, 'repay'));
app.transaction('/frames/transactions/burn', (c) => handlePositionTransaction(c, 'burn'));

app.transaction('/frames/transactions/self-liquidate', async (c) => {
  try {
    const wallet = parseV3Recipient(c.address, 'Transaction wallet');
    const tokenIdParam = getSearchParam(c, 'tokenId');
    const position = await getOwnedV3Position(wallet, tokenIdParam);

    if (position.debt === 0n) {
      return c.error({ message: 'This position has no debt to self-liquidate.', statusCode: 400 });
    }

    const adapter = getServerV3Adapter();
    const tx = await adapter.prepareSelfLiquidate({
      accountId: position.tokenId,
      recipient: wallet,
    });

    return c.send(toV3SendTransaction(tx));
  } catch (error) {
    return c.error({
      message: formatError(error),
      statusCode: 400,
    });
  }
});

export const GET = handle(app);
export const POST = handle(app);
