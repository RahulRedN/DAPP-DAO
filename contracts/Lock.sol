// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

contract DAO is ReentrancyGuard, AccessControl, ERC20Capped {
    bytes32 private immutable STAKEHOLDER_ROLE = keccak256("STAKEHOLDER");
    bytes32 private immutable CONTRIBUTOR_ROLE = keccak256("CONTRIBUTOR");
    uint32 immutable MIN_PROTOCOL_DURATION = 1 weeks;
    uint256 totalProtocols;
    address contractAddress = address(this);

    // GT Token
    uint256 public initialStakeholderTokenAmount = 5000 * 1e18;

    mapping(uint256 => ProtocolStruct) private proposedProtocols;
    mapping(address => uint256[]) private stakeholderVotes;
    mapping(uint256 => VotedStruct[]) private protocolVotes;
    mapping(address => uint256) private stakeholders;

    constructor() ERC20("GovernanceToken", "GT") ERC20Capped(1000000 * 1e18) {
    }

    struct ProtocolStruct {
        uint256 id;
        uint256 duration;
        uint256 upvotes;
        uint256 downvotes;
        string title;
        string description;
        bool passed;
        bool decided;
        address payable beneficiary;
        address proposer;
        address executor;
    }

    struct VotedStruct {
        address voter;
        uint256 timestamp;
        bool choosen;
        uint256 voteCost;
    }

    event Action(
        address indexed initiator,
        bytes32 role,
        string message,
        uint256 amount
    );

    modifier stakeholderOnly(string memory message) {
        require(hasRole(STAKEHOLDER_ROLE, msg.sender), message);
        _;
    }

    function createProtocol(string calldata title, string calldata description)
        external
        stakeholderOnly("Protocol Creation Allowed for Stakeholders only")
    {
        require(
            balanceOf(msg.sender) >= 1 * 1e18,
            "Insuffuicient balnce for protocol proposal"
        );
        uint256 protocolId = totalProtocols++;
        ProtocolStruct storage protocol = proposedProtocols[protocolId];

        protocol.id = protocolId;
        protocol.proposer = msg.sender;
        protocol.title = title;
        protocol.description = description;
        protocol.beneficiary = payable(address(this)); // Send the GT tokens to the contract
        protocol.duration = block.timestamp + MIN_PROTOCOL_DURATION;

        // Transfer GT tokens from the proposer to the contract
        _transfer(msg.sender, address(this), 1 * 1e18);

        emit Action(msg.sender, STAKEHOLDER_ROLE, "PROTOCOL CREATED", 0);
    }

    function performVote(
        uint256 protocolId,
        bool choosen,
        uint256 votesToAcquire
    ) external stakeholderOnly("Unauthorized: Stakeholders only") {
        ProtocolStruct storage protocol = proposedProtocols[protocolId];

        handleVoting(protocol, protocolId);

        uint256 voteCost = 2**votesToAcquire; // Calculate the cost based on the number of votes to acquire

        require(
            balanceOf(msg.sender) >= voteCost*1e18,
            "Insufficient tokens"
        );

        if (choosen) protocol.upvotes += votesToAcquire;
        else protocol.downvotes += votesToAcquire;

        stakeholderVotes[msg.sender].push(protocol.id);

        protocolVotes[protocol.id].push(
            VotedStruct(msg.sender, block.timestamp, choosen, voteCost)
        );

        // Deduct the voting cost from the stakeholder
        _transfer(msg.sender, address(this), voteCost*1e18);

        emit Action(msg.sender, STAKEHOLDER_ROLE, "PROTOCOL VOTE", voteCost);
    }

    function handleVoting(ProtocolStruct storage protocol, uint256 protocolId)
        private
    {
        if (protocol.decided || protocol.duration <= block.timestamp) {
            executeProposal(protocolId);
            revert("Protocol duration expired");
        }

        uint256[] memory tempVotes = stakeholderVotes[msg.sender];
        for (uint256 votes = 0; votes < tempVotes.length; votes++) {
            if (protocol.id == tempVotes[votes])
                revert("Double voting not allowed");
        }
    }

    function executeProposal(uint256 protocolId)
        internal
        stakeholderOnly("Unauthorized: Stakeholders only")
        returns (bool)
    {
        ProtocolStruct storage protocol = proposedProtocols[protocolId];

        require(block.timestamp > protocol.duration, "Protocol still ongoing");

        require(!protocol.decided, "Protocol descion has been made");

        //simple majority
        if (protocol.upvotes > protocol.downvotes) {
            protocol.passed = true;
        } else {
            protocol.passed = false;
        }

        // Execute the proposal
        protocol.decided = true;
        protocol.executor = msg.sender;
        emit Action(msg.sender, STAKEHOLDER_ROLE, "PROPOSAL EXECUTED", 0);
        return true;
    }

    function contribute() external payable {
        if (!hasRole(STAKEHOLDER_ROLE, msg.sender)) {
            uint256 totalContribution = stakeholders[msg.sender] + msg.value;

            _grantRole(CONTRIBUTOR_ROLE, msg.sender);
            if (totalContribution >= 5 ether) {
                stakeholders[msg.sender] = totalContribution;

                // Mint new GT tokens for the stakeholder
                _mint(msg.sender, 5000 * 1e18);
                _grantRole(STAKEHOLDER_ROLE, msg.sender);
            } else {
                stakeholders[msg.sender] += msg.value;
            }
        } else {
            stakeholders[msg.sender] += msg.value;
        }

        if (!hasRole(STAKEHOLDER_ROLE, msg.sender)) {
            emit Action(
                msg.sender,
                CONTRIBUTOR_ROLE,
                "CONTRIBUTION RECEIVED",
                msg.value
            );
        } else {
            emit Action(
                msg.sender,
                STAKEHOLDER_ROLE,
                "CONTRIBUTION RECEIVED",
                msg.value
            );
        }
    }

    function getProtocols()
        external
        view
        returns (ProtocolStruct[] memory protocols)
    {
        protocols = new ProtocolStruct[](totalProtocols);

        for (uint256 i = 0; i < totalProtocols; i++) {
            protocols[i] = proposedProtocols[i];
        }
    }

    function getProtocol(uint256 protocolId)
        external
        view
        returns (ProtocolStruct memory)
    {
        return proposedProtocols[protocolId];
    }

    function getVotesOf(uint256 protocolId)
        external
        view
        returns (VotedStruct[] memory)
    {
        return protocolVotes[protocolId];
    }

    function getStakeholderVotes()
        external
        view
        stakeholderOnly("Unauthorized: not a stakeholder")
        returns (uint256[] memory)
    {
        return stakeholderVotes[msg.sender];
    }

    function getStakeholderTokens()
        external
        view
        stakeholderOnly("Unauthorized: not a stakeholder")
        returns (uint256)
    {
        return balanceOf(msg.sender);
    }
}
