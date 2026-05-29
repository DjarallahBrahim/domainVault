-- =============================================================================
-- Fake Sales Data for Dashboard Testing
-- =============================================================================
-- Usage:
--   1. Replace 'YOUR_USER_ID' with your Supabase UUID
--      (Supabase Dashboard → Authentication → Users → copy UUID)
--   2. Run in Supabase SQL Editor
-- =============================================================================

DO $$
DECLARE
  uid UUID := 'YOUR_USER_ID';  -- ← REPLACE THIS
  d1 UUID; d2 UUID; d3 UUID; d4 UUID; d5 UUID; d6 UUID; d7 UUID; d8 UUID;
  d9 UUID; d10 UUID; d11 UUID; d12 UUID;
BEGIN

  -- 1. Insert test domains (idempotent — skips if already exist)
  IF NOT EXISTS (SELECT 1 FROM domains WHERE user_id = uid AND domain = 'premium-saas.com') THEN
    INSERT INTO domains (user_id, domain, expiration_date, purchase_price, status, registrar, notes, tags)
    VALUES
      (uid, 'premium-saas.com',         '2027-06-15', 2500,  'active', 'GoDaddy',       'Bought at auction',         ARRAY['saas','premium']),
      (uid, 'crypto-wallet.io',         '2026-12-01', 800,   'active', 'Namecheap',     'Hand-registered',           ARRAY['crypto','wallet']),
      (uid, 'ai-toolkit.dev',           '2027-03-10', 1200,  'active', 'GoDaddy',       'Aftermarket purchase',      ARRAY['ai','dev','toolkit']),
      (uid, 'green-energy.org',         '2026-09-30', 450,   'active', 'Namecheap',     'Non-profit domain',         ARRAY['green','energy']),
      (uid, 'luxury-travel.co',         '2027-01-20', 3000,  'active', 'GoDaddy',       'Premium geo domain',        ARRAY['travel','luxury']),
      (uid, 'defi-exchange.com',        '2027-08-05', 5000,  'active', 'Namecheap',     'Expired auction win',       ARRAY['defi','exchange']),
      (uid, 'metaverse-land.net',       '2026-11-15', 1800,  'active', 'GoDaddy',       'Brandable domain',          ARRAY['metaverse','virtual']),
      (uid, 'health-tech.io',           '2027-04-22', 950,   'active', 'Namecheap',     'Startup domain',            ARRAY['health','tech']),
      (uid, 'quantum-cloud.com',        '2027-09-01', 4200,  'active', 'GoDaddy',       'Enterprise grade',          ARRAY['quantum','cloud']),
      (uid, 'web3-studio.xyz',          '2026-10-10', 650,   'active', 'Namecheap',     'Web3 agency domain',        ARRAY['web3','studio']),
      (uid, 'nft-marketplace.org',      '2027-02-14', 2200,  'active', 'GoDaddy',       'Marketplace domain',        ARRAY['nft','marketplace']),
      (uid, 'cyber-secure.net',         '2027-05-30', 1100,  'active', 'Namecheap',     'Security consulting',       ARRAY['cyber','security']),
      (uid, 'blockchain-ventures.com',  '2027-07-18', 7500,  'active', 'GoDaddy',       'VC portfolio domain',       ARRAY['blockchain','venture']),
      (uid, 'data-analytics.pro',       '2026-08-25', 3200,  'active', 'Namecheap',     'Analytics SaaS',            ARRAY['data','analytics']),
      (uid, 'mobile-games.app',         '2027-11-11', 1500,  'active', 'GoDaddy',       'Mobile gaming studio',      ARRAY['mobile','games']);
  END IF;

  -- 2. Resolve domain IDs
  SELECT id INTO d1  FROM domains WHERE user_id = uid AND domain = 'premium-saas.com';
  SELECT id INTO d2  FROM domains WHERE user_id = uid AND domain = 'crypto-wallet.io';
  SELECT id INTO d3  FROM domains WHERE user_id = uid AND domain = 'ai-toolkit.dev';
  SELECT id INTO d4  FROM domains WHERE user_id = uid AND domain = 'green-energy.org';
  SELECT id INTO d5  FROM domains WHERE user_id = uid AND domain = 'luxury-travel.co';
  SELECT id INTO d6  FROM domains WHERE user_id = uid AND domain = 'defi-exchange.com';
  SELECT id INTO d7  FROM domains WHERE user_id = uid AND domain = 'metaverse-land.net';
  SELECT id INTO d8  FROM domains WHERE user_id = uid AND domain = 'health-tech.io';
  SELECT id INTO d9  FROM domains WHERE user_id = uid AND domain = 'quantum-cloud.com';
  SELECT id INTO d10 FROM domains WHERE user_id = uid AND domain = 'web3-studio.xyz';
  SELECT id INTO d11 FROM domains WHERE user_id = uid AND domain = 'nft-marketplace.org';
  SELECT id INTO d12 FROM domains WHERE user_id = uid AND domain = 'blockchain-ventures.com';

  -- 3. Insert fake sales (idempotent)
  IF NOT EXISTS (SELECT 1 FROM sales WHERE user_id = uid) THEN
    INSERT INTO sales (user_id, domain_id, domain_name, sale_price, sold_at, buyer, platform, notes) VALUES

    -- === 2025 ===
    (uid, d1,  'premium-saas.com',          18500, '2025-01-18', 'TechStartup Inc',    'Sedo',             ''),
    (uid, d3,  'ai-toolkit.dev',            9600,  '2025-02-05', 'AI Ventures LLC',    'Afternic',         ''),
    (uid, d6,  'defi-exchange.com',         32000, '2025-02-22', 'CryptoHedge Fund',   'Dan.com',          'Negotiated over 3 weeks'),
    (uid, d12, 'blockchain-ventures.com',   45000, '2025-03-15', 'BlockFund Capital',  'GoDaddy Auctions',  'Bidding war — highest sale'),
    (uid, d9,  'quantum-cloud.com',         22000, '2025-04-08', 'Enterprise Co',      'Sedo',             ''),
    (uid, d5,  'luxury-travel.co',          15000, '2025-04-20', 'Travel Agency Ltd',  'Direct',           'Direct outreach'),
    (uid, d2,  'crypto-wallet.io',          4500,  '2025-06-01', 'WalletApp GmbH',     'Afternic',         ''),
    (uid, d8,  'health-tech.io',            7200,  '2025-06-10', 'MediStartup Inc',    'Dan.com',          ''),
    (uid, d11, 'nft-marketplace.org',       14000, '2025-06-28', 'NFTHub LLC',         'Sedo',             'Domain + brand assets'),
    (uid, d7,  'metaverse-land.net',        11000, '2025-07-15', 'MetaVerse GmbH',     'Afternic',         'Closed in 3 days'),
    (uid, d4,  'green-energy.org',          3200,  '2025-08-02', 'EcoPower Ltd',       'Flippa',           ''),
    (uid, d10, 'web3-studio.xyz',           2800,  '2025-08-25', 'Web3 Agency',        'Direct',           ''),
    (uid, d1,  'premium-saas.com',          24500, '2025-10-10', 'AcquirerCo',         'Sedo',             'Repeat buyer — second domain'),
    (uid, d6,  'defi-exchange.com',         11000, '2025-11-01', 'DF Capital',         'Dan.com',          ''),
    (uid, d5,  'luxury-travel.co',          9000,  '2025-11-15', 'HolidayCo',          'Afternic',         ''),
    (uid, d9,  'quantum-cloud.com',         16500, '2025-11-30', 'QCorp',              'GoDaddy Auctions', ''),
    (uid, d2,  'crypto-wallet.io',          6200,  '2025-12-20', 'CryptoPay Inc',      'Sedo',             ''),

    -- === 2026 ===
    (uid, d8,  'health-tech.io',            8800,  '2026-01-05', 'HealthAI GmbH',      'Afternic',         ''),
    (uid, d12, 'blockchain-ventures.com',   12000, '2026-01-22', 'ChainFund',          'Dan.com',          ''),
    (uid, d11, 'nft-marketplace.org',       8500,  '2026-02-01', 'NFTrade Inc',        'Sedo',             ''),
    (uid, d7,  'metaverse-land.net',        7500,  '2026-02-12', 'VRChat Ltd',         'Direct',           ''),
    (uid, d4,  'green-energy.org',          5100,  '2026-02-28', 'GreenFuture',        'Flippa',           ''),
    (uid, d10, 'web3-studio.xyz',           4100,  '2026-03-10', 'Web3Dev GmbH',       'Afternic',         ''),
    (uid, d3,  'ai-toolkit.dev',            14000, '2026-04-01', 'AI Co',              'Sedo',             ''),
    (uid, d1,  'premium-saas.com',          16000, '2026-04-20', 'Enterprise UK',      'Sedo',             'UK buyer'),
    (uid, d9,  'quantum-cloud.com',         13500, '2026-05-02', 'QuantumLabs',        'Dan.com',          ''),
    (uid, d6,  'defi-exchange.com',         28000, '2026-05-08', 'DeFi Capital',       'GoDaddy Auctions',  'Highest 2026 sale'),
    (uid, d5,  'luxury-travel.co',          6800,  '2026-05-22', 'TravelML',           'Direct',           '');

  END IF;

  -- 4. Mark sold domains
  UPDATE domains SET status = 'sold'
  WHERE user_id = uid
    AND id IN (d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12);

END $$;

-- =============================================================================
-- Verify
-- =============================================================================
-- SELECT COUNT(*) AS total_sales FROM sales WHERE user_id = 'YOUR_USER_ID';
-- SELECT platform, COUNT(*) FROM sales WHERE user_id = 'YOUR_USER_ID' GROUP BY platform ORDER BY count DESC;
