🗳️ Distributed E-Voting System using Quorum Blockchain
A secure, transparent, and tamper-proof electronic voting system built using a microservices architecture, Quorum blockchain, and web-based UI.
This project demonstrates key distributed systems concepts, including consensus, replication, fault tolerance, and immutability.
________________________________________
📚 Table of Contents
1.	Overview
2.	Motivation
3.	Problem Statement
4.	System Architecture
5.	Components
6.	On-Chain vs Off-Chain
7.	Main User Flows
8.	Technologies Used
9.	Smart Contract Design
10.	Backend Microservices
11.	Database Schema
12.	Frontend
13.	Testing & DS Evaluation
14.	How to Run the Project
15.	Future Enhancements
16.	Authors
________________________________________
🔍 Overview
This project implements a Distributed E-Voting System designed for secure university elections.
It ensures:
•	One vote per user (enforced on blockchain)
•	Tamper-proof vote storage
•	Transparent results
•	Auditor visibility
•	Fault tolerance via multi-node Quorum network
The project follows a microservices architecture:
Client UI → Service A (Auth) → Service B (Blockchain Gateway) → Quorum Blockchain
                                 ↓
                             Service C (Results & Audit)
________________________________________
🎯 Motivation
Traditional university voting systems rely on centralized servers or paper ballots, which are vulnerable to:
•	Manipulation
•	Lack of transparency
•	Limited auditability
•	Single points of failure
By using Quorum blockchain, we introduce:
•	Transparency
•	Immutability
•	Distributed trust
•	Cryptographic verification
________________________________________
❗ Problem Statement
There is no fully secure, verifiable, and distributed digital voting mechanism for university elections.
Centralized systems rely on trusting one server — creating risks of:
•	Data tampering
•	Administrator abuse
•	Loss of audit trail
💡 Goal: Build a system where votes cannot be modified, deleted, or hidden — even by administrators.
________________________________________
🧩 System Architecture
High-Level Components:
•	Client Web App
•	Auth & Election Service (Node.js + PostgreSQL)
•	Blockchain Gateway Service (Node.js + Web3.js)
•	Results & Audit Service (Node.js + Web3.js)
•	Quorum Blockchain (7 nodes, IBFT consensus)
•	PostgreSQL Database
Architecture Diagram (optional for you to add later)
Client UI
   │
   ▼
Service A (Auth & Election API)
   │
   ▼
Service B (Blockchain Gateway)
   │
   ▼
Quorum Blockchain (7 Nodes)
   │
   ▼
Service C (Results & Audit)
________________________________________
🧱 Components
1️⃣ Client Web App
•	Login
•	Election list
•	Candidate selection
•	Vote submission
•	Results view
2️⃣ Service A – Auth & Election Service
•	Authenticates users via database
•	Loads elections and candidates
•	Validates eligibility
•	Creates secure voterHash
•	Sends vote request to Service B
3️⃣ Service B – Blockchain Gateway
•	Connects to Quorum via Web3.js
•	Submits votes
•	Queries tallies
•	Ensures safe blockchain communication
4️⃣ Service C – Results & Audit Service
•	Fetches results from blockchain
•	Reads chain metadata
•	Used by auditors to verify integrity
5️⃣ Quorum Network
•	7 nodes running in Docker
•	Istanbul BFT consensus
•	Ensures consistency, replication, fault tolerance
6️⃣ PostgreSQL Database
•	Stores all off-chain data
•	Real user identities
•	Election metadata
•	Eligibility lists
•	Local vote status
________________________________________
🔗 On-Chain vs Off-Chain
✔ On-Chain (Blockchain)
•	Election IDs
•	Candidate IDs + vote counts
•	Voter hashed identity (to enforce single vote)
•	Final authoritative results
✔ Off-Chain (Database)
•	User accounts
•	Login credentials
•	Candidate descriptions
•	Eligibility lists
•	Local voting status
________________________________________
🔄 Main User Flows
1. Login
1.	User enters credentials
2.	Service A verifies in DB
3.	Returns JWT token
2. Voting
1.	User selects candidate
2.	Service A validates eligibility
3.	Creates voterHash
4.	Sends to Service B
5.	Service B calls smart contract’s vote()
6.	Vote recorded on-chain
7.	Local DB marks user as “voted”
3. View Results
1.	Client calls Service C
2.	Service C reads results from blockchain
3.	Displays live tallies
4. Audit
Auditor retrieves:
•	Block hash
•	Block height
•	On-chain vote counts
________________________________________
🛠 Technologies Used
Backend
•	Node.js
•	Express.js
•	Web3.js
Blockchain
•	Quorum (7-node IBFT network)
•	Solidity smart contracts
Frontend
•	HTML, CSS, Vanilla JavaScript
Database
•	PostgreSQL
Infrastructure
•	Docker
•	Docker Compose
________________________________________
🧾 Smart Contract Design
Contract Name: ElectionVoting.sol
Language: Solidity 0.8.x
Key Features:
•	Create elections
•	Add candidates
•	Prevent double voting
•	Record votes immutably
•	Return results
Core Mappings:
mapping(uint256 => Election) elections;
mapping(uint256 => mapping(uint256 => Candidate)) candidates;
mapping(uint256 => mapping(bytes32 => bool)) hasVoted;
________________________________________
🖥 Backend Microservices
✔ Service A (Auth & Elections)
Handles:
•	Login
•	Elections
•	Candidates
•	Eligibility
•	Vote validation
✔ Service B (Blockchain Gateway)
Handles:
•	vote()
•	getResults()
•	blockchain RPC connection
✔ Service C (Results & Audit)
Handles:
•	Official results
•	Block info
•	Chain audit routes
________________________________________
🗃 Database Schema
Tables:
•	users
•	elections
•	candidates
•	eligible_voters
•	local_vote_status
________________________________________
🌐 Frontend
Minimal multi-page UI:
•	index.html → login
•	elections.html → pick election
•	vote.html → cast vote
•	results.html → on-chain results
________________________________________
🧪 Testing & DS Evaluation
✔ Concurrency Test
Two votes at same time → one succeeds, one fails.
Proves blockchain-level double-vote protection.
✔ Fault Tolerance
Stopping a Quorum node does not affect voting.
Other nodes continue the chain.
✔ Consistency
RPC 22000 and 22001 return identical results.
✔ Performance Test
Batch votes (10 voters) submitted successfully.
________________________________________
▶ How to Run the Project
1. Start PostgreSQL (Docker)
docker-compose up -d postgres
2. Start Quorum Blockchain
docker-compose up -d quorum-node1 quorum-node2 ... quorum-node7
3. Install dependencies
cd service-auth
npm install

cd ../service-gateway
npm install

cd ../service-results
npm install
4. Add environment variables
Create .env for each service:
•	DB credentials
•	RPC URL
•	CONTRACT_ADDRESS
•	JWT secret
•	SECRET_SALT
5. Start services
npm start
6. Open frontend
Open index.html in browser
(or host it via live server)
________________________________________
🚀 Future Enhancements
•	Add candidate photos
•	Add admin dashboard
•	Anonymous cryptographic voting (Zero Knowledge)
•	Deploy Quorum nodes on cloud
•	Add election history & audit dashboard
________________________________________
👥 Author
•	Mahmoud Faour
•	Mohammad Faroukh
Distributed Systems Project — Antonine University
