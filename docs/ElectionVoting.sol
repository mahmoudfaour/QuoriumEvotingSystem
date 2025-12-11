// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ElectionVoting {
    address public owner;

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Election {
        uint256 id;
        string title;
        bool isActive;
        uint256 candidatesCount;
    }

    // electionId => Election
    mapping(uint256 => Election) public elections;

    // electionId => candidateId => Candidate
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;

    // electionId => voterHash => hasVoted
    mapping(uint256 => mapping(bytes32 => bool)) public hasVoted;

    uint256 public electionsCount;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier validElection(uint256 _electionId) {
        require(_electionId > 0 && _electionId <= electionsCount, "Invalid election");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createElection(string memory _title) public onlyOwner returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        electionsCount++;
        elections[electionsCount] = Election({
            id: electionsCount,
            title: _title,
            isActive: true,
            candidatesCount: 0
        });
        return electionsCount;
    }

    function addCandidate(uint256 _electionId, string memory _name)
        public
        onlyOwner
        validElection(_electionId)
    {
        require(bytes(_name).length > 0, "Name required");
        Election storage e = elections[_electionId];
        require(e.isActive, "Election not active");

        e.candidatesCount++;
        uint256 candidateId = e.candidatesCount;

        candidates[_electionId][candidateId] = Candidate({
            id: candidateId,
            name: _name,
            voteCount: 0
        });
    }

    function setElectionStatus(uint256 _electionId, bool _isActive)
        public
        onlyOwner
        validElection(_electionId)
    {
        elections[_electionId].isActive = _isActive;
    }

    // voterHash is computed off-chain from (userId + electionId + secretSalt)
    function vote(
        uint256 _electionId,
        uint256 _candidateId,
        bytes32 _voterHash
    )
        public
        validElection(_electionId)
    {
        Election storage e = elections[_electionId];
        require(e.isActive, "Election is closed");
        require(_candidateId > 0 && _candidateId <= e.candidatesCount, "Invalid candidate");
        require(!hasVoted[_electionId][_voterHash], "Already voted");

        hasVoted[_electionId][_voterHash] = true;
        candidates[_electionId][_candidateId].voteCount += 1;
    }

    function getCandidate(uint256 _electionId, uint256 _candidateId)
        public
        view
        validElection(_electionId)
        returns (uint256, string memory, uint256)
    {
        Candidate storage c = candidates[_electionId][_candidateId];
        return (c.id, c.name, c.voteCount);
    }

    function getResults(uint256 _electionId)
        public
        view
        validElection(_electionId)
        returns (uint256[] memory, string[] memory, uint256[] memory)
    {
        Election storage e = elections[_electionId];
        uint256 count = e.candidatesCount;

        uint256[] memory ids = new uint256[](count);
        string[] memory names = new string[](count);
        uint256[] memory votes = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 cid = i + 1;
            Candidate storage c = candidates[_electionId][cid];
            ids[i] = c.id;
            names[i] = c.name;
            votes[i] = c.voteCount;
        }
        return (ids, names, votes);
    }
}
