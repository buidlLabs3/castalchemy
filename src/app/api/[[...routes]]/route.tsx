/** @jsxImportSource frog/jsx */
/**
 * Farcaster Frames API route.
 * Live frame and transaction routes are wired to the shared V3 adapter.
 */

import { Button, Frog, TextInput, type FrameContext, type TransactionContext } from 'frog';
import { handle } from 'frog/next';
import { formatEther, isAddress, type Address } from 'viem';
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
          `Available collateral: ${formatFrameAmount(position.collateral)} ETH`,
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
      'Use Deposit to build a transaction or My Positions to manage tokenId-based positions.',
    ]),
    intents: [
      <Button key="deposit" action="/frames/deposit">
        Deposit
      </Button>,
      <Button key="positions" action="/frames/dashboard">
        My Positions
      </Button>,
      <Button.Redirect key="miniapp" location="/miniapp/v3">
        Mini App
      </Button.Redirect>,
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
        `Collateral: ${formatFrameAmount(position.collateral)} ETH`,
        `Debt: ${formatFrameAmount(position.debt)} ETH`,
        `Available credit: ${formatFrameAmount(position.availableCredit)} ETH`,
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
        `Collateral: ${formatFrameAmount(position.collateral)} ETH`,
        `Debt: ${formatFrameAmount(position.debt)} ETH`,
        `Available credit: ${formatFrameAmount(position.availableCredit)} ETH`,
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
        <Button key="burn" action={`/frames/position/burn?tokenId=${position.tokenId.toString()}`}>
          Burn
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

export const GET = handle(app);
export const POST = handle(app);
