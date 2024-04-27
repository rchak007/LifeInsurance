// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "usingtellor/contracts/UsingTellor.sol";
import {LifeInsuranceToken} from "./LifeInsuranceToken.sol";

/// @title A very simple lottery contract
/// @author Matheus Pagani
/// @notice You can use this contract for running a very simple lottery
/// @dev This contract implements a relatively weak randomness source, since there is no cliff period between the randao reveal and the actual usage in this contract
/// @custom:teaching This is a contract meant for teaching only
contract LifeInsurance is Ownable, UsingTellor {
    /// @notice Address of the token used as payment for the bets
    LifeInsuranceToken public paymentToken;
    /// @notice Amount of tokens given per ETH paid
    uint256 public purchaseRatio = 1000;
    /// @notice Amount of tokens required for placing a bet that goes for the prize pool

    uint256 public commissionCollectedTotal; 


    struct Policy {
        uint256 coverageAmount;
        uint256 monthlyPremium;
        uint256 dueDate; // UNIX timestamp of next due date
        uint256 lateFee; // Amount added to the premium if it is paid after the due date
        uint256 endDate;
        bool isActive;
    }

    struct PolicyholderInfo {
        uint age;
        bool smoker;
        uint fitnessScore;
    }

    uint256 public constant THRESHOLD = 1 ether;
    
    uint256 public commissionRate = 1; // 1% commission rate    

    mapping(address => Policy) public policies;
    mapping(address => PolicyholderInfo) public policyholders;

    // address public owner;
    // Total amount of commissions accrued per token
    mapping(address => uint256) public pendingWithdrawals;

    // Mapping to track investor token balances
    mapping(address => uint256) public investorTokenBalance;


    /// @notice Constructor function
    /// @param tokenName Name of the token used for payment
    /// @param tokenSymbol Symbol of the token used for payment
    /// @param _purchaseRatio Amount of tokens given per ETH paid
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 _purchaseRatio,
        address payable _tellorAddress // Adding the Tellor address parameter
    )  
    UsingTellor(_tellorAddress) // Pass the Tellor address to the UsingTellor contract
    Ownable(msg.sender) 
    {
        paymentToken = new LifeInsuranceToken(tokenName, tokenSymbol);
        purchaseRatio = _purchaseRatio;
    }

    /// @notice Life Insurance is in business now!
    modifier whenLifeInsuranceIsReady() {
        require(address(this).balance >= THRESHOLD, "Life Insurance is ready for Insurers");
        _;
    }

    function getBtcSpotPrice(uint256 maxTime) internal view returns (uint256) {
        bytes memory _queryData = abi.encode(
            "SpotPrice",
            abi.encode("btc", "usd")
        );
        bytes32 _queryId = keccak256(_queryData);

        (bytes memory _value, uint256 _timestampRetrieved) = getDataBefore(
            _queryId,
            block.timestamp - 20 minutes
        );
        if (_timestampRetrieved == 0) return 0;
        require(
            block.timestamp - _timestampRetrieved < maxTime,
            "Maximum time elapsed"
        );
        return abi.decode(_value, (uint256));
    }

    function createPolicy(address _policyHolder, uint256 _coverageAmount, uint256 _endDate, uint256 _lateFee, uint _age, bool _smoker, uint _fitnessScore) public {
        // require(msg.sender == owner(), "Only owner can create policies"); // Any one can insure themselves
        uint256 premium = calculatePremium(_age, _smoker, _fitnessScore);

        policies[_policyHolder] = Policy({
            coverageAmount: _coverageAmount,
            monthlyPremium: premium,
            dueDate: block.timestamp + 30 days,
            lateFee: _lateFee,
            endDate: _endDate,
            isActive: true
        });

        policyholders[_policyHolder] = PolicyholderInfo({
            age: _age,
            smoker: _smoker,
            fitnessScore: _fitnessScore
        });
    }

    function calculatePremium(uint _age, bool _smoker, uint _fitnessScore) public pure returns (uint256) {
        uint basePremium = 1000000000000000; // Base premium in Wei 10^15
        uint ageFactor = _age < 25 ? 80 : _age < 40 ? 100 : _age < 60 ? 120 : 150;
        uint smokerFactor = _smoker ? 150 : 100;
        uint fitnessFactor = 100 - (_fitnessScore - 1) * 10; // Decrease premium for higher fitness

        return basePremium * ageFactor * smokerFactor * fitnessFactor / 1000000;
    }    

    // function payPremium(address _policyHolder) public payable {
    //     Policy storage policy = policies[_policyHolder];
    //     require(policy.isActive, "Policy is not active");
    //     require(msg.value == policy.monthlyPremium, "Incorrect premium amount");

    //     uint256 commission = msg.value * commissionRate / 100;
    //     uint256 netPremium = msg.value - commission;
    //     accumulateCommission(commission);

    //     policy.dueDate += 30 days;
    // }
    function payPremium(address _policyHolder) public payable {
        Policy storage policy = policies[_policyHolder];
        require(policy.isActive, "Policy is not active");

        // Calculate the number of full 30-day periods that have passed since the due date
        uint256 periodsLate = (block.timestamp - policy.dueDate) / 30 days;
        uint256 totalDue = ( policy.monthlyPremium * periodsLate)  + (policy.lateFee * periodsLate);

        // Require that the payment covers the total due (including all missed premiums and late fees)
        require(msg.value >= totalDue, "Incorrect premium amount including late fees");

        // Calculate commissions based on the total payment
        uint256 commission = msg.value * commissionRate / 100;
        // uint256 netPremium = msg.value - commission;
        commissionCollectedTotal = commissionCollectedTotal +  commission;
        // accumulateCommission(commission);

        // Adjust the due date: advance by the number of missed periods plus one for the current payment
        policy.dueDate += (periodsLate + 1) * 30 days;

        // Any excess payment can be considered as pre-payment or returned to the policyholder (optional)
        if (msg.value > totalDue) {
            uint256 excess = msg.value - totalDue;
            payable(_policyHolder).transfer(excess);  // Refund the excess or handle differently
        }
    }



    // function accumulateCommission(uint256 commission) private {
    //     uint256 totalSupply = paymentToken.totalSupply();
    //     require(totalSupply > 0, "No tokens issued");

    //     // Increment the pending withdrawal balance for each token holder proportionally
    //     uint256 commissionPerToken = commission / totalSupply;
    //     address[] memory holders = getAllTokenHolders(); // Assume this function exists to retrieve all token holders

    //     for (uint256 i = 0; i < holders.length; i++) {
    //         uint256 holderBalance = paymentToken.balanceOf(holders[i]);
    //         pendingWithdrawals[holders[i]] += commissionPerToken * holderBalance;
    //     }
    // }
    // function accumulateCommission(uint256 commission) private {
    //     uint256 totalSupply = paymentToken.totalSupply();
    //     require(totalSupply > 0, "No tokens issued");

    //     // Retrieve all token holders from the LifeInsuranceToken contract
    //     address[] memory holders = paymentToken.getAllTokenHolders(); // Ensure this function is accessible and public

    //     uint256 commissionPerToken = commission / totalSupply;

    //     for (uint256 i = 0; i < holders.length; i++) {
    //         uint256 holderBalance = paymentToken.balanceOf(holders[i]);
    //         if (holderBalance > 0) {
    //             uint256 holderCommission = commissionPerToken * holderBalance;
    //             pendingWithdrawals[holders[i]] += holderCommission;
    //         }
    //     }
    // }

    function claim(address _policyHolder) public {
        Policy storage policy = policies[_policyHolder];
        require(policy.isActive, "Policy is not active");
        require(msg.sender == _policyHolder, "Only policyholder can claim");
        // Additional claim logic here
        // call oracle here - for now btc spot price
        uint  maxTime = 360 * 60 * 24 * 90;
        uint oracleResult = (getBtcSpotPrice(maxTime)) % 2; // for now randomize it
        require(oracleResult == 0, "Can claim only if died");
        // now pay their coverage amount
        payable(msg.sender).transfer(policy.coverageAmount);
    }

    function claimCommission() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No commission to withdraw");

        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // function withdraw() public onlyOwner {
    //     payable(owner()).transfer(address(this).balance);
    // }    

    function terminatePolicy(address _policyHolder) public {
        require(msg.sender == owner(), "Only owner can terminate policies");
        policies[_policyHolder].isActive = false;
    }




    /// @notice Gives tokens based on the amount of ETH sent
    /// @dev This implementation is prone to rounding problems
    // function purchaseTokens() external payable {
    //     paymentToken.mint(msg.sender, msg.value * purchaseRatio);
    // }


    function purchaseTokens() external payable {
        require(msg.value > 0, "Must send ETH to purchase tokens");
        require(address(this).balance < THRESHOLD, "once threshold is reached no more investors can add ETH");
        
        // // Calculate the new balance after adding the current transaction's value
        // uint256 newBalance = address(this).balance + msg.value;

        // Calculate the number of tokens to mint
        uint256 tokensToMint = msg.value * purchaseRatio;

        // Proceed to mint tokens if under threshold or exactly reaching the threshold
        paymentToken.mint(msg.sender, tokensToMint);

        // Update the investor's token balance in the mapping -- for now we are not worrying of them trnasferring to another wallet address
        investorTokenBalance[msg.sender] += tokensToMint;
    }







    /// @notice Returns a random number calculated from the previous block randao
    /// @dev This only works after The Merge
    function getRandomNumber() public view returns (uint256 randomNumber) {
        randomNumber = block.prevrandao;
    }




    /// @notice Burns `amount` tokens and give the equivalent ETH back to user
    function returnTokens(uint256 amount) external {
        paymentToken.burnFrom(msg.sender, amount);
        payable(msg.sender).transfer(amount / purchaseRatio);
    }
}
