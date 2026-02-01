# 🗳️ Distributed E-Voting System using Quorum Blockchain

A secure, transparent, and tamper-proof electronic voting system built using a microservices architecture, Quorum blockchain, and a web-based user interface.

This project demonstrates core Distributed Systems concepts including consensus, replication, fault tolerance, and immutability.

---

## 📚 Table of Contents
1. Overview  
2. Motivation  
3. Problem Statement  
4. System Architecture  
5. Components  
6. On-Chain vs Off-Chain  
7. Main User Flows  
8. Technologies Used  
9. Smart Contract Design  
10. Backend Microservices  
11. Database Schema  
12. Frontend  
13. Testing & Distributed Systems Evaluation  
14. How to Run the Project  
15. Future Enhancements  
16. Authors  

---

## 🔍 Overview

This project implements a Distributed E-Voting System designed for secure university elections.

The system guarantees:
- One vote per user (enforced on-chain)
- Tamper-proof vote storage
- Transparent and verifiable results
- Auditor visibility
- Fault tolerance through a multi-node Quorum blockchain network

**High-Level Flow:**

Client UI → Auth & Election Service → Blockchain Gateway → Quorum Blockchain  
                                                             ↓  
                                                     Results & Audit Service  

---

## 🎯 Motivation

Traditional university voting systems rely on centralized servers or paper ballots, making them vulnerable to manipulation, lack of transparency, limited auditability, and single points of failure.

By leveraging Quorum blockchain, this project introduces:
- Distributed trust
- Immutability of votes
- Transparent result verification
- Cryptographic enforcement of voting rules

---

## ❗ Problem Statement

There is no fully secure, verifiable, and distributed digital voting mechanism commonly used for university elections.

Centralized systems require trust in administrators and infrastructure, creating risks such as data tampering, vote manipulation, and loss of audit trails.

**Goal:** Build a voting system where votes cannot be modified, deleted, or hidden — even by system administrators.

---

## 🧩 System Architecture

### Core Components
- Client Web Application
- Auth & Election Service (Node.js + PostgreSQL)
- Blockchain Gateway Service (Node.js + Web3.js)
- Results & Audit Service (Node.js + Web3.js)
- Quorum Blockchain Network (7 nodes, IBFT consensus)
- PostgreSQL Database

---

## 🧱 Components

### 1️⃣ Client Web Application
- User authentication
- Election listing
- Candidate selection
- Vote submission
- Results visualization

### 2️⃣ Service A – Auth & Election Service
- Authenticates users via database
- Loads elections and candidates
- Validates voter eligibility
- Generates a secure hashed voter identity
- Sends voting requests to the Blockchain Gateway

### 3️⃣ Service B – Blockchain Gateway
- Connects to the Quorum network using Web3.js
- Submits votes to the smart contract
- Queries on-chain results
- Handles blockchain RPC communication

### 4️⃣ Service C – Results & Audit Service
- Fetches official results from the blockchain
- Reads block metadata
- Provides audit endpoints for verification

### 5️⃣ Quorum Blockchain Network
- 7 nodes running in Docker
- Istanbul BFT (IBFT) consensus
- Ensures replication, consistency, and fault tolerance

### 6️⃣ PostgreSQL Database
Stores all off-chain data including:
- User accounts and credentials
- Election metadata
- Candidate information
- Voter eligibility lists
- Local vote status

---

## 🔗 On-Chain vs Off-Chain

### On-Chain (Blockchain)
- Election identifiers
- Candidate identifiers and vote counts
- Hashed voter identities (double-vote prevention)
- Final authoritative results

### Off-Chain (Database)
- User identities and authentication data
- Candidate descriptions
- Eligibility lists
- Local voting state

---

## 🔄 Main User Flows

### Login Flow
1. User submits credentials
2. Auth Service verifies credentials
3. JWT token is returned to the client

### Voting Flow
1. User selects an election and candidate
2. Eligibility is verified
3. A hashed voter identity is generated
4. Vote request is sent to the Blockchain Gateway
5. Smart contract `vote()` function is executed
6. Vote is immutably recorded on-chain
7. Local database marks the user as voted

### Results Flow
1. Client requests results
2. Results Service reads blockchain state
3. Live vote tallies are displayed

### Audit Flow
Auditors can retrieve:
- Block hash
- Block height
- On-chain vote counts

---

## 🛠 Technologies Used

### Backend
- Node.js
- Express.js
- Web3.js

### Blockchain
- Quorum Blockchain
- Solidity Smart Contracts
- IBFT Consensus

### Frontend
- HTML
- CSS
- Vanilla JavaScript

### Database
- PostgreSQL

### Infrastructure
- Docker
- Docker Compose

---

## 🧾 Smart Contract Design

- **Contract Name:** `ElectionVoting.sol`
- **Language:** Solidity 0.8.x

### Key Features
- Election creation
- Candidate registration
- Double-vote prevention
- Immutable vote storage
- Result querying

### Core Mappings
```solidity
mapping(uint256 => Election) elections;
mapping(uint256 => mapping(uint256 => Candidate)) candidates;
mapping(uint256 => mapping(bytes32 => bool)) hasVoted;
```

---

## 🖥 Backend Microservices

### Service A – Auth & Elections
- User authentication
- Election and candidate management
- Eligibility verification
- Vote validation

### Service B – Blockchain Gateway
- Vote submission
- Result queries
- Blockchain RPC interaction

### Service C – Results & Audit
- Official result retrieval
- Block metadata access
- Audit endpoints

---

## 🗃 Database Schema

Main tables:
- users
- elections
- candidates
- eligible_voters
- local_vote_status

---

## 🌐 Frontend

Multi-page web interface:
- `index.html` – Login
- `elections.html` – Election selection
- `vote.html` – Vote casting
- `results.html` – Results display

---

## 🧪 Testing & Distributed Systems Evaluation

- **Concurrency Test:** Simultaneous votes result in only one valid on-chain vote
- **Fault Tolerance:** Voting continues when a Quorum node fails
- **Consistency:** Multiple RPC nodes return identical results
- **Performance:** Batch voting tested successfully with multiple users

---

## ▶ How to Run the Project

### 1. Start PostgreSQL
```bash
docker-compose up -d postgres
```

### 2. Start Quorum Blockchain Network
```bash
docker-compose up -d quorum-node1 quorum-node2 quorum-node3 quorum-node4 quorum-node5 quorum-node6 quorum-node7
```

### 3. Install Dependencies
```bash
cd service-auth && npm install
cd ../service-gateway && npm install
cd ../service-results && npm install
```

### 4. Configure Environment Variables

Create a `.env` file for each service containing:
- Database credentials
- RPC URL
- Smart contract address
- JWT secret
- Hashing salt

### 5. Start Services
```bash
npm start
```

### 6. Run Frontend
Open `index.html` in a browser or serve it using a live server.

---

## 🚀 Future Enhancements
- Admin dashboard
- Candidate images
- Anonymous voting using Zero-Knowledge Proofs
- Cloud deployment of Quorum nodes
- Historical election analytics and audit dashboards

---

## 👥 Authors
- Mahmoud Faour  
- Mohammad Faroukh  

Distributed Systems Project  
Antonine University
