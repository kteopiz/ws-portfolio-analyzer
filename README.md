# Wealthsimple Portfolio Analyzer

## Description

A historical portfolio analysis tool that reconstructs Wealthsimple investment holdings and tracks portfolio value over time.

The application imports Wealthsimple holdings and activity CSV files, reconstructs historical positions, and retrieves historical stock prices using Yahoo Finance.

Built with **Node.js, TypeScript, Express, and Yahoo Finance 2**, with a React frontend planned for visualizing portfolio performance.

## Motivation

I am a diehard Wealthsimple user, I have been using it since I was 18 and I love the platform. It has always made it easy for me to build wealth and I am sure other Canadians feel the same.

Something I, and many of my friends like to do is look at my portfolio on a random day and go "ooo nice" or "hmmm red today?" and wonder why, but I slowly started feeling like this was an information problem. I wanted **personalized and specfic information** at a glance: what is **exactly** lifting me up or dragging me down?

I hope that this project answers those questions.

## Limitations

The current scope of this app is covering only the XTSE and Canadian holdings with the ".TO" Yahoo Finance suffix.

All tickers in a portfolio are assumed to be from the XTSE if not they will be excluded.

May support other MICs in the future... certainly possible.

## TODO

- [ ] **CSV Parsing**
  - [ ] Parse and validate holdings (`holdings.csv`)
  - [ ] Parse and validate transaction history (`acts.csv`)
  - [ ] Normalize tickers, dates, and transaction types

- [ ] **Portfolio Reconstruction**
  - [ ] Reconstruct historical holdings by reversing transactions
  - [ ] Generate daily holdings and share quantities
  - [ ] Handle buys, sells, DRIPs, and fractional shares

- [ ] **Historical Market Data**
  - [ ] Integrate Yahoo Finance 2
  - [ ] Fetch historical daily closing prices for all traded securities
  - [ ] Handle missing prices and non-trading days

- [ ] **Daily Valuation**
  - [ ] Calculate daily security values (quantity × closing price)
  - [ ] Aggregate daily invested portfolio value
  - [ ] Expose historical valuation data through Express endpoints

- [ ] **Frontend**
  - [ ] Build a React dashboard
  - [ ] Visualize historical portfolio value
  - [ ] Display top-performing and worst-performing holdings
