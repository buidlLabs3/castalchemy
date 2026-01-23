/**
 * Main landing page
 */

export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}
    >
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        ⚗️ CastAlchemy
      </h1>
      <p style={{ fontSize: '1.5rem', color: '#888', marginBottom: '2rem' }}>
        Alchemix on Farcaster
      </p>
      <p style={{ fontSize: '1rem', color: '#666', textAlign: 'center', maxWidth: '600px' }}>
        Self-repaying loans via Frames, Cast Actions, and bots. Connect your wallet and start
        depositing to Alchemix vaults directly from your Farcaster feed.
      </p>
    </main>
  );
}

