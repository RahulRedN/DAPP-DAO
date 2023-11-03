// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

contract DAO is ReentrancyGuard, AccessControl, ERC20Capped {
    address public owner;
    bytes32 private immutable STAKEHOLDER_ROLE = keccak256("STAKEHOLDER");
    uint32 immutable MIN_PROTOCOL_DURATION = 1 weeks;
    uint256 totalProtocols;
    uint256 public daoBalance;

    // GT Token
    uint256 public initialStakeholderTokenAmount = 5000 * 1e18;

    mapping(uint256 => ProtocolStruct) private proposedProtocols;
    mapping(address => uint256[]) private stakeholderVotes;
    mapping(uint256 => VotedStruct[]) private protocolVotes;
    mapping(address => uint256) private stakeholders;

    constructor() ERC20("GovernanceToken", "GT") ERC20Capped(1000000 * 1e18) {
        owner = msg.sender;
    }

    struct ProtocolStruct {
        uint256 id;
        uint256 amount;
        uint256 duration;
        uint256 upvotes;
        uint256 downvotes;
        string title;
        string description;
        bool passed;
        bool paid;
        address payable beneficiary;
        address proposer;
        address executor;
    }

    struct VotedStruct {
        address voter;
        uint256 timestamp;
        bool choosen;
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

    function createProtocol(
        string calldata title,
        string calldata description,
        uint256 amount
    )
        external
        stakeholderOnly("Protocol Creation Allowed for Stakeholders only")
    {
        uint256 protocolId = totalProtocols++;
        ProtocolStruct storage protocol = proposedProtocols[protocolId];

        protocol.id = protocolId;
        protocol.proposer = msg.sender;
        protocol.title = title;
        protocol.description = description;
        protocol.beneficiary = payable(address(this)); // Send the GT tokens to the contract
        protocol.amount = amount;
        protocol.duration = block.timestamp + MIN_PROTOCOL_DURATION;

        // Transfer GT tokens from the proposer to the contract
        _transfer(msg.sender, address(this), amount);

        emit Action(msg.sender, STAKEHOLDER_ROLE, "PROTOCOL CREATED", amount);
    }

    function performVote(
        uint256 protocolId,
        bool choosen,
        uint256 votesToAcquire
    ) external stakeholderOnly("Unauthorized: Stakeholders only") {
        ProtocolStruct storage protocol = proposedProtocols[protocolId];

        handleVoting(protocol);

        uint256 voteCost = 2**votesToAcquire; // Calculate the cost based on the number of votes to acquire

        require(
            balanceOf(msg.sender) >= voteCost,
            "Insufficient tokens to vote"
        );

        if (choosen) protocol.upvotes += votesToAcquire;
        else protocol.downvotes += votesToAcquire;

        stakeholderVotes[msg.sender].push(protocol.id);

        protocolVotes[protocol.id].push(
            VotedStruct(msg.sender, block.timestamp, choosen)
        );

        // Deduct the voting cost from the stakeholder
        transferFrom(msg.sender, address(this), voteCost);

        emit Action(msg.sender, STAKEHOLDER_ROLE, "PROTOCOL VOTE", voteCost);
    }

    function handleVoting(ProtocolStruct storage protocol) private {
        if (protocol.passed || protocol.duration <= block.timestamp) {
            protocol.passed = true;
            revert("Protocol duration expired");
        }

        uint256[] memory tempVotes = stakeholderVotes[msg.sender];
        for (uint256 votes = 0; votes < tempVotes.length; votes++) {
            if (protocol.id == tempVotes[votes])
                revert("Double voting not allowed");
        }
    }

    function executeProposal(uint256 protocolId)
        external
        stakeholderOnly("Unauthorized: Stakeholders only")
        returns (bool)
    {
        ProtocolStruct storage protocol = proposedProtocols[protocolId];

        // Check if the protocol duration has expired
        require(block.timestamp > protocol.duration, "Protocol still ongoing");

        // Check if the protocol has not been paid yet
        require(!protocol.paid, "Payment sent before");

        // Check if the upvotes are greater than or equal to the downvotes
        require(protocol.upvotes >= protocol.downvotes, "Insufficient votes");

        // Execute the proposal
        bool success = payTo(protocol.beneficiary, protocol.amount);

        if (success) {
            protocol.paid = true;
            protocol.executor = msg.sender;
            emit Action(
                msg.sender,
                STAKEHOLDER_ROLE,
                "PROPOSAL EXECUTED",
                protocol.amount
            );
        }

        return success;
    }

    function contribute() external payable {
        if (!hasRole(STAKEHOLDER_ROLE, msg.sender)) {
            uint256 totalContribution = stakeholders[msg.sender] + msg.value;

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

        daoBalance += msg.value;

        emit Action(
            msg.sender,
            STAKEHOLDER_ROLE,
            "CONTRIBUTION RECEIVED",
            msg.value
        );
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

    function payTo(address to, uint256 amount) internal returns (bool) {
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Payment failed");
        return true;
    }
}